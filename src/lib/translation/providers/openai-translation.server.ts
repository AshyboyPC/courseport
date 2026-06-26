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

function parseOpenAiJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  return JSON.parse(fenced ?? text);
}

export function createOpenAiTranslationProvider(env: EnvLike = process.env): TranslationProvider {
  return {
    id: "openai",
    isConfigured: () => Boolean(env.OPENAI_API_KEY?.trim()),
    translate: async (input: AcademicTranslationInput): Promise<AcademicTranslationResult> => {
      const apiKey = env.OPENAI_API_KEY?.trim();
      if (!apiKey) throw new Error("OpenAI translation provider is not configured.");

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          temperature: 0,
          input: [
            { role: "system", content: ACADEMIC_TRANSLATION_SYSTEM_PROMPT },
            {
              role: "user",
              content: buildAcademicTranslationPrompt({
                sourceLanguageCode: input.sourceLanguageCode,
                targetLanguageCode: "en",
                text: input.text,
              }),
            },
          ],
          text: { format: { type: "json_object" } },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI translation failed with status ${response.status}.`);
      }

      const body = (await response.json()) as {
        output_text?: string;
        output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
      };
      const text =
        body.output_text ??
        body.output
          ?.flatMap((item) => item.content ?? [])
          .map((item) => item.text ?? "")
          .join("") ??
        "";
      const parsed = parseOpenAiJson(text);

      return {
        provider: "openai",
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
