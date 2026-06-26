import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createOcrProviderChain,
  runOcrProviderChain,
  selectOcrProvider,
} from "../src/lib/ocr/ocr-service.server.ts";
import {
  createMockOcrProvider,
  mockSpanishTranscriptText,
  mockTamilTranscriptText,
} from "../src/lib/ocr/providers/mock-ocr.server.ts";
import { matchTranscriptSourceFramework } from "../src/lib/ocr/framework-match.ts";
import { parseTranscriptCandidates } from "../src/lib/ocr/transcript-parser.server.ts";
import type { OcrProvider } from "../src/lib/ocr/types.ts";
import { detectLanguageFromText } from "../src/lib/translation/language-detection.ts";
import { createMockTranslationProvider } from "../src/lib/translation/providers/mock-translation.server.ts";
import {
  createTranslationProviderChain,
  selectTranslationProvider,
  translateAcademicTranscript,
} from "../src/lib/translation/translation-service.server.ts";
import type { AcademicTranslationResult } from "../src/lib/translation/types.ts";

function textBytes(text: string) {
  return new TextEncoder().encode(text);
}

test("OCR provider selection prefers Google Document AI before Azure", () => {
  const providers = createOcrProviderChain(
    {
      GOOGLE_DOCUMENT_AI_PROJECT_ID: "project",
      GOOGLE_DOCUMENT_AI_LOCATION: "us",
      GOOGLE_DOCUMENT_AI_PROCESSOR_ID: "processor",
      GOOGLE_DOCUMENT_AI_ACCESS_TOKEN: "token",
      AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: "https://example.cognitiveservices.azure.com",
      AZURE_DOCUMENT_INTELLIGENCE_KEY: "azure-key",
    },
    { allowMockFallback: true },
  );
  assert.equal(selectOcrProvider(providers).id, "google_document_ai");
});

test("OCR provider chain uses mock only when explicitly allowed", () => {
  assert.throws(() => selectOcrProvider(createOcrProviderChain({}, { allowMockFallback: false })));
  assert.equal(
    selectOcrProvider(createOcrProviderChain({}, { allowMockFallback: true })).id,
    "mock",
  );
});

test("Production transcript API disables mock OCR even when local mock env is set", () => {
  const route = readFileSync("src/routes/api/v1/transcripts.ts", "utf8");
  assert.match(route, /allowMockFallback: false/);
  assert.doesNotMatch(route, /SCHOLAPORT_ALLOW_MOCK_TRANSCRIPT_PROCESSING/);
});

test("Translation provider selection prefers Gemini before OpenAI", () => {
  const providers = createTranslationProviderChain({
    GEMINI_API_KEY: "gemini-key",
    OPENAI_API_KEY: "openai-key",
  });
  assert.equal(selectTranslationProvider(providers).id, "gemini");
});

test("Translation provider chain uses mock only when explicitly allowed", () => {
  assert.throws(() => selectTranslationProvider(createTranslationProviderChain({})));
  assert.equal(
    selectTranslationProvider(createTranslationProviderChain({}, { allowMockFallback: true })).id,
    "mock",
  );
});

test("Mock OCR returns a Tamil transcript fixture for local/test processing", async () => {
  const ocr = await createMockOcrProvider().extract({
    fileName: "tamil-transcript.txt",
    mimeType: "text/plain",
    bytes: new Uint8Array(),
  });
  assert.equal(ocr.provider, "mock");
  assert.match(ocr.rawText, /கணிதம்/);
  assert.equal(ocr.detectedLanguages[0]?.languageCode, "ta");
});

test("Mock Tamil academic translation preserves original text and translates meaning", async () => {
  const translation = await translateAcademicTranscript(
    { text: mockTamilTranscriptText, sourceLanguageCode: "ta" },
    [createMockTranslationProvider()],
  );
  assert.equal(translation.originalText, mockTamilTranscriptText);
  assert.match(translation.translatedText, /Mathematics/);
  assert.match(translation.translatedText, /Social Science/);
});

test("Mock Spanish academic translation handles academic course equivalents", async () => {
  const translation = await translateAcademicTranscript(
    { text: mockSpanishTranscriptText, sourceLanguageCode: "es" },
    [createMockTranslationProvider()],
  );
  assert.match(translation.translatedText, /Mathematics/);
  assert.match(translation.translatedText, /Biology II/);
});

test("Arabic and Urdu script fallback detection chooses the best available language hint", () => {
  const arabic = detectLanguageFromText(
    "المدرسة: مدرسة النور\nالمادة | درجة\nدراسات اجتماعية | 90",
  );
  assert.equal(arabic.primaryLanguageCode, "ar");
  const urdu = detectLanguageFromText("طالب علم\nمضمون | نمبر\nریاضی | 88\nتعلیمی سال");
  assert.equal(urdu.primaryLanguageCode, "ur");
});

test("English transcript detection means translation can be skipped", () => {
  const detection = detectLanguageFromText(
    "Student Name: Alex Chen\nSubject | Marks | Max Marks\nMathematics | 95 | 100",
  );
  assert.equal(detection.primaryLanguageCode, "en");
  assert.equal(detection.ambiguous, false);
});

