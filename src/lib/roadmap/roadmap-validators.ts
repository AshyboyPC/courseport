import { z } from "zod";

const uuid = z.string().uuid();

export const GenerateAcademicRoadmapSchema = z
  .object({
    gap_analysis_id: uuid.optional(),
    transcript_id: uuid.optional(),
  })
  .refine((value) => value.gap_analysis_id || value.transcript_id, {
    message: "Roadmap generation requires a gap analysis or transcript.",
  });

export const RoadmapItemStatusSchema = z.enum([
  "todo",
  "in_progress",
  "done",
  "blocked",
  "skipped",
  "needs_counselor",
  "waiting_for_school",
]);

export const RoadmapItemPatchSchema = z.object({
  id: uuid,
  status: RoadmapItemStatusSchema.optional(),
  completion_note: z.string().trim().nullable().optional(),
});

export const ManualRoadmapItemSchema = z.object({
  roadmap_id: uuid,
  title: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  action_type: z
    .enum([
      "counselor_question",
      "course_planning",
      "credit_review",
      "missing_credit",
      "assessment_requirement",
      "local_policy_check",
      "transcript_followup",
      "summer_option",
      "online_option",
      "credit_recovery_option",
      "program_pathway_check",
      "elective_planning",
      "informational",
      "manual_task",
    ])
    .default("manual_task"),
  priority: z.enum(["critical", "high", "medium", "low", "informational"]).default("medium"),
  timing_bucket: z
    .enum([
      "immediately",
      "before_course_registration",
      "current_semester",
      "next_semester",
      "summer",
      "senior_year",
      "before_graduation",
      "ongoing",
      "counselor_meeting",
      "unknown",
    ])
    .default("unknown"),
  counselor_question: z.string().trim().nullable().optional(),
});
