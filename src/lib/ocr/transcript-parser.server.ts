import type { AcademicTranslationResult } from "../translation/types.ts";
import type {
  NormalizedOcrResult,
  ParsedTranscriptFields,
  TranscriptCourseCandidateInput,
  TranscriptParseResult,
} from "./types.ts";
import {
  finalizeCandidateReview,
  mergeReviewReasons,
  requiresTranslationReview,
} from "./transcript-confidence.ts";

type HeaderKey =
  | "subject"
  | "grade"
  | "marks"
  | "max_marks"
  | "credits"
  | "term"
  | "result"
  | "exam_name"
  | "academic_year"
  | "grade_level";

const HEADER_SYNONYMS: Record<HeaderKey, string[]> = {
  subject: [
    "subject",
    "course",
    "course name",
    "subject name",
    "asignatura",
    "materia",
    "curso",
    "பாடம்",
    "பாடப்பிரிவு",
    "विषय",
    "مادة",
    "المادة",
    "مضمون",
    "科目",
    "学科",
    "предмет",
    "дисципліна",
    "paksa",
    "subject/course",
  ],
  grade: [
    "grade",
    "calificación",
    "calificacion",
    "nota",
    "marks",
    "score",
    "अंक",
    "மதிப்பெண்",
    "درجة",
    "نمبر",
    "成绩",
  ],
  marks: [
    "marks",
    "mark",
    "score",
    "obtained",
    "obtained marks",
    "மதிப்பெண்",
    "अंक",
    "درجة",
    "نمبر",
  ],
  max_marks: [
    "max marks",
    "maximum",
    "maximum marks",
    "max",
    "scale",
    "அதிகபட்சம்",
    "पूर्णांक",
    "الدرجة النهائية",
  ],
  credits: ["credits", "credit", "units", "unit", "hours", "créditos", "unidades"],
  term: ["term", "semester", "session", "year", "trimestre", "semestre", "பருவம்", "सत्र", "الفصل"],
  result: ["result", "status", "pass", "fail", "resultado", "முடிவு", "परिणाम", "نتيجة"],
  exam_name: ["exam", "examination", "test", "board exam", "examen", "தேர்வு", "परीक्षा", "امتحان"],
  academic_year: [
    "academic year",
    "school year",
    "session",
    "año académico",
    "கல்வியாண்டு",
    "शैक्षणिक वर्ष",
  ],
  grade_level: ["class", "grade level", "grade/class", "வகுப்பு", "कक्षा", "جماعت"],
};

const FIELD_LABELS: Array<[keyof ParsedTranscriptFields, string[]]> = [
  [
    "student_name",
    [
      "student name",
      "name of student",
      "nombre del estudiante",
      "மாணவர் பெயர்",
      "विद्यार्थी नाम",
      "اسم الطالب",
    ],
  ],
  [
    "school_name",
    ["school", "school name", "escuela", "institution", "பள்ளி", "विद्यालय", "المدرسة"],
  ],
  ["board_name", ["board", "curriculum", "plan", "வாரியம்", "बोर्ड", "مجلس", "board/curriculum"]],
  ["issuing_country", ["country", "país", "நாடு", "देश", "الدولة"]],
  [
    "issuing_state_province_jurisdiction",
    ["state", "province", "jurisdiction", "மாநிலம்", "राज्य", "المحافظة"],
  ],
  ["document_language", ["language", "idioma", "மொழி", "भाषा", "اللغة"]],
  ["academic_year_session", HEADER_SYNONYMS.academic_year],
  ["grade_class_level", HEADER_SYNONYMS.grade_level],
  ["term_semester_year", HEADER_SYNONYMS.term],
  ["exam_name", HEADER_SYNONYMS.exam_name],
];

function normalizeToken(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}/ ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function headerKeyFor(text: string): HeaderKey | null {
  const normalized = normalizeToken(text);
  if (!normalized) return null;
  for (const [key, synonyms] of Object.entries(HEADER_SYNONYMS) as Array<[HeaderKey, string[]]>) {
    if (
      synonyms.some(
        (synonym) =>
          normalized === normalizeToken(synonym) || normalized.includes(normalizeToken(synonym)),
      )
    ) {
      return key;
    }
  }
  return null;
}

