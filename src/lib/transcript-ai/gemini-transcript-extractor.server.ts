import {
  TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT,
  buildTranscriptExtractionPrompt,
} from "./transcript-extraction-schema.ts";
import { parseTranscriptAiJson } from "./transcript-extraction-validator.ts";
import type {
  TranscriptAiExtractionInput,
  TranscriptAiExtractionResult,
  TranscriptAiProvider,
} from "./types.ts";

type EnvLike = Record<string, string | undefined>;

function compactInput(input: TranscriptAiExtractionInput) {
  const tableText = input.ocr.pages
    .flatMap((page) =>
      page.tables.map((table) =>
        table.rows.map((row) => row.map((cell) => cell.text).join(" | ")).join("\n"),
      ),
    )
    .join("\n\n")
    .slice(0, 24_000);
  return buildTranscriptExtractionPrompt({
    rawText: input.ocr.rawText.slice(0, 80_000),
    tableText,
    translatedTextEn: input.translatedTextEn?.slice(0, 80_000) ?? null,
    pageCount: input.ocr.pages.length,
    detectedLanguages: JSON.stringify(input.ocr.detectedLanguages),
    uploadedFile: JSON.stringify(input.uploadedFile),
    profileContext: JSON.stringify(input.profileContext ?? {}),
  });
}

export function createGeminiTranscriptExtractor(env: EnvLike = process.env): TranscriptAiProvider {
  return {
    id: "gemini",
    isConfigured: () => Boolean(env.GEMINI_API_KEY?.trim()),
    extract: async (input): Promise<TranscriptAiExtractionResult> => {
      const apiKey = env.GEMINI_API_KEY?.trim();
      if (!apiKey) throw new Error("Gemini transcript extractor is not configured.");
      const model =
        env.GEMINI_TRANSCRIPT_MODEL?.trim() || env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            generationConfig: { responseMimeType: "application/json", temperature: 0 },
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT}\n\n${compactInput(input)}` },
                ],
              },
            ],
          }),
        },
      );
      if (!response.ok)
        throw new Error(`Gemini transcript extraction failed with status ${response.status}.`);
      const body = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text =
        body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      return parseTranscriptAiJson({
        provider: "gemini",
        model,
        rawJson: JSON.parse(text),
      });
    },
  };
}
