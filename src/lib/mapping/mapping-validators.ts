import { z } from "zod";
import { SUBJECT_CATEGORIES } from "./types.ts";

export const structuredCourseMappingOutputSchema = z.object({
  original_course_name: z.string(),
  translated_course_name: z.string().nullable(),
  normalized_course_name: z.string(),
  source_subject_category: z.enum(SUBJECT_CATEGORIES),
  mapped_subject_category: z.enum(SUBJECT_CATEGORIES),
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
