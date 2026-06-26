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

function parseOpenAiText(body: {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
}) {
  return (
    body.output_text ??
    body.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => item.text ?? "")
      .join("") ??
    ""
  );
}

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

export function createOpenAiTranscriptExtractor(env: EnvLike = process.env): TranscriptAiProvider {
  return {
    id: "openai",
    isConfigured: () => Boolean(env.OPENAI_API_KEY?.trim()),
    extract: async (input): Promise<TranscriptAiExtractionResult> => {
      const apiKey = env.OPENAI_API_KEY?.trim();
      if (!apiKey) throw new Error("OpenAI transcript extractor is not configured.");
      const model =
        env.OPENAI_TRANSCRIPT_MODEL?.trim() || env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          input: [
            { role: "system", content: TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT },
            { role: "user", content: compactInput(input) },
          ],
          text: { format: { type: "json_object" } },
        }),
      });
      if (!response.ok)
        throw new Error(`OpenAI transcript extraction failed with status ${response.status}.`);
      const text = parseOpenAiText(
        (await response.json()) as Parameters<typeof parseOpenAiText>[0],
      );
      return parseTranscriptAiJson({
        provider: "openai",
        model,
        rawJson: JSON.parse(text),
      });
    },
  };
}
