import type { NormalizedOcrResult, OcrFileInput, OcrProvider } from "../types.ts";
import { average, normalizeWhitespace, toUint8Array } from "./provider-utils.server.ts";

type EnvLike = Record<string, string | undefined>;

type AzureAnalyzeResponse = {
  status?: "notStarted" | "running" | "succeeded" | "failed";
  error?: { message?: string };
  analyzeResult?: {
    content?: string;
    languages?: Array<{ locale?: string; confidence?: number }>;
    pages?: Array<{
      pageNumber?: number;
      width?: number;
      height?: number;
      lines?: Array<{ content?: string; polygon?: unknown }>;
      words?: Array<{ content?: string; confidence?: number; polygon?: unknown }>;
    }>;
    paragraphs?: Array<{ content?: string; boundingRegions?: unknown[]; spans?: unknown[] }>;
    tables?: Array<{
      cells?: Array<{
        content?: string;
        rowIndex?: number;
        columnIndex?: number;
        confidence?: number;
        boundingRegions?: unknown[];
      }>;
    }>;
  };
};

function exactArrayBuffer(bytes: ArrayBuffer | Uint8Array) {
  if (bytes instanceof ArrayBuffer) return bytes;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeAzureResponse(body: AzureAnalyzeResponse): NormalizedOcrResult {
  const result = body.analyzeResult ?? {};
  const languages = (result.languages ?? [])
    .filter((language) => language.locale)
    .map((language) => ({ languageCode: language.locale!, confidence: language.confidence }));
  const confidences: Array<number | undefined> = [];
  const tablesByPage = new Map<number, NormalizedOcrResult["pages"][number]["tables"]>();

  for (const table of result.tables ?? []) {
    const rows: Array<Array<{ text: string; confidence?: number; boundingBox?: unknown }>> = [];
    for (const cell of table.cells ?? []) {
      const rowIndex = cell.rowIndex ?? 0;
      const columnIndex = cell.columnIndex ?? 0;
      rows[rowIndex] ??= [];
      rows[rowIndex][columnIndex] = {
        text: normalizeWhitespace(cell.content ?? ""),
        confidence: cell.confidence,
        boundingBox: cell.boundingRegions,
      };
      confidences.push(cell.confidence);
    }
    const pageNumber =
      ((table.cells ?? [])[0]?.boundingRegions as Array<{ pageNumber?: number }> | undefined)?.[0]
        ?.pageNumber ?? 1;
    tablesByPage.set(pageNumber, [...(tablesByPage.get(pageNumber) ?? []), { rows }]);
  }

  const pages = (result.pages ?? []).map((page, index) => {
    const blocks = [
      ...(page.lines ?? []).map((line) => ({
        type: "line" as const,
        text: normalizeWhitespace(line.content ?? ""),
        boundingBox: line.polygon,
      })),
      ...(page.words ?? []).map((word) => {
        confidences.push(word.confidence);
        return {
          type: "word" as const,
          text: normalizeWhitespace(word.content ?? ""),
          confidence: word.confidence,
          boundingBox: word.polygon,
        };
      }),
    ].filter((block) => block.text);
    return {
      pageNumber: page.pageNumber ?? index + 1,
      width: page.width,
      height: page.height,
      text: (page.lines ?? []).map((line) => line.content ?? "").join("\n"),
      blocks,
      tables: tablesByPage.get(page.pageNumber ?? index + 1) ?? [],
    };
  });

  return {
    provider: "azure_document_intelligence",
    rawText: result.content ?? pages.map((page) => page.text).join("\n\n"),
    detectedLanguages: languages,
    pages,
    averageConfidence: average(confidences),
    warnings: result.content ? [] : ["Azure Document Intelligence returned no readable text."],
  };
}

export function createAzureDocumentIntelligenceProvider(env: EnvLike = process.env): OcrProvider {
  return {
    id: "azure_document_intelligence",
    isConfigured: () =>
      Boolean(
        env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.trim() &&
        env.AZURE_DOCUMENT_INTELLIGENCE_KEY?.trim(),
      ),
    extract: async (input: OcrFileInput) => {
      const endpoint = env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.trim()?.replace(/\/+$/, "");
      const key = env.AZURE_DOCUMENT_INTELLIGENCE_KEY?.trim();
      if (!endpoint || !key) throw new Error("Azure Document Intelligence is not configured.");

      const analyze = await fetch(
        `${endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-11-30`,
        {
          method: "POST",
          headers: {
            "content-type": input.mimeType || "application/octet-stream",
            "Ocp-Apim-Subscription-Key": key,
          },
          body: exactArrayBuffer(toUint8Array(input.bytes)),
        },
      );
      if (!analyze.ok && analyze.status !== 202) {
        throw new Error(`Azure Document Intelligence failed with status ${analyze.status}.`);
      }
      const operationLocation = analyze.headers.get("operation-location");
      if (!operationLocation)
        throw new Error("Azure Document Intelligence did not return an operation location.");

      for (let attempt = 0; attempt < 30; attempt += 1) {
        await sleep(attempt < 3 ? 750 : 1500);
        const poll = await fetch(operationLocation, {
          headers: { "Ocp-Apim-Subscription-Key": key },
        });
        if (!poll.ok)
          throw new Error(`Azure Document Intelligence polling failed with status ${poll.status}.`);
        const body = (await poll.json()) as AzureAnalyzeResponse;
        if (body.status === "succeeded") return normalizeAzureResponse(body);
        if (body.status === "failed") {
          throw new Error(body.error?.message || "Azure Document Intelligence analysis failed.");
        }
      }
      throw new Error("Azure Document Intelligence timed out before OCR completed.");
    },
  };
}
