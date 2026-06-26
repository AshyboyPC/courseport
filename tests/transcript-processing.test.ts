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
import { createGoogleDocumentAiProvider } from "../src/lib/ocr/providers/google-document-ai.server.ts";
import { matchTranscriptSourceFramework } from "../src/lib/ocr/framework-match.ts";
import { parseTranscriptCandidates } from "../src/lib/ocr/transcript-parser.server.ts";
import type { OcrProvider } from "../src/lib/ocr/types.ts";
import { TranscriptProcessingError } from "../src/lib/ocr/transcript-processing-errors.ts";
import {
  createTranscriptAiProviderChain,
  extractTranscriptWithAi,
  selectTranscriptAiProvider,
} from "../src/lib/transcript-ai/transcript-ai-service.server.ts";
import { validateTranscriptAiExtraction } from "../src/lib/transcript-ai/transcript-extraction-validator.ts";
import type { TranscriptAiExtractionResult } from "../src/lib/transcript-ai/types.ts";
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

function simpleOcr(rawText: string) {
  return {
    provider: "google_document_ai" as const,
    rawText,
    detectedLanguages: [{ languageCode: "en", confidence: 0.96 }],
    pages: [
      {
        pageNumber: 1,
        text: rawText,
        blocks: [],
        tables: [],
      },
    ],
    averageConfidence: 0.91,
    warnings: [],
  };
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
  assert.match(route, /transcriptAiProviderOptions: \{ allowMockFallback: false \}/);
  assert.doesNotMatch(route, /SCHOLAPORT_ALLOW_MOCK_TRANSCRIPT_PROCESSING/);
});

test("Transcript AI provider selection prefers OpenAI before Gemini", () => {
  const providers = createTranscriptAiProviderChain({
    OPENAI_API_KEY: "openai-key",
    GEMINI_API_KEY: "gemini-key",
  });
  assert.equal(selectTranscriptAiProvider(providers).id, "openai");
});

test("Transcript AI provider chain uses mock only when explicitly allowed", () => {
  assert.throws(() => selectTranscriptAiProvider(createTranscriptAiProviderChain({})));
  assert.equal(
    selectTranscriptAiProvider(createTranscriptAiProviderChain({}, { allowMockFallback: true })).id,
    "mock",
  );
});

test("AI extraction validates course candidates against OCR-backed evidence", () => {
  const extraction: TranscriptAiExtractionResult = {
    provider: "openai",
    model: "test-model",
    document_metadata: { document_type: "transcript", academic_year: null, grade_level: "10" },
    detected_source: {
      country: "India",
      jurisdiction: "Tamil Nadu",
      curriculum: null,
      board: null,
    },
    detected_languages: [{ language_code: "en", confidence: 0.95 }],
    student_identity_fields: { student_name: "Test Student" },
    institution_fields: { school_name: "Test School" },
    exam_certificate_fields: { exam_name: null },
    course_candidates: [
      {
        original_course_name: "Mathematics",
        translated_course_name: null,
        normalized_course_name: "mathematics",
        subject_category: "mathematics",
        original_grade_value: "95/100",
        original_grade_scale: "100",
        max_marks: "100",
        obtained_marks: "95",
        credits: null,
        term_label: null,
        academic_year: null,
        page_number: 1,
        source_text: "Mathematics 95/100",
        extraction_confidence: 0.9,
        translation_confidence: null,
        needs_review: false,
        review_reason: null,
      },
      {
        original_course_name: "Invented Robotics",
        translated_course_name: null,
        normalized_course_name: "invented robotics",
        subject_category: "computer_science",
        original_grade_value: "100/100",
        original_grade_scale: "100",
        max_marks: "100",
        obtained_marks: "100",
        credits: null,
        term_label: null,
        academic_year: null,
        page_number: 1,
        source_text: "Invented Robotics 100/100",
        extraction_confidence: 0.9,
        translation_confidence: null,
        needs_review: false,
        review_reason: null,
      },
    ],
    total_marks_fields: {},
    confidence: 0.88,
    warnings: [],
    missing_fields: [],
    review_reasons: [],
    raw: {},
  };
  const validated = validateTranscriptAiExtraction({
    result: extraction,
    ocrText: "Student Name: Test Student\nMathematics 95/100\nScience 88/100",
    primaryLanguageCode: "en",
  });
  assert.equal(validated.candidates.length, 1);
  assert.equal(validated.candidates[0]?.course_name_original, "Mathematics");
  assert.ok(validated.warnings.some((warning) => /without OCR-backed evidence/.test(warning)));
});

test("AI extraction fails safely when no live provider is configured", async () => {
  await assert.rejects(
    () =>
      extractTranscriptWithAi(
        {
          ocr: simpleOcr("Mathematics 95/100"),
          primaryLanguageCode: "en",
          uploadedFile: { fileName: "transcript.pdf", mimeType: "application/pdf" },
        },
        createTranscriptAiProviderChain({}, { allowMockFallback: false }),
      ),
    (error) =>
      error instanceof TranscriptProcessingError &&
      error.stage === "ai_extraction" &&
      error.code === "provider_not_configured",
  );
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
    /live OCR failed/,
  );
});

