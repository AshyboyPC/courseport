import { z } from "zod";
import { normalizeSubjectCategory } from "./subject-taxonomy.ts";
import { SUBJECT_CATEGORIES } from "./types.ts";

const subjectCategorySchema = z.preprocess(
  (value) => normalizeSubjectCategory(typeof value === "string" ? value : null),
  z.enum(SUBJECT_CATEGORIES),
);

export const structuredCourseMappingOutputSchema = z.object({
  original_course_name: z.string(),
  translated_course_name: z.string().nullable(),
  normalized_course_name: z.string(),
  source_subject_category: subjectCategorySchema,
  mapped_subject_category: subjectCategorySchema,
  probable_destination_equivalent: z.string(),
  requirement_bucket: z.string().nullable(),
  possible_credit_value: z.number().nullable(),
  credit_unit: z.enum(["credit", "unit", "carnegie_unit", "local_unit", "unknown"]),
  confidence: z.enum(["high", "medium", "low", "unclear"]),
  counselor_review_required: z.boolean(),
  review_reason: z.string().nullable(),
  evidence_summary: z.string(),
  warnings: z.array(z.string()),
});

export function safeParseAiMappingJson(value: string) {
  try {
    return structuredCourseMappingOutputSchema.parse(JSON.parse(value));
  } catch {
    return null;
  }
}
