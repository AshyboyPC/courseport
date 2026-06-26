import type { NormalizedOcrResult, OcrFileInput, OcrProvider } from "../types.ts";
import {
  average,
  blocksFromLines,
  dataUrlForOcr,
  linesFromText,
  markdownTablesFromText,
  normalizeWhitespace,
} from "./provider-utils.server.ts";

type EnvLike = Record<string, string | undefined>;

type MistralOcrPage = {
  index?: number;
  markdown?: string;
  text?: string;
  dimensions?: {
    dpi?: number;
    height?: number;
    width?: number;
  };
  images?: unknown[];
};

type MistralOcrResponse = {
  pages?: MistralOcrPage[];
  model?: string;
  usage_info?: unknown;
};

function pageText(page: MistralOcrPage) {
  return normalizeWhitespace(page.markdown ?? page.text ?? "");
}

function normalizeMistralResponse(body: MistralOcrResponse): NormalizedOcrResult {
  const pages = (body.pages ?? []).map((page, index) => {
    const text = pageText(page);
    return {
      pageNumber: typeof page.index === "number" ? page.index + 1 : index + 1,
      width: page.dimensions?.width,
      height: page.dimensions?.height,
      text,
      blocks: blocksFromLines(linesFromText(text), "line"),
      tables: markdownTablesFromText(text),
    };
  });
  const rawText = pages
    .map((page) => page.text)
    .filter(Boolean)
    .join("\n\n");
  return {
    provider: "mistral_ocr",
    rawText,
    detectedLanguages: [],
    pages,
    averageConfidence: undefined,
    warnings: rawText
      ? []
      : [
          "Mistral OCR returned no readable text; manual entry or another provider may be required.",
        ],
  };
}

export function createMistralOcrProvider(env: EnvLike = process.env): OcrProvider {
  return {
    id: "mistral_ocr",
    isConfigured: () => Boolean(env.MISTRAL_API_KEY?.trim()),
    extract: async (input: OcrFileInput) => {
      const apiKey = env.MISTRAL_API_KEY?.trim();
      if (!apiKey) throw new Error("Mistral OCR provider is not configured.");

      const response = await fetch("https://api.mistral.ai/v1/ocr", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-ocr-latest",
          document: {
            type: "document_url",
            document_url: dataUrlForOcr(input.bytes, input.mimeType),
          },
          include_image_base64: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mistral OCR failed with status ${response.status}.`);
      }

      return normalizeMistralResponse((await response.json()) as MistralOcrResponse);
    },
  };
}
