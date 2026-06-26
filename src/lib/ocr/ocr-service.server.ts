import type { SupabaseClient } from "@supabase/supabase-js";
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
import type { NormalizedOcrResult, OcrFileInput, OcrProvider } from "./types.ts";

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
  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    try {
      const result = await provider.extract(input);
      return { ...result, warnings: [...warnings, ...result.warnings] };
    } catch (error) {
      warnings.push(`${provider.id} OCR failed; trying the next configured provider.`);
    }
  }
  throw new Error(
    warnings.length ? warnings.join(" ") : "No configured OCR provider is available.",
  );
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Transcript processing failed.";
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
  reason: string,
) {
  await supabase
    .from("transcripts")
    .update({
      status: "error",
      ocr_status: "manual_entry",
      ocr_error: reason,
      translation_status: "manual_entry",
      translation_error: reason,
      confirmation_status: "needs_review",
      requires_user_confirmation: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transcriptId)
    .eq("user_id", userId);
}

export async function processTranscriptOcrAndTranslation(
  transcriptId: string,
  userId: string,
  options: {
    supabase: SupabaseClient;
    env?: EnvLike;
    ocrProviders?: OcrProvider[];
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
    await markManualFallback(
      supabase,
      transcriptId,
      userId,
      "Transcript file is not available in private storage.",
    );
    return { transcriptId, status: "manual_entry" as const };
  }

  await supabase
    .from("transcripts")
    .update({
      status: "processing",
      ocr_status: "processing",
      ocr_started_at: new Date().toISOString(),
      translation_status: "not_needed",
      requires_user_confirmation: true,
      confirmation_status: "processing",
    })
    .eq("id", transcriptId)
    .eq("user_id", userId);

  try {
    const storage = await supabase.storage.from("transcripts").download(transcript.storage_path);
    if (storage.error || !storage.data) {
      throw new Error("Unable to download transcript from private storage.");
    }
    const bytes = await storage.data.arrayBuffer();
    const ocrInput: OcrFileInput = {
      transcriptId,
      fileName: transcript.original_filename,
      mimeType: transcript.file_type,
      bytes,
    };
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

    const parseResult = parseTranscriptCandidates({
      ocr,
      translation,
      primaryLanguageCode: primaryLanguage,
    });
    const references = await loadReferenceRows(supabase);
    const profile = transcript.student_profiles ?? {};
    const frameworkMatch = matchTranscriptSourceFramework({
      rawText: ocr.rawText,
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
    if (parseResult.courses.length) {
      const { error: candidateError } = await supabase.from("transcript_course_candidates").insert(
        parseResult.courses.map((course) => ({
          ...course,
          transcript_id: transcriptId,
          user_id: userId,
        })),
      );
      if (candidateError) throw candidateError;
    }

    const now = new Date().toISOString();
    const translationNeedsReview =
      translation && (translation.confidence == null || translation.confidence < 0.75);
    await supabase
      .from("transcripts")
      .update({
        status: "completed",
        ocr_status:
          ocr.averageConfidence != null && ocr.averageConfidence < 0.75
            ? "needs_review"
            : "succeeded",
        ocr_provider: ocr.provider,
        ocr_completed_at: now,
        ocr_error: null,
        ocr_raw_text: ocr.rawText,
        ocr_raw_json: ocr,
        ocr_raw: ocr,
        ocr_confidence: ocr.averageConfidence ?? null,
        ocr_page_count: ocr.pages.length,
        ocr_language_codes: languageDetection.languages.map((language) => language.languageCode),
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
        detected_source_country_id: frameworkMatch.detectedSourceCountryId,
        detected_source_jurisdiction_id: frameworkMatch.detectedSourceJurisdictionId,
        detected_source_curriculum_id: frameworkMatch.detectedSourceCurriculumId,
        selected_source_country_id: frameworkMatch.selectedSourceCountryId,
        selected_source_jurisdiction_id: frameworkMatch.selectedSourceJurisdictionId,
        selected_source_curriculum_id: frameworkMatch.selectedSourceCurriculumId,
        source_selection_method: frameworkMatch.sourceSelectionMethod,
        framework_match_status: frameworkMatch.status,
        framework_match_confidence: frameworkMatch.confidence,
        requires_user_confirmation: true,
        confirmation_status: "needs_review",
      })
      .eq("id", transcriptId)
      .eq("user_id", userId);

    return {
      transcriptId,
      status: "needs_review" as const,
      ocrProvider: ocr.provider,
      translationProvider: translation?.provider ?? null,
      primaryLanguageCode: primaryLanguage,
      candidateCount: parseResult.courses.length,
      frameworkMatchStatus: frameworkMatch.status,
    };
  } catch (error) {
    const message = safeErrorMessage(error);
    await markManualFallback(supabase, transcriptId, userId, message);
    return { transcriptId, status: "manual_entry" as const, error: message };
  }
}
