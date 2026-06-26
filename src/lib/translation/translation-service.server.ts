import { createGeminiTranslationProvider } from "./providers/gemini-translation.server.ts";
import { createMockTranslationProvider } from "./providers/mock-translation.server.ts";
import { createOpenAiTranslationProvider } from "./providers/openai-translation.server.ts";
import type {
  AcademicTranslationInput,
  AcademicTranslationResult,
  TranslationProvider,
} from "./types.ts";

type EnvLike = Record<string, string | undefined>;

export type TranslationProviderChainOptions = {
  allowMockFallback?: boolean;
};

function shouldAllowMockFallback(env: EnvLike, options?: TranslationProviderChainOptions) {
  return options?.allowMockFallback === true;
}

export function createTranslationProviderChain(
  env: EnvLike = process.env,
  options: TranslationProviderChainOptions = {},
): TranslationProvider[] {
  const providers = [createGeminiTranslationProvider(env), createOpenAiTranslationProvider(env)];
  return shouldAllowMockFallback(env, options)
    ? [...providers, createMockTranslationProvider()]
    : providers;
}

export function selectTranslationProvider(
  providers: TranslationProvider[] = createTranslationProviderChain(),
): TranslationProvider {
  const provider = providers.find((item) => item.isConfigured());
  if (!provider) throw new Error("No configured translation provider is available.");
  return provider;
}

export async function translateAcademicTranscript(
  input: AcademicTranslationInput,
  providers: TranslationProvider[] = createTranslationProviderChain(),
): Promise<AcademicTranslationResult> {
  const warnings: string[] = [];
  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    try {
      const result = await provider.translate({ ...input, targetLanguageCode: "en" });
      return { ...result, warnings: [...warnings, ...result.warnings] };
    } catch (error) {
      warnings.push(`${provider.id} translation failed; trying the next configured provider.`);
    }
  }

  throw new Error(
    warnings.length
      ? warnings.join(" ")
      : "No configured translation provider is available for this transcript.",
  );
}
