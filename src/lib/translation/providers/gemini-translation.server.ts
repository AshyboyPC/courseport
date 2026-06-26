import {
  ACADEMIC_TRANSLATION_SYSTEM_PROMPT,
  buildAcademicTranslationPrompt,
} from "../academic-translation-prompts.ts";
import type {
  AcademicTranslationInput,
  AcademicTranslationResult,
  TranslationProvider,
} from "../types.ts";

type EnvLike = Record<string, string | undefined>;

function parseGeminiJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  return JSON.parse(fenced ?? text);
}

export function createGeminiTranslationProvider(env: EnvLike = process.env): TranslationProvider {
  return {
    id: "gemini",
    isConfigured: () => Boolean(env.GEMINI_API_KEY?.trim()),
    translate: async (input: AcademicTranslationInput): Promise<AcademicTranslationResult> => {
      const apiKey = env.GEMINI_API_KEY?.trim();
      if (!apiKey) throw new Error("Gemini translation provider is not configured.");

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          apiKey,
        )}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            generationConfig: { responseMimeType: "application/json", temperature: 0 },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${ACADEMIC_TRANSLATION_SYSTEM_PROMPT}\n\n${buildAcademicTranslationPrompt(
                      {
                        sourceLanguageCode: input.sourceLanguageCode,
                        targetLanguageCode: "en",
                        text: input.text,
                      },
                    )}`,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini translation failed with status ${response.status}.`);
      }

      const body = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text =
        body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      const parsed = parseGeminiJson(text);

      return {
        provider: "gemini",
        sourceLanguageCode: input.sourceLanguageCode,
        targetLanguageCode: "en",
        originalText: input.text,
        translatedText: String(parsed.translatedText ?? ""),
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
        translatedFields: Array.isArray(parsed.translatedFields) ? parsed.translatedFields : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
      };
    },
  };
}
