import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTranscriptAiProviderChain,
  extractTranscriptWithAi,
  type TranscriptAiProviderChainOptions,
} from "../transcript-ai/transcript-ai-service.server.ts";
import type { TranscriptAiProvider } from "../transcript-ai/types.ts";
import { detectLanguageFromOcr } from "../translation/language-detection.ts";
import {
  createTranslationProviderChain,
  translateAcademicTranscript,
  type TranslationProviderChainOptions,
} from "../translation/translation-service.server.ts";
import type { AcademicTranslationResult } from "../translation/types.ts";
import { createAzureDocumentIntelligenceProvider } from "./providers/azure-document-intelligence.server.ts";
import { createGoogleDocumentAiProvider } from "./providers/google-document-ai.server.ts";
import { createMockOcrProvider } from "./providers/mock-ocr.server.ts";
import { matchTranscriptSourceFramework } from "./framework-match.ts";
import { parseTranscriptCandidates } from "./transcript-parser.server.ts";
import { TranscriptProcessingError, safeProcessingError } from "./transcript-processing-errors.ts";
import type {
  NormalizedOcrResult,
  OcrFileInput,
  OcrProvider,
  ParsedTranscriptFields,
  TranscriptCourseCandidateInput,
} from "./types.ts";

type EnvLike = Record<string, string | undefined>;

export type OcrProviderChainOptions = {
  allowMockFallback?: boolean;
};

function shouldAllowMockFallback(env: EnvLike, options?: OcrProviderChainOptions) {
  return options?.allowMockFallback === true;
}

export function createOcrProviderChain(
  env: EnvLike = process.env,
  options: OcrProviderChainOptions = {},
): OcrProvider[] {
  const providers = [
    createGoogleDocumentAiProvider(env),
    createAzureDocumentIntelligenceProvider(env),
  ];
  return shouldAllowMockFallback(env, options)
    ? [...providers, createMockOcrProvider()]
    : providers;
}

export function selectOcrProvider(
  providers: OcrProvider[] = createOcrProviderChain(),
): OcrProvider {
  const provider = providers.find((item) => item.isConfigured());
  if (!provider) throw new Error("No configured OCR provider is available.");
  return provider;
}

export async function runOcrProviderChain(
  input: OcrFileInput,
  providers: OcrProvider[] = createOcrProviderChain(),
): Promise<NormalizedOcrResult> {
  const warnings: string[] = [];
  const configuredProviders = providers.filter((provider) => provider.isConfigured());
  for (const [index, provider] of configuredProviders.entries()) {
    try {
      const result = await provider.extract(input);
      return { ...result, warnings: [...warnings, ...result.warnings] };
    } catch (error) {
      if (index === configuredProviders.length - 1) throw error;
      warnings.push(`${provider.id} OCR failed; trying the next configured provider.`);
    }
  }
  throw new TranscriptProcessingError(
    "config_validation",
    "provider_not_configured",
    "Google Document AI is not configured. Add server-side Document AI project, processor, location, and credentials before retrying.",
  );
}

function inferTranscriptMimeType(fileName?: string | null, storedMimeType?: string | null) {
  const mime = storedMimeType?.trim().toLowerCase();
  if (
    mime &&
    ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"].includes(mime)
  ) {
    return mime === "image/jpg" ? "image/jpeg" : mime;
  }
  const lowerName = (fileName ?? "").toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  if (lowerName.endsWith(".webp")) return "image/webp";
  return null;
}

function byteLength(bytes: ArrayBuffer | Uint8Array) {
  return bytes instanceof Uint8Array ? bytes.byteLength : bytes.byteLength;
}

async function loadReferenceRows(supabase: SupabaseClient) {
  const [countries, jurisdictions, curricula] = await Promise.all([
    supabase.from("countries").select("id,name,iso3,primary_languages"),
    supabase.from("jurisdictions").select("id,country_id,name,jurisdiction_type"),
    supabase.from("curricula").select("id,country_id,jurisdiction_id,name,curriculum_type"),
  ]);
  return {
    countries: countries.data ?? [],
    jurisdictions: jurisdictions.data ?? [],
    curricula: curricula.data ?? [],
  };
}

