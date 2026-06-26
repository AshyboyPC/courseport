import type { NormalizedOcrResult, OcrBlockType } from "../types.ts";

export function toUint8Array(bytes: ArrayBuffer | Uint8Array) {
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

export function bytesToBase64(bytes: ArrayBuffer | Uint8Array) {
  const view = toUint8Array(bytes);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < view.length; index += chunkSize) {
    const chunk = view.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function normalizeWhitespace(text: string) {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\r\n/g, "\n")
    .trim();
}

export function linesFromText(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
}

export function markdownTablesFromText(
  text: string,
): NormalizedOcrResult["pages"][number]["tables"] {
  const tables: NormalizedOcrResult["pages"][number]["tables"] = [];
  let current: Array<Array<{ text: string; confidence?: number }>> = [];

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    const looksLikeSeparator = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(trimmed);
    if (trimmed.includes("|") && !looksLikeSeparator) {
      current.push(
        trimmed
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => ({ text: normalizeWhitespace(cell), confidence: undefined })),
      );
      continue;
    }
    if (current.length) {
      tables.push({ rows: current });
      current = [];
    }
  }
  if (current.length) tables.push({ rows: current });
  return tables;
}

export function blocksFromLines(
  lines: string[],
  type: OcrBlockType = "line",
  confidence?: number,
  languageCode?: string,
): NormalizedOcrResult["pages"][number]["blocks"] {
  return lines.map((line) => ({
    type,
    text: line,
    confidence,
    languageCode,
  }));
}

export function dataUrlForOcr(bytes: ArrayBuffer | Uint8Array, mimeType?: string | null) {
  return `data:${mimeType || "application/octet-stream"};base64,${bytesToBase64(bytes)}`;
}

export function average(numbers: Array<number | undefined>) {
  const values = numbers.filter((value): value is number => typeof value === "number");
  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function simpleOcrResult(input: {
  provider: NormalizedOcrResult["provider"];
  rawText: string;
  pageTexts?: string[];
  warnings?: string[];
  detectedLanguages?: NormalizedOcrResult["detectedLanguages"];
  confidence?: number;
}): NormalizedOcrResult {
  const pageTexts = input.pageTexts?.length ? input.pageTexts : [input.rawText];
  return {
    provider: input.provider,
    rawText: input.rawText,
    detectedLanguages: input.detectedLanguages ?? [],
    pages: pageTexts.map((text, index) => ({
      pageNumber: index + 1,
      text,
      blocks: text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({
          type: "line" as OcrBlockType,
          text: line,
          confidence: input.confidence,
        })),
      tables: [],
    })),
    averageConfidence: input.confidence,
    warnings: input.warnings ?? [],
  };
}
