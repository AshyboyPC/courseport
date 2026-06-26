import { z } from "zod";

export const gapAnalysisRequestSchema = z.object({
  transcript_id: z.string().uuid(),
  credit_mapping_run_id: z.string().uuid().optional(),
  destination_framework_id: z.string().uuid().optional(),
});

export const gapRequirementStatusSchema = z.enum([
  "satisfied",
  "likely_satisfied",
  "partially_satisfied",
  "missing",
  "unclear",
  "not_applicable",
  "counselor_review_required",
]);
