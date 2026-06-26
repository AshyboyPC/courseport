import { detectLanguageFromText } from "../../translation/language-detection.ts";
import type { NormalizedOcrResult, OcrFileInput, OcrProvider } from "../types.ts";

const TAMIL_SAMPLE = `மாணவர் பெயர்: அருண் குமார்
பள்ளி: சென்னை உயர்நிலைப் பள்ளி
வாரியம்: தமிழ்நாடு மாநில வாரியம்
கல்வியாண்டு: 2025-2026
வகுப்பு: 10

பாடம் | மதிப்பெண் | அதிகபட்சம் | முடிவு
தமிழ் | 92 | 100 | தேர்ச்சி
ஆங்கிலம் | 88 | 100 | தேர்ச்சி
கணிதம் | 95 | 100 | தேர்ச்சி
அறிவியல் | 91 | 100 | தேர்ச்சி
சமூக அறிவியல் | 89 | 100 | தேர்ச்சி`;

const SPANISH_SAMPLE = `Nombre del estudiante: Sofia Martinez
Escuela: Instituto Secundario Central
Plan: Bachillerato
Año académico: 2025-2026

Asignatura | Calificación | Máximo | Resultado
Matemáticas | 9 | 10 | Aprobado
Biología 2 | 8 | 10 | Aprobado
Historia | 9 | 10 | Aprobado`;

const ENGLISH_SAMPLE = `Student Name: Alex Chen
School: Scholaport Demo High School
Board: CBSE Secondary
Academic Year: 2025-2026

Subject | Marks | Max Marks | Result
Mathematics | 95 | 100 | Pass
Science | 91 | 100 | Pass
Social Science | 89 | 100 | Pass`;

function toUint8Array(bytes: ArrayBuffer | Uint8Array) {
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

function decodeLikelyText(bytes: ArrayBuffer | Uint8Array) {
  const view = toUint8Array(bytes);
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(view);
  const printable = decoded.replace(/[^\p{L}\p{M}\p{N}\p{P}\p{S}\p{Zs}\r\n\t]/gu, "");
  const printableRatio = printable.length / Math.max(1, decoded.length);
  if (printable.trim().length >= 12 && printableRatio > 0.55) return printable;
  return "";
}

function textForInput(input: OcrFileInput) {
  const decoded = decodeLikelyText(input.bytes);
  if (decoded.trim()) return decoded;
  const fileName = input.fileName?.toLowerCase() ?? "";
  if (fileName.includes("tamil") || fileName.includes("ta-")) return TAMIL_SAMPLE;
  if (fileName.includes("spanish") || fileName.includes("es-")) return SPANISH_SAMPLE;
  if (fileName.includes("english") || fileName.includes("en-")) return ENGLISH_SAMPLE;
  return "";
}

function splitTableRows(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes("|"))
    .map((line) => line.split("|").map((cell) => ({ text: cell.trim(), confidence: 0.88 })));
}

function blocksFromText(
  text: string,
  languageCode: string,
): NormalizedOcrResult["pages"][number]["blocks"] {
  const blocks: NormalizedOcrResult["pages"][number]["blocks"] = [];
  text.split(/\r?\n/).forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.includes("|")) {
      trimmed.split("|").forEach((cell, columnIndex) => {
        blocks.push({
          type: "cell",
          text: cell.trim(),
          languageCode,
          confidence: 0.88,
          rowIndex: lineIndex,
          columnIndex,
        });
      });
      return;
    }
    blocks.push({ type: "line", text: trimmed, languageCode, confidence: 0.88 });
  });
  return blocks;
}

function buildResult(text: string, fileName?: string | null): NormalizedOcrResult {
  const detection = detectLanguageFromText(text);
  const languageCode = detection.primaryLanguageCode;
  return {
    provider: "mock",
    rawText: text,
    detectedLanguages: detection.languages.map((language) => ({
      languageCode: language.languageCode,
      confidence: language.confidence,
    })),
    pages: [
      {
        pageNumber: 1,
        text,
        blocks: blocksFromText(text, languageCode),
        tables: splitTableRows(text).length ? [{ rows: splitTableRows(text) }] : [],
      },
    ],
    averageConfidence: text.trim() ? 0.88 : 0.3,
    warnings: [
      "Mock OCR was used; review is required before Scholaport uses extracted rows.",
      ...(text.trim()
        ? []
        : [
            `Mock OCR could not read ${fileName ?? "the uploaded file"}; use manual entry or configure a real OCR provider.`,
          ]),
    ],
  };
}

export function createMockOcrProvider(): OcrProvider {
  return {
    id: "mock",
    isConfigured: () => true,
    extract: async (input: OcrFileInput) => buildResult(textForInput(input), input.fileName),
  };
}

export const mockTamilTranscriptText = TAMIL_SAMPLE;
export const mockSpanishTranscriptText = SPANISH_SAMPLE;