function fieldTranslationMap(translation?: AcademicTranslationResult | null) {
  const map = new Map<string, AcademicTranslationResult["translatedFields"][number]>();
  for (const field of translation?.translatedFields ?? []) {
    map.set(normalizeToken(field.originalText), field);
  }
  return map;
}

function translatedFor(text: string, translation?: AcademicTranslationResult | null) {
  const direct = fieldTranslationMap(translation).get(normalizeToken(text));
  if (direct) return direct.translatedText;
  return text;
}

function translationConfidenceFor(text: string, translation?: AcademicTranslationResult | null) {
  const field = fieldTranslationMap(translation).get(normalizeToken(text));
  return field?.confidence ?? translation?.confidence ?? null;
}

function numberFromText(text: string | null | undefined) {
  const match = text?.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function classifySubject(translatedCourseName: string | null | undefined) {
  const lower = normalizeToken(translatedCourseName ?? "");
  if (!lower) return null;
  if (/(mathematics|math|maths|algebra|geometry|calculus|statistics|கணிதம்|गणित)/.test(lower))
    return "Mathematics";
  if (
    /(science|biology|physics|chemistry|environmental|life science|earth science|உயிரியல்|இயற்பியல்|வேதியியல்|विज्ञान|भौतिकी|रसायन|जीवविज्ञान)/.test(
      lower,
    )
  )
    return "Science";
  if (
    /(social science|social studies|history|geography|civics|economics|government|சமூக அறிவியல்|इतिहास|भूगोल|नागरिक)/.test(
      lower,
    )
  )
    return "Social Studies";
  if (
    /(english|language arts|literature|writing|tamil|hindi|urdu|arabic|spanish|filipino|bengali|russian|ukrainian|mandarin|chinese)/.test(
      lower,
    )
  ) {
    return "World Language / English";
  }
  if (/(computer|technology|informatics|programming)/.test(lower)) return "Computer Science";
  if (/(physical education|health|sports)/.test(lower)) return "Health / Physical Education";
  if (/(art|music|dance|fine arts|visual arts)/.test(lower)) return "Fine Arts";
  return null;
}

function looksLikeCourseName(text: string) {
  const normalized = normalizeToken(text);
  if (!normalized || normalized.length < 2) return false;
  if (
    /^(total|grand total|result|pass|fail|date|signature|register no|roll no|student name)$/.test(
      normalized,
    )
  ) {
    return false;
  }
  if (
    FIELD_LABELS.some(([, labels]) =>
      labels.some((label) => normalized.includes(normalizeToken(label))),
    )
  ) {
    return false;
  }
  return (
    Boolean(classifySubject(text)) ||
    /[A-Za-z]{3,}/.test(text) ||
    /(?:\p{Script=Tamil}|\p{Script=Devanagari}|\p{Script=Arabic}|\p{Script=Han})/u.test(text)
  );
}

function normalizedCourseName(translated: string | null, original: string) {
  return normalizeToken(translated || original).replace(/\b(ii)\b/g, "2");
}

function rowConfidence(row: Array<{ confidence?: number }>) {
  const values = row
    .map((cell) => cell.confidence)
    .filter((value): value is number => typeof value === "number");
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function headerIndexMap(
  headerRow: Array<{ text: string }>,
  translation?: AcademicTranslationResult | null,
) {
  const result = new Map<HeaderKey, number>();
  headerRow.forEach((cell, index) => {
    const key = headerKeyFor(translatedFor(cell.text, translation)) ?? headerKeyFor(cell.text);
    if (key && !result.has(key)) result.set(key, index);
  });
  return result;
}

function hasCourseHeader(map: Map<HeaderKey, number>) {
  return map.has("subject") && (map.has("grade") || map.has("marks") || map.has("result"));
}

function cellText(row: Array<{ text: string }>, index?: number) {
  if (typeof index !== "number") return null;
  const text = row[index]?.text?.trim();
  return text || null;
}

function parseTableRows(input: {
  rows: Array<Array<{ text: string; confidence?: number; boundingBox?: unknown }>>;
  pageNumber: number | null;
  languageCode: string | null;
  translation?: AcademicTranslationResult | null;
}) {
  const candidates: TranscriptCourseCandidateInput[] = [];
  if (input.rows.length < 2) return candidates;

  for (
    let headerRowIndex = 0;
    headerRowIndex < Math.min(3, input.rows.length - 1);
    headerRowIndex += 1
  ) {
    const header = input.rows[headerRowIndex];
    const indexMap = headerIndexMap(header, input.translation);
    if (!hasCourseHeader(indexMap)) continue;

    for (const row of input.rows.slice(headerRowIndex + 1)) {
      const originalCourseName = cellText(row, indexMap.get("subject"));
      if (!originalCourseName) continue;
      const translatedCourseName = translatedFor(originalCourseName, input.translation);
      const gradeOriginal =
        cellText(row, indexMap.get("marks")) ?? cellText(row, indexMap.get("grade")) ?? null;
      const maxMarks = cellText(row, indexMap.get("max_marks"));
      const credits = cellText(row, indexMap.get("credits"));
      const termOriginal = cellText(row, indexMap.get("term"));
      const resultLabel = cellText(row, indexMap.get("result"));
      const subjectCategory = classifySubject(translatedCourseName);
      const translationConfidence = translationConfidenceFor(originalCourseName, input.translation);
      const confidence = rowConfidence(row);

      candidates.push(
        finalizeCandidateReview(
          {
            course_name_original: originalCourseName,
            course_name_translated:
              translatedCourseName === originalCourseName ? null : translatedCourseName,
            course_name_normalized: normalizedCourseName(translatedCourseName, originalCourseName),
            original_language_code: input.languageCode,
            translated_language_code: translatedCourseName === originalCourseName ? null : "en",
            subject_category: subjectCategory,
            grade_original: gradeOriginal ?? resultLabel,
            grade_normalized: numberFromText(gradeOriginal),
            grade_scale_original: maxMarks,
            max_marks: maxMarks,
            credits_or_units: credits,
            term_label_original: termOriginal,
            term_label_translated: termOriginal
              ? translatedFor(termOriginal, input.translation)
              : null,
            academic_year: cellText(row, indexMap.get("academic_year")),
            grade_level: numberFromText(cellText(row, indexMap.get("grade_level"))),
            page_number: input.pageNumber,
            source_text: row.map((cell) => cell.text).join(" | "),
            translated_source_text: row
              .map((cell) => translatedFor(cell.text, input.translation))
              .join(" | "),
            bounding_box_json: row.find((cell) => cell.boundingBox)?.boundingBox ?? null,
            extraction_confidence: confidence,
            translation_confidence: translationConfidence,
            entry_method: input.translation?.provider ? "ocr_translated" : "ocr_extracted",
            student_confirmed: false,
            needs_review: false,
            review_reason: null,
          },
          translationConfidence != null && requiresTranslationReview(translationConfidence)
            ? ["Possible translation needs review."]
            : [],
        ),
      );
    }
    return candidates;
  }
  return candidates;
}

function pipeTablesFromText(text: string) {
  const rows: Array<Array<{ text: string; confidence?: number }>> = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.includes("|")) continue;
    if (/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(trimmed)) continue;
    rows.push(
      trimmed
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => ({ text: cell.trim(), confidence: undefined })),
    );
  }
  return rows;
}