test("Parser extracts Tamil table rows using translated headers", async () => {
  const ocr = await createMockOcrProvider().extract({
    fileName: "tamil-transcript.txt",
    mimeType: "text/plain",
    bytes: textBytes(mockTamilTranscriptText),
  });
  const translation = await translateAcademicTranscript(
    { text: ocr.rawText, sourceLanguageCode: "ta" },
    [createMockTranslationProvider()],
  );
  const parsed = parseTranscriptCandidates({ ocr, translation, primaryLanguageCode: "ta" });
  assert.equal(parsed.tableDetected, true);
  assert.ok(parsed.courses.some((course) => course.course_name_translated === "Mathematics"));
});

test("Low-confidence translation marks course rows as needing review", async () => {
  const ocr = await createMockOcrProvider().extract({
    fileName: "spanish-transcript.txt",
    mimeType: "text/plain",
    bytes: textBytes(mockSpanishTranscriptText),
  });
  const lowConfidenceTranslation: AcademicTranslationResult = {
    provider: "mock",
    sourceLanguageCode: "es",
    targetLanguageCode: "en",
    originalText: ocr.rawText,
    translatedText: ocr.rawText
      .replace("Asignatura", "Subject")
      .replace("Matemáticas", "Mathematics"),
    confidence: 0.62,
    translatedFields: [
      {
        fieldType: "header",
        originalText: "Asignatura",
        translatedText: "Subject",
        confidence: 0.62,
      },
      {
        fieldType: "course_name",
        originalText: "Matemáticas",
        translatedText: "Mathematics",
        confidence: 0.62,
      },
    ],
    warnings: ["low confidence"],
  };
  const parsed = parseTranscriptCandidates({
    ocr,
    translation: lowConfidenceTranslation,
    primaryLanguageCode: "es",
  });
  assert.ok(parsed.courses.some((course) => course.needs_review));
  assert.ok(
    parsed.courses.some((course) => /Translation confidence/.test(course.review_reason ?? "")),
  );
});

test("OCR failure without configured live provider does not fall back to fake production rows", async () => {
  const failingProvider: OcrProvider = {
    id: "mistral_ocr",
    isConfigured: () => true,
    extract: async () => {
      throw new Error("live OCR failed");
    },
  };
  await assert.rejects(
    () =>
      runOcrProviderChain(
        { bytes: textBytes("anything"), fileName: "x.pdf", mimeType: "application/pdf" },
        [failingProvider],
      ),
    /mistral_ocr OCR failed/,
  );
});

test("Framework matcher flags profile mismatch against detected Tamil Nadu transcript", () => {
  const result = matchTranscriptSourceFramework({
    rawText: mockTamilTranscriptText,
    languageDetection: detectLanguageFromText(mockTamilTranscriptText),
    profile: {
      sourceCountryLabel: "India",
      sourceCurriculumLabel: "CBSE",
    },
  });
  assert.equal(result.status, "detected_different_framework");
  assert.ok(result.requiresReview);
});

test("Student override action is implemented in the transcript API route", () => {
  const route = readFileSync("src/routes/api/v1/transcripts.ts", "utf8");
  assert.match(route, /switch_selected_source_framework/);
  assert.match(route, /student_override/);
  assert.match(route, /profile_default/);
  assert.match(route, /ocr_detected/);
});

test("Confirmed course save inserts only candidate rows after confirmation", () => {
  const route = readFileSync("src/routes/api/v1/transcripts.ts", "utf8");
  assert.match(route, /confirm_transcript_courses/);
  assert.match(route, /from\("transcript_courses"\)\.insert/);
  assert.match(route, /student_confirmed: true/);
  assert.match(route, /mapping_status: "confirmed_unmapped"/);
});

test("Original transcript text is preserved after translation", async () => {
  const translation = await translateAcademicTranscript(
    { text: mockTamilTranscriptText, sourceLanguageCode: "ta" },
    [createMockTranslationProvider()],
  );
  assert.equal(translation.originalText, mockTamilTranscriptText);
  assert.notEqual(translation.translatedText, translation.originalText);
});

test("Course translation is editable before confirmation", () => {
  const clientApi = readFileSync("src/lib/scholaport-api.ts", "utf8");
  const page = readFileSync("src/routes/transcript.tsx", "utf8");
  assert.match(clientApi, /saveEditedTranscriptCandidate/);
  assert.match(page, /English translation/);
  assert.match(page, /Save row/);
});

test("RLS prevents users from accessing another user's OCR or translation candidates", () => {
  const migration = readFileSync(
    "supabase/migrations/202606250001_transcript_ocr_translation_review.sql",
    "utf8",
  );
  assert.match(
    migration,
    /alter table public\.transcript_course_candidates enable row level security/,
  );
  assert.match(
    migration,
    /using \(user_id = auth\.uid\(\)\) with check \(user_id = auth\.uid\(\)\)/,
  );
  assert.match(migration, /transcripts_ocr_status_check/);
});

test("OCR and translation provider keys are not exposed through VITE frontend env names", () => {
  const files = [
    "src/routes/transcript.tsx",
    "src/lib/scholaport-api.ts",
    "src/lib/supabase.ts",
    "vite.config.ts",
  ];
  const frontend = files.map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(
    frontend,
    /VITE_(MISTRAL|GOOGLE_DOCUMENT_AI|AZURE_DOCUMENT|AWS_|GEMINI|OPENAI)/,
  );
});
