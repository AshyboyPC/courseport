import { z } from "zod";
import { finalizeCandidateReview } from "../ocr/transcript-confidence.ts";
import type { TranscriptCourseCandidateInput } from "../ocr/types.ts";
import type { TranscriptAiExtractionResult, TranscriptAiValidationResult } from "./types.ts";

const nullableString = z.string().nullable();

const CourseSchema = z.object({
  original_course_name: z.string().trim().min(1),
  translated_course_name: nullableString,
  normalized_course_name: nullableString,
  subject_category: nullableString,
  original_grade_value: nullableString,
  original_grade_scale: nullableString,
  max_marks: nullableString,
  obtained_marks: nullableString,
  credits: nullableString,
  term_label: nullableString,
  academic_year: nullableString,
  page_number: z.number().int().nullable(),
  source_text: nullableString,
  extraction_confidence: z.number().min(0).max(1).nullable(),
  translation_confidence: z.number().min(0).max(1).nullable(),
  needs_review: z.boolean(),
  review_reason: nullableString,
});

const ExtractionSchema = z.object({
  document_metadata: z
    .object({
      document_type: nullableString.optional(),
      academic_year: nullableString.optional(),
      grade_level: nullableString.optional(),
    })
    .default({}),
  detected_source: z
    .object({
      country: nullableString.optional(),
      jurisdiction: nullableString.optional(),
      curriculum: nullableString.optional(),
      board: nullableString.optional(),
    })
    .default({}),
  detected_languages: z
    .array(z.object({ language_code: z.string(), confidence: z.number().nullable().optional() }))
    .default([]),
  student_identity_fields: z.record(z.string(), nullableString).default({}),
  institution_fields: z.record(z.string(), nullableString).default({}),
  exam_certificate_fields: z.record(z.string(), nullableString).default({}),
  course_candidates: z.array(CourseSchema).default([]),
  total_marks_fields: z.record(z.string(), nullableString).default({}),
  confidence: z.number().min(0).max(1).nullable().optional(),
  warnings: z.array(z.string()).default([]),
  missing_fields: z.array(z.string()).default([]),
  review_reasons: z.array(z.string()).default([]),
});

function normalizeCourseName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function isOcrBacked(sourceText: string | null, courseName: string, ocrText: string) {
  const haystack = ocrText.toLowerCase();
  const source = sourceText?.trim().toLowerCase();
  if (source && haystack.includes(source.slice(0, Math.min(source.length, 120)))) return true;
  const normalizedName = normalizeCourseName(courseName);
  return normalizedName.length >= 2 && normalizeCourseName(ocrText).includes(normalizedName);
}

function numberFromText(text: string | null | undefined) {
  const match = text?.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function parseTranscriptAiJson(input: {
  provider: TranscriptAiExtractionResult["provider"];
  model: string | null;
  rawJson: unknown;
}): TranscriptAiExtractionResult {
  const parsed = ExtractionSchema.parse(input.rawJson);
  return {
    provider: input.provider,
    model: input.model,
    ...parsed,
    confidence: parsed.confidence ?? null,
    raw: input.rawJson,
  };
}

export function validateTranscriptAiExtraction(input: {
  result: TranscriptAiExtractionResult;
  ocrText: string;
  primaryLanguageCode: string;
}): TranscriptAiValidationResult {
  const warnings = [...input.result.warnings];
  const candidates: TranscriptCourseCandidateInput[] = [];

  for (const course of input.result.course_candidates) {
    if (!isOcrBacked(course.source_text, course.original_course_name, input.ocrText)) {
      warnings.push(`Skipped AI course candidate without OCR-backed evidence.`);
      continue;
    }
    const gradeOriginal =
      course.original_grade_value ??
      (course.obtained_marks && course.max_marks
        ? `${course.obtained_marks}/${course.max_marks}`
        : course.obtained_marks);
    const reviewReasons = [
      course.needs_review
        ? (course.review_reason ?? "AI extraction marked this row for review.")
        : null,
      course.source_text ? null : "AI extraction did not include a source text snippet.",
    ].filter((reason): reason is string => Boolean(reason));
    candidates.push(
      finalizeCandidateReview(
        {
          course_name_original: course.original_course_name,
          course_name_translated: course.translated_course_name,
          course_name_normalized:
            course.normalized_course_name ??
            normalizeCourseName(course.translated_course_name || course.original_course_name),
          original_language_code: input.primaryLanguageCode,
          translated_language_code: course.translated_course_name ? "en" : null,
          subject_category: course.subject_category,
          grade_original: gradeOriginal ?? null,
          grade_normalized: numberFromText(course.obtained_marks ?? course.original_grade_value),
          grade_scale_original: course.original_grade_scale ?? course.max_marks,
          max_marks: course.max_marks,
          credits_or_units: course.credits,
          term_label_original: course.term_label,
          term_label_translated: course.term_label,
          academic_year: course.academic_year,
          grade_level: numberFromText(input.result.document_metadata.grade_level),
          page_number: course.page_number,
          source_text: course.source_text,
          translated_source_text: course.source_text,
          bounding_box_json: null,
          extraction_confidence: course.extraction_confidence,
          translation_confidence: course.translation_confidence,
          entry_method: course.translated_course_name ? "ocr_translated" : "ocr_extracted",
          student_confirmed: false,
          needs_review: course.needs_review,
          review_reason: course.review_reason,
        },
        reviewReasons,
      ),
    );
  }

  return {
    fields: {
      student_name: input.result.student_identity_fields.student_name ?? "",
      school_name: input.result.institution_fields.school_name ?? "",
      board_name:
        input.result.detected_source.board ?? input.result.detected_source.curriculum ?? "",
      issuing_country: input.result.detected_source.country ?? "",
      issuing_state_province_jurisdiction: input.result.detected_source.jurisdiction ?? "",
      document_language: input.primaryLanguageCode,
      academic_year_session: input.result.document_metadata.academic_year ?? "",
      grade_class_level: input.result.document_metadata.grade_level ?? "",
      exam_name:
        input.result.exam_certificate_fields.exam_name ??
        input.result.exam_certificate_fields.certificate_name ??
        "",
    },
    candidates,
    warnings,
    rawResult: input.result,
  };
}