function parseLineBasedRows(input: {
  text: string;
  languageCode: string | null;
  translation?: AcademicTranslationResult | null;
}) {
  const candidates: TranscriptCourseCandidateInput[] = [];
  const lines = input.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.includes("|")) continue;
    const cleaned = line.replace(/\s{2,}/g, " ").trim();
    const scorePair = cleaned.match(
      /(.+?)\s+(\d{1,3}(?:\.\d+)?)\s*(?:\/|out of|of)\s*(\d{1,3}(?:\.\d+)?)/i,
    );
    const trailingScore = cleaned.match(/(.+?)\s+(\d{1,3}(?:\.\d+)?)\s*$/);
    const match = scorePair ?? trailingScore;
    if (!match) continue;
    const originalCourseName = match[1]?.replace(/[:：-]+$/g, "").trim();
    const gradeOriginal = match[2] ?? null;
    const maxMarks = scorePair?.[3] ?? null;
    if (!originalCourseName || !looksLikeCourseName(originalCourseName)) continue;

    const translatedCourseName = translatedFor(originalCourseName, input.translation);
    const subjectCategory = classifySubject(translatedCourseName);
    const translationConfidence = translationConfidenceFor(originalCourseName, input.translation);
    candidates.push(
      finalizeCandidateReview(
        {
          course_name_original: originalCourseName,
          course_name_translated:
            translatedCourseName === originalCourseName ? null : translatedCourseName,
          course_name_normalized: normalizedCourseName(translatedCourseName, originalCourseName),
          original_language_code: input.languageCode,
          translated_language_code: translatedCourseName === originalCourseName ? null : "en",
          subject_category: subjectCategory,
          grade_original: maxMarks ? `${gradeOriginal}/${maxMarks}` : gradeOriginal,
          grade_normalized: numberFromText(gradeOriginal),
          grade_scale_original: maxMarks,
          max_marks: maxMarks,
          credits_or_units: null,
          term_label_original: null,
          term_label_translated: null,
          academic_year: null,
          grade_level: null,
          page_number: null,
          source_text: line,
          translated_source_text: translatedFor(line, input.translation),
          bounding_box_json: null,
          extraction_confidence: 0.68,
          translation_confidence: translationConfidence,
          entry_method: input.translation?.provider ? "ocr_translated" : "ocr_extracted",
          student_confirmed: false,
          needs_review: true,
          review_reason: "Line-based transcript extraction needs review.",
        },
        translationConfidence != null && requiresTranslationReview(translationConfidence)
          ? ["Possible translation needs review."]
          : [],
      ),
    );
  }
  return candidates;
}

