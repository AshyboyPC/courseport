import type { NormalizedOcrResult, OcrFileInput, OcrProvider } from "../types.ts";
import { average, bytesToBase64 } from "./provider-utils.server.ts";

type EnvLike = Record<string, string | undefined>;

type TextractBlock = {
  BlockType?: string;
  Text?: string;
  Confidence?: number;
  Page?: number;
  RowIndex?: number;
  ColumnIndex?: number;
  Geometry?: { BoundingBox?: unknown; Polygon?: unknown };
};

type TextractAnalyzeResponse = {
  Blocks?: TextractBlock[];
  DocumentMetadata?: { Pages?: number };
};

function isProbablyPdf(mimeType?: string | null, fileName?: string | null) {
  return mimeType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf");
}

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function exactArrayBuffer(bytes: ArrayBuffer | Uint8Array) {
  if (bytes instanceof ArrayBuffer) return bytes;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    exactArrayBuffer(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signingKey(secret: string, date: string, region: string) {
  const kDate = await hmac(new TextEncoder().encode(`AWS4${secret}`), date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, "textract");
  return hmac(kService, "aws4_request");
}

function amzDate(now = new Date()) {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { long: iso, short: iso.slice(0, 8) };
}

async function signedTextractHeaders(env: EnvLike, body: string, target: string) {
  const region = env.AWS_REGION?.trim() || "us-east-1";
  const accessKey = env.AWS_ACCESS_KEY_ID?.trim();
  const secretKey = env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKey || !secretKey) throw new Error("AWS Textract credentials are not configured.");

  const host = `textract.${region}.amazonaws.com`;
  const date = amzDate();
  const payloadHash = await sha256Hex(body);
  const signedHeaders = "content-type;host;x-amz-date;x-amz-target";
  const canonicalHeaders = [
    "content-type:application/x-amz-json-1.1",
    `host:${host}`,
    `x-amz-date:${date.long}`,
    `x-amz-target:${target}`,
    "",
  ].join("\n");
  const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, payloadHash].join(
    "\n",
  );
  const scope = `${date.short}/${region}/textract/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    date.long,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = hex(await hmac(await signingKey(secretKey, date.short, region), stringToSign));

  return {
    endpoint: `https://${host}/`,
    headers: {
      authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "content-type": "application/x-amz-json-1.1",
      "x-amz-date": date.long,
      "x-amz-target": target,
    },
  };
}

function normalizeTextractResponse(body: TextractAnalyzeResponse): NormalizedOcrResult {
  const blocks = body.Blocks ?? [];
  const pageCount =
    body.DocumentMetadata?.Pages ?? Math.max(1, ...blocks.map((block) => block.Page ?? 1));
  const confidences = blocks
    .map((block) => block.Confidence)
    .filter((value) => typeof value === "number");
  const pages: NormalizedOcrResult["pages"] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const pageBlocks = blocks.filter((block) => (block.Page ?? 1) === pageNumber);
    const normalizedBlocks = pageBlocks
      .filter((block) =>
        ["LINE", "WORD", "TABLE", "CELL", "KEY_VALUE_SET"].includes(block.BlockType ?? ""),
      )
      .map((block) => ({
        type:
          block.BlockType === "LINE"
            ? ("line" as const)
            : block.BlockType === "WORD"
              ? ("word" as const)
              : block.BlockType === "TABLE"
                ? ("table" as const)
                : block.BlockType === "CELL"
                  ? ("cell" as const)
                  : ("kvp" as const),
        text: block.Text ?? "",
        confidence: typeof block.Confidence === "number" ? block.Confidence / 100 : undefined,
        boundingBox: block.Geometry,
        rowIndex: block.RowIndex,
        columnIndex: block.ColumnIndex,
      }));
    const cells = normalizedBlocks.filter((block) => block.type === "cell");
    const maxRow = Math.max(0, ...cells.map((cell) => cell.rowIndex ?? 0));
    const tables =
      cells.length > 0
        ? [
            {
              rows: Array.from({ length: maxRow }, (_, rowIndex) =>
                cells
                  .filter((cell) => cell.rowIndex === rowIndex + 1)
                  .sort((a, b) => (a.columnIndex ?? 0) - (b.columnIndex ?? 0))
                  .map((cell) => ({
                    text: cell.text,
                    confidence: cell.confidence,
                    boundingBox: cell.boundingBox,
                  })),
              ),
            },
          ]
        : [];
    pages.push({
      pageNumber,
      text: normalizedBlocks
        .filter((block) => block.type === "line")
        .map((block) => block.text)
        .join("\n"),
      blocks: normalizedBlocks,
      tables,
    });
  }

  return {
    provider: "aws_textract",
    rawText: pages
      .map((page) => page.text)
      .filter(Boolean)
      .join("\n\n"),
    detectedLanguages: [],
    pages,
    averageConfidence: average(confidences.map((value) => value / 100)),
    warnings: [],
  };
}

export function createAwsTextractProvider(env: EnvLike = process.env): OcrProvider {
  return {
    id: "aws_textract",
    isConfigured: () =>
      Boolean(
        env.AWS_REGION?.trim() &&
        env.AWS_ACCESS_KEY_ID?.trim() &&
        env.AWS_SECRET_ACCESS_KEY?.trim(),
      ),
    extract: async (input: OcrFileInput) => {
      if (isProbablyPdf(input.mimeType, input.fileName)) {
        throw new Error(
          "AWS Textract synchronous byte OCR supports images here; configure Mistral, Google, or Azure for PDFs.",
        );
      }
      const target = "Textract.AnalyzeDocument";
      const body = JSON.stringify({
        Document: { Bytes: bytesToBase64(input.bytes) },
        FeatureTypes: ["TABLES", "FORMS"],
      });
      const signed = await signedTextractHeaders(env, body, target);
      const response = await fetch(signed.endpoint, {
        method: "POST",
        headers: signed.headers,
        body,
      });
      if (!response.ok) throw new Error(`AWS Textract failed with status ${response.status}.`);
      return normalizeTextractResponse((await response.json()) as TextractAnalyzeResponse);
    },
  };
}