test("Missing Google config fails at config validation stage", async () => {
  const provider = createGoogleDocumentAiProvider({});
  assert.equal(provider.isConfigured(), false);
  await assert.rejects(
    () =>
      provider.extract({
        fileName: "transcript.pdf",
        mimeType: "application/pdf",
        bytes: textBytes("%PDF-1.7"),
      }),
    (error) =>
      error instanceof TranscriptProcessingError &&
      error.stage === "config_validation" &&
      error.code === "provider_not_configured",
  );
});

test("Google Document AI request sends real bytes and preserves PDF MIME type", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody: { rawDocument?: { content?: string; mimeType?: string } } | null = null;
  globalThis.fetch = (async (_url, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        document: {
          text: "Subject | Marks | Max Marks\nMathematics | 95 | 100",
          pages: [{ pageNumber: 1, lines: [] }],
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;
  try {
    const provider = createGoogleDocumentAiProvider({
      GOOGLE_DOCUMENT_AI_PROJECT_ID: "project",
      GOOGLE_DOCUMENT_AI_LOCATION: "us",
      GOOGLE_DOCUMENT_AI_PROCESSOR_ID: "processor",
      GOOGLE_DOCUMENT_AI_ACCESS_TOKEN: "token",
    });
    const result = await provider.extract({
      fileName: "transcript.pdf",
      mimeType: "application/pdf",
      bytes: textBytes("%PDF-1.7 transcript bytes"),
    });
    assert.equal(result.provider, "google_document_ai");
    assert.equal(requestBody?.rawDocument?.mimeType, "application/pdf");
    assert.ok(requestBody?.rawDocument?.content);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Google billing-style API error is stored as provider billing unavailable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        error: {
          status: "PERMISSION_DENIED",
          message: "This API method requires billing to be enabled.",
        },
      }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    )) as typeof fetch;
  try {
    const provider = createGoogleDocumentAiProvider({
      GOOGLE_DOCUMENT_AI_PROJECT_ID: "project",
      GOOGLE_DOCUMENT_AI_LOCATION: "us",
      GOOGLE_DOCUMENT_AI_PROCESSOR_ID: "processor",
      GOOGLE_DOCUMENT_AI_ACCESS_TOKEN: "token",
    });
    await assert.rejects(
      () =>
        provider.extract({
          fileName: "transcript.pdf",
          mimeType: "application/pdf",
          bytes: textBytes("%PDF-1.7 transcript bytes"),
        }),
      (error) =>
        error instanceof TranscriptProcessingError &&
        error.stage === "google_response" &&
        error.code === "provider_billing_unavailable",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("General line parser extracts transcript-like rows without Tamil Nadu-specific format", () => {
  const parsed = parseTranscriptCandidates({
    primaryLanguageCode: "en",
    ocr: {
      provider: "google_document_ai",
      rawText: [
        "Student Name: Example Student",
        "International School",
        "English Language 88/100",
        "Mathematics 91/100",
        "Biology 84/100",
        "Total 263/300",
      ].join("\n"),
      detectedLanguages: [{ languageCode: "en", confidence: 0.95 }],
      pages: [],
      averageConfidence: 0.88,
      warnings: [],
    },
  });
  assert.equal(parsed.tableDetected, false);
  assert.ok(parsed.courses.some((course) => course.course_name_original === "Mathematics"));
  assert.ok(parsed.courses.every((course) => course.needs_review));
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
  assert.match(migration, /ocr_error_stage/);
  assert.match(migration, /uploaded_file_mime_type/);
  assert.match(migration, /requires_manual_entry/);
});

test("Transcript UI exposes safe OCR failure stage and keeps manual fallback", () => {
  const page = readFileSync("src/routes/transcript.tsx", "utf8");
  assert.match(page, /Failed at \{stageLabel\}/);
  assert.match(page, /Provider setup is missing/);
  assert.match(page, /Provider billing or credits may not be enabled/);
  assert.match(page, /Your uploaded file is still attached/);
  assert.match(page, /Add manual row/);
});

test("Transcript API route returns structured JSON errors for handled failures", () => {
  const route = readFileSync("src/routes/api/v1/transcripts.ts", "utf8");
  assert.match(route, /transcriptApiError/);
  assert.match(route, /manualEntryAvailable/);
  assert.match(route, /retryable/);
  assert.match(route, /transcriptId/);
});

test("Frontend transcript fetch wrapper does not surface only Failed to fetch", () => {
  const api = readFileSync("src/lib/scholaport-api.ts", "utf8");
  assert.match(api, /TranscriptApiError/);
  assert.match(api, /frontend_fetch_failed/);
  assert.match(api, /non-JSON response/);
  assert.doesNotMatch(api, /throw new Error\(.*Failed to fetch/);
});

test("OCR success with AI unavailable can fall back to deterministic parsing", () => {
  const service = readFileSync("src/lib/ocr/ocr-service.server.ts", "utf8");
  assert.match(service, /aiFallbackResult/);
  assert.match(service, /parseTranscriptCandidates/);
  assert.match(service, /AI extraction was unavailable; deterministic transcript parsing was used/);
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
