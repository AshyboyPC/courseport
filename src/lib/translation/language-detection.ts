import type { NormalizedOcrResult } from "../ocr/types.ts";
import type { LanguageDetectionResult } from "./types.ts";

const MIN_RELIABLE_PROVIDER_CONFIDENCE = 0.72;

function clampConfidence(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function normalizeLanguageCode(code: string) {
  const lower = code.trim().toLowerCase();
  if (!lower) return "";
  if (lower.startsWith("zh")) return "zh";
  return lower.split(/[-_]/)[0];
}

function countMatches(text: string, pattern: RegExp) {
  return Array.from(text.matchAll(pattern)).length;
}

export function detectLanguageFromText(text: string): LanguageDetectionResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      primaryLanguageCode: "en",
      confidence: 0.25,
      languages: [{ languageCode: "en", confidence: 0.25, source: "script_fallback" }],
      ambiguous: true,
      warnings: ["No OCR text was available for language detection."],
    };
  }

  const scriptCandidates: LanguageDetectionResult["languages"] = [];
  const tamil = countMatches(trimmed, /[\u0B80-\u0BFF]/gu);
  const devanagari = countMatches(trimmed, /[\u0900-\u097F]/gu);
  const arabicScript = countMatches(trimmed, /[\u0600-\u06FF\u0750-\u077F]/gu);
  const cyrillic = countMatches(trimmed, /[\u0400-\u04FF]/gu);
  const chinese = countMatches(trimmed, /[\u3400-\u9FFF]/gu);
  const latin = countMatches(trimmed, /[A-Za-zÀ-ÿ]/gu);
  const totalLetters = Math.max(1, tamil + devanagari + arabicScript + cyrillic + chinese + latin);

  if (tamil > 0) {
    scriptCandidates.push({
      languageCode: "ta",
      confidence: clampConfidence(0.78 + tamil / totalLetters / 5),
      source: "script_fallback",
    });
  }

  if (devanagari > 0) {
    scriptCandidates.push({
      languageCode: "hi",
      confidence: clampConfidence(0.72 + devanagari / totalLetters / 5),
      source: "script_fallback",
    });
  }

  if (arabicScript > 0) {
    const urduHints = /(?:اور|ہے|ہیں|تعلیمی|جماعت|نمبر|مضمون)/u.test(trimmed);
    const arabicHints = /(?:المدرسة|المادة|درجة|دراسات|نتيجة|الفصل)/u.test(trimmed);
    scriptCandidates.push({
      languageCode: urduHints && !arabicHints ? "ur" : "ar",
      confidence: arabicHints || urduHints ? 0.74 : 0.58,
      source: "script_fallback",
    });
  }

  if (cyrillic > 0) {
    const ukHints = /[іїєґІЇЄҐ]/u.test(trimmed) || /(?:Україн|освіти|рік|клас)/iu.test(trimmed);
    scriptCandidates.push({
      languageCode: ukHints ? "uk" : "ru",
      confidence: ukHints ? 0.74 : 0.6,
      source: "script_fallback",
    });
  }

  if (chinese > 0) {
    scriptCandidates.push({
      languageCode: "zh",
      confidence: clampConfidence(0.8 + chinese / totalLetters / 5),
      source: "script_fallback",
    });
  }

  if (latin > 0) {
    const lower = trimmed.toLowerCase();
    const spanishHints =
      /\b(asignatura|calificaci[oó]n|matem[aá]ticas|biolog[ií]a|ciencias|historia|escuela|alumno|curso|semestre|bachillerato|educaci[oó]n)\b/.test(
        lower,
      );
    const englishHints =
      /\b(subject|course|grade|marks|school|student|semester|term|transcript|academic|science|mathematics)\b/.test(
        lower,
      );
    if (spanishHints) {
      scriptCandidates.push({ languageCode: "es", confidence: 0.74, source: "script_fallback" });
    } else if (englishHints || latin / totalLetters > 0.85) {
      scriptCandidates.push({
        languageCode: "en",
        confidence: englishHints ? 0.78 : 0.56,
        source: "script_fallback",
      });
    }
  }

  const sorted = scriptCandidates.sort((a, b) => b.confidence - a.confidence);
  const primary = sorted[0] ?? {
    languageCode: "en",
    confidence: 0.4,
    source: "script_fallback" as const,
  };
  const second = sorted[1];
  const ambiguous =
    primary.confidence < 0.7 || Boolean(second && primary.confidence - second.confidence < 0.12);

  return {
    primaryLanguageCode: primary.languageCode,
    confidence: primary.confidence,
    languages: sorted.length ? sorted : [primary],
    ambiguous,
    warnings: ambiguous ? ["Language detection is ambiguous and needs review."] : [],
  };
}

export function detectLanguageFromOcr(ocr: NormalizedOcrResult): LanguageDetectionResult {
  const providerLanguages = ocr.detectedLanguages
    .map((language) => ({
      languageCode: normalizeLanguageCode(language.languageCode),
      confidence: clampConfidence(language.confidence ?? 0.65),
      source: "provider" as const,
    }))
    .filter((language) => language.languageCode);

  const reliable = providerLanguages
    .filter((language) => language.confidence >= MIN_RELIABLE_PROVIDER_CONFIDENCE)
    .sort((a, b) => b.confidence - a.confidence);

  if (reliable.length) {
    const primary = reliable[0];
    const second = reliable[1];
    const ambiguous =
      primary.confidence < 0.8 || Boolean(second && primary.confidence - second.confidence < 0.12);
    return {
      primaryLanguageCode: primary.languageCode,
      confidence: primary.confidence,
      languages: reliable,
      ambiguous,
      warnings: ambiguous ? ["Provider language detection is close or below high confidence."] : [],
    };
  }

  const fallback = detectLanguageFromText(ocr.rawText);
  return {
    ...fallback,
    languages: [...providerLanguages, ...fallback.languages],
    warnings: [
      ...fallback.warnings,
      ...(providerLanguages.length
        ? ["OCR provider language confidence was too low; script fallback was used."]
        : []),
    ],
  };
}