function extractFields(
  text: string,
  translation?: AcademicTranslationResult | null,
): ParsedTranscriptFields {
  const fields: ParsedTranscriptFields = {};
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines) {
    const [rawLabel, ...rest] = line.split(/[:：]/);
    if (!rest.length) continue;
    const value = rest.join(":").trim();
    const label = translatedFor(rawLabel, translation);
    const normalizedLabel = normalizeToken(label);
    for (const [fieldType, labels] of FIELD_LABELS) {
      if (
        !fields[fieldType] &&
        labels.some((candidate) => normalizedLabel.includes(normalizeToken(candidate)))
      ) {
        fields[fieldType] = value;
      }
    }
  }
  return fields;
}

export function parseTranscriptCandidates(input: {
  ocr: NormalizedOcrResult;
  translation?: AcademicTranslationResult | null;
  primaryLanguageCode: string;
}): TranscriptParseResult {
  const warnings: string[] = [];
  const courses: TranscriptCourseCandidateInput[] = [];
  for (const page of input.ocr.pages) {
    for (const table of page.tables) {
      courses.push(
        ...parseTableRows({
          rows: table.rows,
          pageNumber: page.pageNumber,
          languageCode: input.primaryLanguageCode,
          translation: input.translation,
        }),
      );
    }
  }

  let tableDetected = courses.length > 0;
  if (!tableDetected) {
    const rows = pipeTablesFromText(input.ocr.rawText);
    const lineCourses = parseTableRows({
      rows,
      pageNumber: null,
      languageCode: input.primaryLanguageCode,
      translation: input.translation,
    });
    courses.push(...lineCourses);
    tableDetected = lineCourses.length > 0;
  }

  if (!courses.length) {
    courses.push(
      ...parseLineBasedRows({
        text: input.translation?.translatedText ?? input.ocr.rawText,
        languageCode: input.primaryLanguageCode,
        translation: input.translation,
      }),
    );
  }

  if (!tableDetected)
    warnings.push("No transcript table was detected; manual review or manual entry is required.");

  const fields = {
    ...extractFields(input.ocr.rawText, input.translation),
    ...(input.translation?.translatedText
      ? extractFields(input.translation.translatedText, null)
      : {}),
    document_language: input.primaryLanguageCode,
  };

  const needsReview =
    warnings.length > 0 ||
    courses.length === 0 ||
    courses.some((candidate) => candidate.needs_review);

  return {
    fields,
    courses,
    tableDetected,
    needsReview,
    warnings: [
      ...warnings,
      mergeReviewReasons(courses.map((candidate) => candidate.review_reason)) ?? "",
    ].filter(Boolean),
  };
}
