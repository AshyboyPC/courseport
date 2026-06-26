import { TranscriptProcessingError } from "../ocr/transcript-processing-errors.ts";
import { createGeminiTranscriptExtractor } from "./gemini-transcript-extractor.server.ts";
import { createMockTranscriptExtractor } from "./mock-transcript-extractor.server.ts";
import { createOpenAiTranscriptExtractor } from "./openai-transcript-extractor.server.ts";
import { validateTranscriptAiExtraction } from "./transcript-extraction-validator.ts";
import type {
  TranscriptAiExtractionInput,
  TranscriptAiProvider,
  TranscriptAiValidationResult,
} from "./types.ts";

type EnvLike = Record<string, string | undefined>;

export type TranscriptAiProviderChainOptions = {
  allowMockFallback?: boolean;
};

export function createTranscriptAiProviderChain(
  env: EnvLike = process.env,
  options: TranscriptAiProviderChainOptions = {},
): TranscriptAiProvider[] {
  const providers = [createOpenAiTranscriptExtractor(env), createGeminiTranscriptExtractor(env)];
  return options.allowMockFallback ? [...providers, createMockTranscriptExtractor()] : providers;
}

export function selectTranscriptAiProvider(
  providers: TranscriptAiProvider[] = createTranscriptAiProviderChain(),
) {
  const provider = providers.find((item) => item.isConfigured());
  if (!provider) {
    throw new TranscriptProcessingError(
      "ai_extraction",
      "provider_not_configured",
      "No configured transcript AI extraction provider is available.",
    );
  }
  return provider;
}

export async function extractTranscriptWithAi(
  input: TranscriptAiExtractionInput,
  providers: TranscriptAiProvider[] = createTranscriptAiProviderChain(),
): Promise<TranscriptAiValidationResult> {
  const configuredProviders = providers.filter((provider) => provider.isConfigured());
  if (!configuredProviders.length) {
    throw new TranscriptProcessingError(
      "ai_extraction",
      "provider_not_configured",
      "No configured transcript AI extraction provider is available.",
    );
  }

  let lastError: unknown;
  for (const provider of configuredProviders) {
    try {
      const result = await provider.extract(input);
      return validateTranscriptAiExtraction({
        result,
        ocrText: input.ocr.rawText,
        primaryLanguageCode: input.primaryLanguageCode,
      });
    } catch (error) {
      lastError = error;
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "Transcript AI extraction failed.";
  throw new TranscriptProcessingError("ai_extraction", "ai_extraction_failed", message);
}