async function markManualFallback(
  supabase: SupabaseClient,
  transcriptId: string,
  userId: string,
  error: {
    message: string;
    stage?: string;
    code?: string;
    retryable?: boolean;
    manualEntryAvailable?: boolean;
  },
) {
  const aiFailure = error.stage === "ai_extraction";
  await supabase
    .from("transcripts")
    .update({
      status: "error",
      processing_status: "failed",
      processing_stage:
        error.stage === "ai_extraction"
          ? "ai_extraction_failed"
          : error.stage === "config_validation"
            ? "google_config_validation_failed"
            : error.stage === "google_request" || error.stage === "google_response"
              ? "google_ocr_failed"
              : "manual_entry_required",
      processing_error_code: error.code ?? null,
      processing_error_message: error.message,
      processing_completed_at: new Date().toISOString(),
      ocr_status: "manual_entry",
      ocr_error: error.message,
      ocr_error_stage: error.stage ?? null,
      ocr_error_code: error.code ?? null,
      ocr_error_message: error.message,
      ai_extraction_status: aiFailure ? "failed" : "manual_entry",
      ai_extraction_error: aiFailure ? error.message : null,
      ai_extraction_error_code: aiFailure ? (error.code ?? null) : null,
      ai_extraction_error_message: aiFailure ? error.message : null,
      translation_status: "manual_entry",
      translation_error: error.message,
      confirmation_status: "needs_review",
      requires_user_confirmation: true,
      requires_manual_entry: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transcriptId)
    .eq("user_id", userId);
}

function aiFallbackResult(input: {
  ocr: NormalizedOcrResult;
  translation: AcademicTranslationResult | null;
  primaryLanguage: string;
  error?: { code: string; message: string };
}): {
  fields: ParsedTranscriptFields;
  candidates: TranscriptCourseCandidateInput[];
  warnings: string[];
  provider: string | null;
  model: string | null;
  raw: unknown;
  status: "skipped" | "failed";
} {
  const parsed = parseTranscriptCandidates({
    ocr: input.ocr,
    translation: input.translation,
    primaryLanguageCode: input.primaryLanguage,
  });
  return {
    fields: parsed.fields,
    candidates: parsed.courses,
    warnings: [
      ...(input.error ? [input.error.message] : []),
      ...parsed.warnings,
      "AI extraction was unavailable; deterministic transcript parsing was used.",
    ],
    provider: null,
    model: null,
    raw: {
      fallback: "deterministic_parser",
      tableDetected: parsed.tableDetected,
      needsReview: parsed.needsReview,
      error: input.error ?? null,
    },
    status: input.error?.code === "provider_not_configured" ? "skipped" : "failed",
  };
}

export async function processTranscriptOcrAndTranslation(
  transcriptId: string,
  userId: string,
  options: {
    supabase: SupabaseClient;
    env?: EnvLike;
    ocrProviders?: OcrProvider[];
    transcriptAiProviders?: TranscriptAiProvider[];
    transcriptAiProviderOptions?: TranscriptAiProviderChainOptions;
    translationProviderOptions?: TranslationProviderChainOptions;
    allowMockFallback?: boolean;
  },
) {
  const supabase = options.supabase;
  const env = options.env ?? process.env;
  const { data: transcript, error: transcriptError } = await supabase
    .from("transcripts")
    .select("*, student_profiles(*)")
    .eq("id", transcriptId)
    .eq("user_id", userId)
    .single();

  if (transcriptError || !transcript) throw new Error("Transcript was not found for this user.");
  if (!transcript.storage_path) {
    await markManualFallback(supabase, transcriptId, userId, {
      message: "Transcript file is not available in private storage.",
      stage: "storage_download",
      code: "storage_path_missing",
    });
    return { transcriptId, status: "manual_entry" as const };
  }

  await supabase
    .from("transcripts")
    .update({
      status: "processing",
      processing_status: "processing",
      processing_stage: "upload_saved",
      processing_error_code: null,
      processing_error_message: null,
      processing_started_at: new Date().toISOString(),
      ocr_status: "processing",
      ocr_started_at: new Date().toISOString(),
      ocr_error: null,
      ocr_error_stage: null,
      ocr_error_code: null,
      translation_status: "not_needed",
      requires_user_confirmation: true,
      requires_manual_entry: false,
      confirmation_status: "processing",
    })
    .eq("id", transcriptId)
    .eq("user_id", userId);

  try {
    const storage = await supabase.storage.from("transcripts").download(transcript.storage_path);
    if (storage.error || !storage.data) {
      throw new TranscriptProcessingError(
        "storage_download",
        "storage_download_failed",
        "Unable to download transcript from private storage.",
      );
    }
    const bytes = await storage.data.arrayBuffer();
    if (!byteLength(bytes)) {
      throw new TranscriptProcessingError(
        "storage_download",
        "uploaded_file_empty",
        "The uploaded transcript file is empty.",
      );
    }
    const mimeType = inferTranscriptMimeType(
      transcript.original_filename,
      transcript.file_type ?? storage.data.type,
    );
    if (!mimeType) {
      throw new TranscriptProcessingError(
        "mime_detection",
        "unsupported_or_missing_mime_type",
        "The uploaded transcript file type is missing or unsupported. Upload PDF, JPG, PNG, or WEBP.",
      );
    }
    const ocrInput: OcrFileInput = {
      transcriptId,
      fileName: transcript.original_filename,
      mimeType,
      bytes,
    };
    await supabase
      .from("transcripts")
      .update({
        uploaded_file_path: transcript.storage_path,
        uploaded_file_name: transcript.original_filename,
        uploaded_file_mime_type: mimeType,
        uploaded_file_size_bytes: byteLength(bytes),
        file_type: mimeType,
        processing_status: "ocr_request",
        processing_stage: "google_ocr_started",
      })
      .eq("id", transcriptId)
      .eq("user_id", userId);
    const ocr = await runOcrProviderChain(
      ocrInput,
      options.ocrProviders ??
        createOcrProviderChain(env, {
          allowMockFallback: options.allowMockFallback,
        }),
    );
    const languageDetection = detectLanguageFromOcr(ocr);
    const primaryLanguage = languageDetection.primaryLanguageCode;
    let translation: AcademicTranslationResult | null = null;

    if (primaryLanguage !== "en") {
      await supabase
        .from("transcripts")
        .update({
          translation_status: "processing",
          translation_started_at: new Date().toISOString(),
          processing_status: "translation",
          processing_stage: "translation_started",
        })
        .eq("id", transcriptId)
        .eq("user_id", userId);
      translation = await translateAcademicTranscript(
        {
          text: ocr.rawText,
          sourceLanguageCode: primaryLanguage,
          targetLanguageCode: "en",
        },
        createTranslationProviderChain(env, {
          allowMockFallback: options.allowMockFallback,
          ...options.translationProviderOptions,
        }),
      );
    }

    await supabase
      .from("transcripts")
      .update({
        processing_status: "ai_extraction",
        processing_stage: "ai_extraction_started",
        ai_extraction_status: "processing",
        ocr_status:
          ocr.averageConfidence != null && ocr.averageConfidence < 0.75
            ? "needs_review"
            : "succeeded",
        ocr_provider: ocr.provider,
        ocr_raw_text: ocr.rawText,
        ocr_raw_json: ocr,
        ocr_raw: ocr,
        ocr_confidence: ocr.averageConfidence ?? null,
        ocr_page_count: ocr.pages.length,
        ocr_language_codes: languageDetection.languages.map((language) => language.languageCode),
        detected_language_codes: languageDetection.languages.map(
          (language) => language.languageCode,
        ),
        primary_language_code: primaryLanguage,
        original_language: primaryLanguage,
      })
      .eq("id", transcriptId)
      .eq("user_id", userId);

    let extraction = null as Awaited<ReturnType<typeof extractTranscriptWithAi>> | null;
    let extractionFallback: ReturnType<typeof aiFallbackResult> | null = null;
    let aiError: { code: string; message: string } | null = null;
    try {
      extraction = await extractTranscriptWithAi(
        {
          ocr,
          translatedTextEn: translation?.translatedText ?? null,
          primaryLanguageCode: primaryLanguage,
          uploadedFile: {
            fileName: transcript.original_filename,
            mimeType,
            sizeBytes: byteLength(bytes),
          },
          profileContext: {
            sourceCountry: transcript.student_profiles?.origin_country,
            sourceJurisdiction: transcript.student_profiles?.source_jurisdiction_label,
            sourceCurriculum: transcript.student_profiles?.source_curriculum,
            destinationCountry: transcript.student_profiles?.destination_country,
            destinationJurisdiction: transcript.student_profiles?.destination_jurisdiction_label,
            destinationFramework: transcript.student_profiles?.destination_framework_label,
          },
        },
        options.transcriptAiProviders ??
          createTranscriptAiProviderChain(env, {
            allowMockFallback: options.allowMockFallback,
            ...options.transcriptAiProviderOptions,
          }),
      );
    } catch (error) {
      const safeAiError = safeProcessingError(error);
      aiError = { code: safeAiError.code, message: safeAiError.message };
      extractionFallback = aiFallbackResult({
        ocr,
        translation,
        primaryLanguage,
        error: aiError,
      });
    }
    const extractionFields = extraction?.fields ?? extractionFallback?.fields ?? {};
    const extractionCandidates = extraction?.candidates ?? extractionFallback?.candidates ?? [];
    const extractionProvider =
      extraction?.rawResult.provider ?? extractionFallback?.provider ?? null;
    const extractionModel = extraction?.rawResult.model ?? extractionFallback?.model ?? null;
    const extractionRaw = extraction?.rawResult.raw ?? extractionFallback?.raw ?? null;
    const extractionStatus = extraction?.rawResult.provider
      ? "succeeded"
      : (extractionFallback?.status ?? "failed");
    const references = await loadReferenceRows(supabase);
    const profile = transcript.student_profiles ?? {};
    const detectedText = [
      extraction?.rawResult.detected_source.country,
      extraction?.rawResult.detected_source.jurisdiction,
      extraction?.rawResult.detected_source.curriculum,
      extraction?.rawResult.detected_source.board,
      extractionFields.issuing_country,
      extractionFields.issuing_state_province_jurisdiction,
      extractionFields.board_name,
    ]
      .filter(Boolean)
      .join("\n");
    const frameworkMatch = matchTranscriptSourceFramework({
      rawText: `${ocr.rawText}\n${detectedText}`,
      translatedText: translation?.translatedText,
      languageDetection,
      profile: {
        sourceCountryId: profile.source_country_id,
        sourceCountryLabel: profile.origin_country,
        sourceCurriculumId: profile.source_curriculum_id,
        sourceCurriculumLabel: profile.source_curriculum,
      },
      ...references,
    });

    await supabase
      .from("transcript_course_candidates")
      .delete()
      .eq("transcript_id", transcriptId)
      .eq("user_id", userId);
    if (extractionCandidates.length) {
      const { error: candidateError } = await supabase.from("transcript_course_candidates").insert(
        extractionCandidates.map((course) => ({
          ...course,
          transcript_id: transcriptId,
          user_id: userId,
        })),
      );
      if (candidateError) {
        throw new TranscriptProcessingError(
          "candidate_save",
          "candidate_insert_failed",
          "OCR succeeded, but Scholaport could not save extracted course candidates.",
        );
      }
    }

    const now = new Date().toISOString();
    const translationNeedsReview =
      translation && (translation.confidence == null || translation.confidence < 0.75);
    const hasCandidates = extractionCandidates.length > 0;
    await supabase
      .from("transcripts")
      .update({
        status: "completed",
        processing_status: hasCandidates ? "needs_review" : "manual_entry_required",
        processing_stage: hasCandidates ? "review_ready" : "manual_entry_required",
        processing_error_code: hasCandidates
          ? null
          : (aiError?.code ?? "no_safe_course_candidates"),
        processing_error_message: hasCandidates
          ? null
          : (aiError?.message ??
            "OCR succeeded, but Scholaport could not produce safe review candidates."),
        processing_completed_at: now,
        ocr_status:
          ocr.averageConfidence != null && ocr.averageConfidence < 0.75
            ? "needs_review"
            : "succeeded",
        ocr_provider: ocr.provider,
        ocr_completed_at: now,
        ocr_error: null,
        ocr_error_stage: null,
        ocr_error_code: null,
        ocr_error_message: null,
        ocr_raw_text: ocr.rawText,
        ocr_raw_json: ocr,
        ocr_raw: ocr,
        ocr_confidence: ocr.averageConfidence ?? null,
        ocr_page_count: ocr.pages.length,
        ocr_language_codes: languageDetection.languages.map((language) => language.languageCode),
        detected_language_codes: languageDetection.languages.map(
          (language) => language.languageCode,
        ),
        primary_language_code: primaryLanguage,
        original_language: primaryLanguage,
        translation_status: translation
          ? translationNeedsReview
            ? "needs_review"
            : "succeeded"
          : "not_needed",
        translation_provider: translation?.provider ?? null,
        translation_completed_at: translation ? now : null,
        translation_error: null,
        translated_text_en:
          translation?.translatedText ?? (primaryLanguage === "en" ? ocr.rawText : null),
        translation_confidence: translation?.confidence ?? (primaryLanguage === "en" ? 1 : null),
        ai_extraction_status: extractionStatus,
        ai_extraction_provider: extractionProvider,
        ai_extraction_model: extractionModel,
        ai_extraction_error: aiError?.message ?? null,
        ai_extraction_error_code: aiError?.code ?? null,
        ai_extraction_error_message: aiError?.message ?? null,
        ai_extraction_raw_json: extractionRaw,
        detected_source_country_id: frameworkMatch.detectedSourceCountryId,
        detected_source_jurisdiction_id: frameworkMatch.detectedSourceJurisdictionId,
        detected_source_curriculum_id: frameworkMatch.detectedSourceCurriculumId,
        detected_source_country: frameworkMatch.detectedSourceCountryLabel,
        detected_source_jurisdiction: frameworkMatch.detectedSourceJurisdictionLabel,
        detected_source_curriculum: frameworkMatch.detectedSourceCurriculumLabel,
        detected_document_type:
          extraction?.rawResult.document_metadata.document_type ??
          extractionFields.exam_name ??
          null,
        selected_source_country_id: frameworkMatch.selectedSourceCountryId,
        selected_source_jurisdiction_id: frameworkMatch.selectedSourceJurisdictionId,
        selected_source_curriculum_id: frameworkMatch.selectedSourceCurriculumId,
        source_selection_method: frameworkMatch.sourceSelectionMethod,
        framework_match_status: frameworkMatch.status,
        framework_match_confidence: frameworkMatch.confidence,
        profile_match_status:
          frameworkMatch.status === "matched_profile"
            ? "matches_profile"
            : frameworkMatch.status === "detected_different_framework"
              ? "mismatch"
              : frameworkMatch.status === "ambiguous"
                ? "possible_match"
                : "unknown",
        profile_match_confidence: frameworkMatch.confidence,
        requires_user_confirmation: true,
        requires_source_confirmation: frameworkMatch.status !== "matched_profile",
        confirmation_status: "needs_review",
        requires_manual_entry: !hasCandidates,
      })
      .eq("id", transcriptId)
      .eq("user_id", userId);

    return {
      transcriptId,
      status: hasCandidates ? ("needs_review" as const) : ("manual_entry" as const),
      ocrProvider: ocr.provider,
      aiExtractionProvider: extractionProvider,
      translationProvider: translation?.provider ?? null,
      primaryLanguageCode: primaryLanguage,
      candidateCount: extractionCandidates.length,
      frameworkMatchStatus: frameworkMatch.status,
      aiExtractionStatus: extractionStatus,
      error: hasCandidates ? undefined : (aiError?.message ?? "Manual entry is required."),
      errorCode: hasCandidates ? undefined : (aiError?.code ?? "no_safe_course_candidates"),
      manualEntryAvailable: true,
    };
  } catch (error) {
    const safeError = safeProcessingError(error);
    await markManualFallback(supabase, transcriptId, userId, safeError);
    return {
      transcriptId,
      status: "manual_entry" as const,
      error: safeError.message,
      errorStage: safeError.stage,
      errorCode: safeError.code,
      retryable: safeError.retryable,
      manualEntryAvailable: safeError.manualEntryAvailable,
    };
  }
}
