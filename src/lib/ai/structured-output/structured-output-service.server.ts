import { GeminiStructuredOutputProvider } from "@/lib/ai/structured-output/gemini-structured.server";
import { MockStructuredOutputProvider } from "@/lib/ai/structured-output/mock-structured.server";
import { OpenAiStructuredOutputProvider } from "@/lib/ai/structured-output/openai-structured.server";
import type { StructuredOutputProvider } from "@/lib/ai/structured-output/types";

export function getStructuredOutputProvider(options: { allowMockFallback?: boolean } = {}) {
  const providers: StructuredOutputProvider[] = [
    new OpenAiStructuredOutputProvider(),
    new GeminiStructuredOutputProvider(),
  ];
  const configured = providers.find((provider) => provider.isConfigured());
  if (configured) return configured;
  return options.allowMockFallback ? new MockStructuredOutputProvider() : null;
}
