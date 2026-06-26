import { z } from "zod";
import { requireSupabase } from "@/lib/supabase";

const nullableString = z.string().nullable();

export const StudentProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  first_name: z.string(),
  last_name: nullableString,
  origin_country: z.string(),
  source_curriculum: z.string(),
  destination_country: z.string(),
  target_state: z.string(),
  target_district: nullableString,
  target_school: nullableString,
  target_program: nullableString,
  grade_at_transfer: z.number().int().min(9).max(12),
  expected_graduation_year: z.number().int().nullable(),
  preferred_language: z.string(),
  source_country_id: z.string().uuid().nullable(),
  source_jurisdiction_id: z.string().uuid().nullable().optional().default(null),
  source_curriculum_id: z.string().uuid().nullable(),
  destination_country_id: z.string().uuid().nullable(),
  destination_jurisdiction_id: z.string().uuid().nullable(),
  destination_framework_id: z.string().uuid().nullable(),
  destination_program_id: z.string().uuid().nullable(),
  source_jurisdiction_label: nullableString.optional().default(null),
  destination_country_label: nullableString,
  destination_jurisdiction_label: nullableString,
  destination_framework_label: nullableString,
  destination_program_label: nullableString,
  applicable_cohort: nullableString,
  framework_version_label: nullableString,
  created_at: z.string(),
  updated_at: z.string(),
});
export type StudentProfile = z.infer<typeof StudentProfileSchema>;

export const StudentProfileInputSchema = StudentProfileSchema.pick({
  first_name: true,
  last_name: true,
  origin_country: true,
  source_curriculum: true,
  destination_country: true,
  target_state: true,
  target_district: true,
  target_school: true,
  target_program: true,
  grade_at_transfer: true,
  expected_graduation_year: true,
  preferred_language: true,
  source_country_id: true,
  source_jurisdiction_id: true,
  source_curriculum_id: true,
  destination_country_id: true,
  destination_jurisdiction_id: true,
  destination_framework_id: true,
  destination_program_id: true,
  source_jurisdiction_label: true,
  destination_country_label: true,
  destination_jurisdiction_label: true,
  destination_framework_label: true,
  destination_program_label: true,
  applicable_cohort: true,
  framework_version_label: true,
});
export type StudentProfileInput = z.infer<typeof StudentProfileInputSchema>;

export const TranscriptSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  student_profile_id: z.string().uuid(),
  original_filename: nullableString,
  file_type: nullableString,
  storage_path: nullableString,
  upload_status: z.string(),
  status: z.string(),
  ocr_status: z.string().default("not_started"),
  ocr_provider: nullableString.optional(),
  ocr_started_at: nullableString.optional(),
  ocr_completed_at: nullableString.optional(),
  ocr_error: nullableString.optional(),
  ocr_error_code: nullableString.optional(),
  ocr_error_message: nullableString.optional(),
  ocr_error_stage: nullableString.optional(),
  ocr_raw_text: nullableString.optional(),
  ocr_confidence: z.coerce.number().nullable().optional(),
  ocr_page_count: z.number().int().nullable().optional(),
  ocr_language_codes: z.array(z.string()).default([]).optional(),
  primary_language_code: nullableString.optional(),
  translation_status: z.string().default("not_needed"),
  translation_provider: nullableString.optional(),
  translation_started_at: nullableString.optional(),
  translation_completed_at: nullableString.optional(),
  translation_error: nullableString.optional(),
  translated_text_en: nullableString.optional(),
  translation_confidence: z.coerce.number().nullable().optional(),
  uploaded_file_path: nullableString.optional(),
  uploaded_file_name: nullableString.optional(),
  uploaded_file_mime_type: nullableString.optional(),
  uploaded_file_size_bytes: z.coerce.number().nullable().optional(),
  processing_status: z.string().default("not_started").optional(),
  processing_stage: nullableString.optional(),
  processing_error_code: nullableString.optional(),
  processing_error_message: nullableString.optional(),
  processing_started_at: nullableString.optional(),
  processing_completed_at: nullableString.optional(),
  requires_manual_entry: z.boolean().default(false).optional(),
  ai_extraction_status: z.string().default("not_started").optional(),
  ai_extraction_provider: nullableString.optional(),
  ai_extraction_model: nullableString.optional(),
  ai_extraction_error: nullableString.optional(),
  ai_extraction_error_code: nullableString.optional(),
  ai_extraction_error_message: nullableString.optional(),
  detected_language_codes: z.array(z.string()).default([]).optional(),
  detected_source_country_id: z.string().uuid().nullable().optional(),
  detected_source_jurisdiction_id: z.string().uuid().nullable().optional(),
  detected_source_curriculum_id: z.string().uuid().nullable().optional(),
  detected_source_country: nullableString.optional(),
  detected_source_jurisdiction: nullableString.optional(),
  detected_source_curriculum: nullableString.optional(),
  detected_document_type: nullableString.optional(),
  profile_match_status: z.string().default("not_checked").optional(),
  profile_match_confidence: z.coerce.number().nullable().optional(),
  requires_source_confirmation: z.boolean().default(false).optional(),
  selected_source_country_id: z.string().uuid().nullable().optional(),
  selected_source_jurisdiction_id: z.string().uuid().nullable().optional(),
  selected_source_curriculum_id: z.string().uuid().nullable().optional(),
  source_selection_method: z.string().default("profile_default").optional(),
  framework_match_status: z.string().default("not_detected").optional(),
  framework_match_confidence: z.coerce.number().nullable().optional(),
  requires_user_confirmation: z.boolean().default(true).optional(),
  confirmed_at: nullableString.optional(),
  confirmation_status: z.string().default("not_started").optional(),
  detected_source_country_label: nullableString.optional(),
  detected_source_jurisdiction_label: nullableString.optional(),
  detected_source_curriculum_label: nullableString.optional(),
  selected_source_country_label: nullableString.optional(),
  selected_source_jurisdiction_label: nullableString.optional(),
  selected_source_curriculum_label: nullableString.optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Transcript = z.infer<typeof TranscriptSchema>;

export const TranscriptCourseSchema = z.object({
  id: z.string().uuid(),
  transcript_id: z.string().uuid(),
  course_name_original: z.string(),
  course_name_translated: nullableString,
  course_name_normalized: nullableString.optional(),
  original_language_code: nullableString.optional(),
  translated_language_code: nullableString.optional(),
  subject_category: nullableString,
  credits: z.coerce.number(),
  credits_or_units: nullableString.optional(),
  grade_original: nullableString,
  grade_normalized: z.coerce.number().nullable().optional(),
  grade_scale_original: nullableString.optional(),
  max_marks: nullableString.optional(),
  term_label_original: nullableString.optional(),
  term_label_translated: nullableString.optional(),
  academic_year_label: nullableString.optional(),
  academic_year: z.coerce.number().nullable().optional(),
  grade_level: z.number().int().nullable().optional(),
  page_number: z.number().int().nullable().optional(),
  source_text: nullableString.optional(),
  translated_source_text: nullableString.optional(),
  extraction_confidence: z.coerce.number().nullable().optional(),
  translation_confidence: z.coerce.number().nullable().optional(),
  entry_method: z.string().optional(),
  student_confirmed: z.boolean().optional(),
  needs_review: z.boolean().optional(),
  review_reason: nullableString.optional(),
  mapping_status: z.string(),
});
export type TranscriptCourse = z.infer<typeof TranscriptCourseSchema>;

export const TranscriptCourseCandidateSchema = z.object({
  id: z.string().uuid(),
  transcript_id: z.string().uuid(),
  user_id: z.string().uuid(),
  course_name_original: z.string(),
  course_name_translated: nullableString,
  course_name_normalized: nullableString,
  original_language_code: nullableString,
  translated_language_code: nullableString,
  subject_category: nullableString,
  grade_original: nullableString,
  grade_normalized: z.coerce.number().nullable(),
  grade_scale_original: nullableString,
  max_marks: nullableString,
  credits_or_units: nullableString,
  term_label_original: nullableString,
  term_label_translated: nullableString,
  academic_year: nullableString,
  grade_level: z.number().int().nullable(),
  page_number: z.number().int().nullable(),
  source_text: nullableString,
  translated_source_text: nullableString,
  extraction_confidence: z.coerce.number().nullable(),
  translation_confidence: z.coerce.number().nullable(),
  entry_method: z.string(),
  student_confirmed: z.boolean(),
  needs_review: z.boolean(),
  review_reason: nullableString,
  created_at: z.string(),
  updated_at: z.string(),
});
export type TranscriptCourseCandidate = z.infer<typeof TranscriptCourseCandidateSchema>;

export const TranscriptReviewSchema = z.object({
  transcript: TranscriptSchema.nullable(),
  candidates: z.array(TranscriptCourseCandidateSchema),
  profile: StudentProfileSchema.nullable(),
});
export type TranscriptReview = z.infer<typeof TranscriptReviewSchema>;

export const CreditMappingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  transcript_id: z.string().uuid().nullable().optional(),
  transcript_course_id: z.string().uuid(),
  student_profile_id: z.string().uuid(),
  destination_requirement_id: z.string().uuid().nullable().optional(),
  original_course_name: nullableString.optional(),
  translated_course_name: nullableString.optional(),
  normalized_course_name: nullableString.optional(),
  source_subject_category: nullableString.optional(),
  mapped_subject_category: nullableString.optional(),
  probable_destination_equivalent: nullableString.optional(),
  requirement_bucket: nullableString.optional(),
  possible_credit_value: z.coerce.number().nullable().optional(),
  credit_unit: nullableString.optional(),
  mapping_confidence: z.string().optional(),
  mapping_method: nullableString.optional(),
  mapping_status: z.string().optional(),
  counselor_review_required: z.boolean().optional(),
  review_reason: nullableString.optional(),
  evidence_summary: nullableString.optional(),
  student_note: nullableString.optional(),
  counselor_note: nullableString.optional(),
  target_subject_category: z.string().optional(),
  probable_us_equivalent: nullableString.optional(),
  credits_mapped: z.coerce.number().nullable().optional(),
  confidence: z.string().optional(),
  mapping_reason: nullableString.optional(),
  needs_counselor_review: z.boolean().optional(),
  status: z.string().optional(),
  confirmed_at: nullableString.optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type CreditMapping = z.infer<typeof CreditMappingSchema>;

export const CreditMappingRunSummarySchema = z.object({
  runId: z.string().uuid(),
  totalCourses: z.number().int(),
  highConfidenceCount: z.number().int(),
  mediumConfidenceCount: z.number().int(),
  lowConfidenceCount: z.number().int(),
  unclearCount: z.number().int(),
  counselorReviewCount: z.number().int(),
  status: z.enum(["completed", "needs_review", "failed"]),
});
export type CreditMappingRunSummary = z.infer<typeof CreditMappingRunSummarySchema>;

export const GapRequirementSchema = z.object({
  id: z.string().uuid(),
  gap_analysis_id: z.string().uuid(),
  user_id: z.string().uuid(),
  subject_category: z.string(),
  credits_required: z.coerce.number(),
  credits_mapped: z.coerce.number(),
  credits_remaining: z.coerce.number(),
  status: z.string(),
  priority: z.string(),
  notes: nullableString,
  suggested_actions: z.array(z.string()),
  destination_requirement_id: z.string().uuid().nullable().optional(),
  requirement_category: nullableString.optional(),
  requirement_type: nullableString.optional(),
  requirement_name: nullableString.optional(),
  required_amount: z.coerce.number().nullable().optional(),
  earned_likely_amount: z.coerce.number().optional(),
  earned_possible_amount: z.coerce.number().optional(),
  earned_review_amount: z.coerce.number().optional(),
  missing_amount: z.coerce.number().optional(),
  unit_type: nullableString.optional(),
  risk_level: z.string().optional(),
  matched_credit_mapping_ids: z.array(z.string().uuid()).optional(),
  supporting_course_names: z.array(z.string()).optional(),
  unclear_course_names: z.array(z.string()).optional(),
  counselor_review_required: z.boolean().optional(),
  review_reason: nullableString.optional(),
  requirement_notes: nullableString.optional(),
  student_explanation: nullableString.optional(),
  counselor_question: nullableString.optional(),
  display_order: z.number().int().optional(),
});
export type GapRequirement = z.infer<typeof GapRequirementSchema>;

export const GapAnalysisSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  student_profile_id: z.string().uuid(),
  transcript_id: z.string().uuid(),
  total_credits_required: z.coerce.number(),
  total_credits_mapped: z.coerce.number(),
  overall_status: z.string(),
  analysis_summary: nullableString,
  credit_mapping_run_id: z.string().uuid().nullable().optional(),
  destination_framework_id: z.string().uuid().nullable().optional(),
  status: z.string().optional(),
  overall_risk_level: z.string().optional(),
  total_likely_earned_credits: z.coerce.number().optional(),
  total_possible_earned_credits: z.coerce.number().optional(),
  total_missing_credits: z.coerce.number().optional(),
  high_confidence_credits: z.coerce.number().optional(),
  medium_confidence_credits: z.coerce.number().optional(),
  low_confidence_credits: z.coerce.number().optional(),
  unclear_credits: z.coerce.number().optional(),
  satisfied_requirement_count: z.number().int().optional(),
  partial_requirement_count: z.number().int().optional(),
  missing_requirement_count: z.number().int().optional(),
  counselor_review_requirement_count: z.number().int().optional(),
  assessment_gap_count: z.number().int().optional(),
  local_review_required: z.boolean().optional(),
  summary_text: nullableString.optional(),
  student_next_steps_json: z.array(z.string()).optional(),
  counselor_questions_json: z.array(z.string()).optional(),
  warnings_json: z.array(z.string()).optional(),
  completed_at: nullableString.optional(),
  updated_at: z.string().optional(),
  created_at: z.string(),
});
export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

export type GapAnalysisPayload = {
  analysis: GapAnalysis | null;
  requirements: GapRequirement[];
  profile: StudentProfile | null;
  transcript: Transcript | null;
  transcriptCourses: TranscriptCourse[];
  creditMappings: CreditMapping[];
};

export const RoadmapItemSchema = z.object({
  id: z.string().uuid(),
  roadmap_id: z.string().uuid(),
  user_id: z.string().uuid(),
  student_profile_id: z.string().uuid().nullable().optional(),
  gap_requirement_id: z.string().uuid().nullable().optional(),
  destination_requirement_id: z.string().uuid().nullable().optional(),
  credit_mapping_id: z.string().uuid().nullable().optional(),
  title: z.string(),
  description: nullableString,
  subject_category: nullableString,
  credits_needed: z.coerce.number().nullable(),
  semester_target: nullableString,
  priority: z.string(),
  completion_method: nullableString,
  action_type: z.string().optional(),
  timing_bucket: z.string().optional(),
  suggested_term: nullableString.optional(),
  suggested_grade_level: z.number().int().nullable().optional(),
  due_window_label: nullableString.optional(),
  required_before: nullableString.optional(),
  requirement_category: nullableString.optional(),
  risk_level: z.string().optional(),
  counselor_review_required: z.boolean().optional(),
  counselor_question: nullableString.optional(),
  student_instructions: nullableString.optional(),
  evidence_note: nullableString.optional(),
  completion_note: nullableString.optional(),
  display_order: z.number().int().optional(),
  completed_at: nullableString.optional(),
  status: z.string(),
  order_index: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type RoadmapItem = z.infer<typeof RoadmapItemSchema>;

export const RoadmapSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  student_profile_id: z.string().uuid(),
  gap_analysis_id: z.string().uuid().nullable(),
  transcript_id: z.string().uuid().nullable().optional(),
  destination_country_id: z.string().uuid().nullable().optional(),
  destination_jurisdiction_id: z.string().uuid().nullable().optional(),
  destination_framework_id: z.string().uuid().nullable().optional(),
  destination_program_id: z.string().uuid().nullable().optional(),
  expected_graduation_year: z.number().int().nullable().optional(),
  grade_at_transfer: z.number().int().nullable().optional(),
  title: z.string(),
  estimated_graduation_date: nullableString,
  is_on_track: z.boolean(),
  status: z.string().optional(),
  roadmap_type: z.string().optional(),
  overall_risk_level: z.string().optional(),
  timeline_urgency: z.string().optional(),
  planning_horizon: nullableString.optional(),
  total_items: z.number().int().optional(),
  completed_items: z.number().int().optional(),
  critical_items: z.number().int().optional(),
  high_priority_items: z.number().int().optional(),
  medium_priority_items: z.number().int().optional(),
  low_priority_items: z.number().int().optional(),
  counselor_review_items: z.number().int().optional(),
  summary_text: nullableString.optional(),
  timeline_summary: nullableString.optional(),
  student_next_steps_json: z.array(z.string()).optional(),
  counselor_questions_json: z.array(z.string()).optional(),
  assumptions_json: z.array(z.string()).optional(),
  warnings_json: z.array(z.string()).optional(),
  stale_reason: nullableString.optional(),
  completed_at: nullableString.optional(),
  generated_at: nullableString.optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Roadmap = z.infer<typeof RoadmapSchema>;

export type RoadmapPayload = {
  roadmap: Roadmap | null;
  items: RoadmapItem[];
  profile: StudentProfile | null;
  transcript: Transcript | null;
  transcriptCourses: TranscriptCourse[];
  creditMappings: CreditMapping[];
  gapAnalysis: GapAnalysis | null;
  gapRequirements: GapRequirement[];
};

export const CounselorPacketSectionSchema = z.object({
  id: z.string().uuid(),
  packet_id: z.string().uuid(),
  user_id: z.string().uuid(),
  section_key: z.string(),
  section_title: z.string(),
  section_order: z.number().int(),
  section_status: z.string(),
  section_snapshot_json: z.unknown(),
  missing_reason: nullableString.optional(),
  warnings_json: z.array(z.string()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CounselorPacketSection = z.infer<typeof CounselorPacketSectionSchema>;

export const CounselorPacketSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  student_profile_id: z.string().uuid(),
  transcript_id: z.string().uuid(),
  credit_mapping_run_id: z.string().uuid().nullable().optional(),
  gap_analysis_id: z.string().uuid().nullable().optional(),
  roadmap_id: z.string().uuid().nullable().optional(),
  destination_country_id: z.string().uuid().nullable().optional(),
  destination_jurisdiction_id: z.string().uuid().nullable().optional(),
  destination_framework_id: z.string().uuid().nullable().optional(),
  file_url: nullableString.optional(),
  status: z.string(),
  packet_type: z.string().optional(),
  packet_version: z.string().optional(),
  title: nullableString.optional(),
  summary_text: nullableString.optional(),
  disclaimer_text: nullableString.optional(),
  packet_snapshot_json: z.unknown().optional(),
  included_sections: z.array(z.string()).optional(),
  included_sections_json: z.array(z.unknown()).optional(),
  missing_sections_json: z.array(z.unknown()).optional(),
  warnings_json: z.array(z.string()).optional(),
  counselor_questions_json: z.array(z.string()).optional(),
  source_summary_json: z.array(z.unknown()).optional(),
  generated_file_storage_path: nullableString.optional(),
  generated_file_mime_type: nullableString.optional(),
  generated_file_size_bytes: z.coerce.number().nullable().optional(),
  generated_file_hash: nullableString.optional(),
  printable_html_storage_path: nullableString.optional(),
  pdf_generation_error: nullableString.optional(),
  stale_reason: nullableString.optional(),
  generated_at: nullableString.optional(),
  completed_at: nullableString.optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});
export type CounselorPacket = z.infer<typeof CounselorPacketSchema>;

export type CounselorPacketPayload = {
  profile: StudentProfile | null;
  transcript: Transcript | null;
  transcriptCourses: TranscriptCourse[];
  creditMappings: CreditMapping[];
  gapAnalysis: GapAnalysis | null;
  gapRequirements: GapRequirement[];
  roadmap: Roadmap | null;
  roadmapItems: RoadmapItem[];
  packet: CounselorPacket | null;
  packetSections: CounselorPacketSection[];
};

export const PathMatchSchema = z.object({
  id: z.string().uuid(),
  origin_country: z.string(),
  source_curriculum: z.string(),
  grade_at_transfer: z.number().int().nullable(),
  target_state: z.string(),
  target_program: nullableString,
  credits_transferred: z.record(z.string(), z.number()),
  credits_not_transferred: z.record(z.string(), z.number()),
  biggest_challenges: z.array(z.string()),
  advice_for_future: nullableString,
  graduated_on_time: z.boolean().nullable(),
  is_verified: z.boolean(),
});
export type PathMatch = z.infer<typeof PathMatchSchema>;

export const TwinMentorSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string(),
  origin_country: z.string(),
  source_curriculum: z.string(),
  target_state: z.string(),
  target_program: nullableString,
  topics_of_expertise: z.array(z.string()),
  is_verified: z.boolean(),
  is_available: z.boolean(),
});
export type TwinMentor = z.infer<typeof TwinMentorSchema>;

export const TwinQuestionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  question_text: z.string(),
  selected_prompt: nullableString,
  anonymous: z.boolean(),
  status: z.string(),
  created_at: z.string(),
});
export type TwinQuestion = z.infer<typeof TwinQuestionSchema>;

export const GuideTopicSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: nullableString,
  category: z.string(),
  icon_name: nullableString,
  reading_time_minutes: z.number().int(),
  order_index: z.number().int(),
  is_published: z.boolean(),
});
export type GuideTopic = z.infer<typeof GuideTopicSchema>;

export const GuideArticleSchema = z.object({
  id: z.string().uuid(),
  topic_id: z.string().uuid(),
  language: z.string(),
  title: z.string(),
  content: z.string(),
  key_takeaways: z.array(z.string()),
  is_published: z.boolean(),
});
export type GuideArticle = z.infer<typeof GuideArticleSchema>;

export const AdvisorMessageSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  sources: z.array(z.string()),
  confidence: nullableString,
  model_used: nullableString,
  created_at: z.string(),
});
export type AdvisorMessage = z.infer<typeof AdvisorMessageSchema>;

export type PassportSummary = {
  profile: StudentProfile;
  transcript: Transcript | null;
  gapAnalysis: GapAnalysis | null;
  gapRequirements: GapRequirement[];
  roadmap: Roadmap | null;
  roadmapItems: RoadmapItem[];
};

async function getUserId(): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You must be signed in to access Scholaport data.");
  return data.user.id;
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export class TranscriptApiError extends Error {
  stage: string;
  code: string;
  status: string;
  retryable: boolean;
  manualEntryAvailable: boolean;
  transcriptId: string | null;

  constructor(error: {
    message?: string;
    stage?: string;
    code?: string;
    status?: string;
    retryable?: boolean;
    manualEntryAvailable?: boolean;
    transcriptId?: string | null;
  }) {
    super(error.message || "Transcript operation failed.");
    this.name = "TranscriptApiError";
    this.stage = error.stage ?? "frontend_fetch";
    this.code = error.code ?? "frontend_fetch_failed";
    this.status = error.status ?? "failed";
    this.retryable = error.retryable ?? true;
    this.manualEntryAvailable = error.manualEntryAvailable ?? false;
    this.transcriptId = error.transcriptId ?? null;
  }
}

async function authenticatedTranscriptFetch<T>(
  init: RequestInit & { query?: URLSearchParams } = {},
): Promise<T> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in to process transcripts.");
  const url = init.query?.toString()
    ? `/api/v1/transcripts?${init.query.toString()}`
    : "/api/v1/transcripts";
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new TranscriptApiError({
      message:
        "The transcript backend route could not be reached. Check that the local server is running, then retry.",
      stage: "frontend_fetch",
      code: "frontend_fetch_failed",
      status: "failed",
      retryable: true,
      manualEntryAvailable: false,
    });
  }
  const rawBody = await response.text();
  let body: {
    success?: boolean;
    data?: unknown;
    error?: {
      message?: string;
      stage?: string;
      code?: string;
      status?: string;
      retryable?: boolean;
      manualEntryAvailable?: boolean;
      transcriptId?: string | null;
    };
  };
  try {
    body = rawBody
      ? (JSON.parse(rawBody) as typeof body)
      : { success: false, error: { message: "Transcript API returned an empty response." } };
  } catch {
    throw new TranscriptApiError({
      message:
        "The transcript backend returned a non-JSON response. This usually means the route crashed before Scholaport could format the error.",
      stage: "backend_request_received",
      code: "non_json_backend_response",
      status: "failed",
      retryable: true,
      manualEntryAvailable: false,
    });
  }
  if (!response.ok || body.success === false) {
    throw new TranscriptApiError(body.error ?? { message: "Transcript operation failed." });
  }
  return body.data as T;
}

async function authenticatedPacketFetch<T>(
  init: RequestInit & { query?: URLSearchParams } = {},
): Promise<T> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in to use counselor packets.");
  const url = init.query?.toString()
    ? `/api/v1/packets?${init.query.toString()}`
    : "/api/v1/packets";
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const body = (await response.json()) as {
    success?: boolean;
    data?: unknown;
    error?: { message?: string };
  };
  if (!response.ok || body.success === false) {
    throw new Error(body.error?.message ?? "Packet operation failed.");
  }
  return body.data as T;
}

export async function getCurrentProfile(): Promise<StudentProfile | null> {
  const client = requireSupabase();
  const userId = await getUserId();
  const { data, error } = await client
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  throwIfError(error);
  return data ? StudentProfileSchema.parse(data) : null;
}

export async function upsertCurrentProfile(input: StudentProfileInput): Promise<StudentProfile> {
  const client = requireSupabase();
  const userId = await getUserId();
  const parsed = StudentProfileInputSchema.parse(input);
  const { data, error } = await client
    .from("student_profiles")
    .upsert(
      { ...parsed, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  throwIfError(error);
  return StudentProfileSchema.parse(data);
}

export async function getPassportSummary(): Promise<PassportSummary> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Complete onboarding before loading your academic passport.");
  const client = requireSupabase();
  const userId = await getUserId();
  const [transcriptResult, gapResult, roadmapResult] = await Promise.all([
    client
      .from("transcripts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("gap_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  throwIfError(transcriptResult.error);
  throwIfError(gapResult.error);
  throwIfError(roadmapResult.error);
  const gapAnalysis = gapResult.data ? GapAnalysisSchema.parse(gapResult.data) : null;
  const roadmap = roadmapResult.data ? RoadmapSchema.parse(roadmapResult.data) : null;
  const [gapRequirementsResult, roadmapItemsResult] = await Promise.all([
    gapAnalysis
      ? client
          .from("gap_requirements")
          .select("*")
          .eq("gap_analysis_id", gapAnalysis.id)
          .order("priority")
      : Promise.resolve({ data: [], error: null }),
    roadmap
      ? client.from("roadmap_items").select("*").eq("roadmap_id", roadmap.id).order("order_index")
      : Promise.resolve({ data: [], error: null }),
  ]);
  throwIfError(gapRequirementsResult.error);
  throwIfError(roadmapItemsResult.error);
  return {
    profile,
    transcript: transcriptResult.data ? TranscriptSchema.parse(transcriptResult.data) : null,
    gapAnalysis,
    gapRequirements: z.array(GapRequirementSchema).parse(gapRequirementsResult.data ?? []),
    roadmap,
    roadmapItems: z.array(RoadmapItemSchema).parse(roadmapItemsResult.data ?? []),
  };
}

export async function getTranscriptCourses(): Promise<TranscriptCourse[]> {
  const client = requireSupabase();
  const userId = await getUserId();
  const { data: transcript, error: transcriptError } = await client
    .from("transcripts")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfError(transcriptError);
  if (!transcript) return [];
  const { data, error } = await client
    .from("transcript_courses")
    .select("*")
    .eq("transcript_id", transcript.id)
    .order("created_at");
  throwIfError(error);
  return z.array(TranscriptCourseSchema).parse(data ?? []);
}

export async function getCreditMappings(): Promise<CreditMapping[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];
  const { data, error } = await requireSupabase()
    .from("credit_mappings")
    .select("*")
    .eq("student_profile_id", profile.id)
    .neq("mapping_status", "replaced")
    .order("created_at");
  throwIfError(error);
  return z.array(CreditMappingSchema).parse(data ?? []);
}

export async function getGapAnalysis(): Promise<GapAnalysisPayload> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return {
      analysis: null,
      requirements: [],
      profile: null,
      transcript: null,
      transcriptCourses: [],
      creditMappings: [],
    };
  }
  const client = requireSupabase();
  const userId = await getUserId();
  const { data: transcript, error: transcriptError } = await client
    .from("transcripts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfError(transcriptError);
  const transcriptId = transcript?.id;
  const [analysisResult, courseResult, mappingResult] = await Promise.all([
    transcriptId
      ? client
          .from("gap_analyses")
          .select("*")
          .eq("user_id", userId)
          .eq("transcript_id", transcriptId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    transcriptId
      ? client
          .from("transcript_courses")
          .select("*")
          .eq("user_id", userId)
          .eq("transcript_id", transcriptId)
          .order("created_at")
      : Promise.resolve({ data: [], error: null }),
    transcriptId
      ? client
          .from("credit_mappings")
          .select("*")
          .eq("user_id", userId)
          .eq("transcript_id", transcriptId)
          .neq("mapping_status", "replaced")
          .order("created_at")
      : Promise.resolve({ data: [], error: null }),
  ]);
  throwIfError(analysisResult.error);
  throwIfError(courseResult.error);
  throwIfError(mappingResult.error);
  const analysis = analysisResult.data ? GapAnalysisSchema.parse(analysisResult.data) : null;
  const requirementResult = analysis
    ? await client
        .from("gap_requirements")
        .select("*")
        .eq("user_id", userId)
        .eq("gap_analysis_id", analysis.id)
        .order("display_order")
    : { data: [], error: null };
  throwIfError(requirementResult.error);
  return {
    analysis,
    requirements: z.array(GapRequirementSchema).parse(requirementResult.data ?? []),
    profile,
    transcript: transcript ? TranscriptSchema.parse(transcript) : null,
    transcriptCourses: z.array(TranscriptCourseSchema).parse(courseResult.data ?? []),
    creditMappings: z.array(CreditMappingSchema).parse(mappingResult.data ?? []),
  };
}

export async function getRoadmap(): Promise<RoadmapPayload> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return {
      roadmap: null,
      items: [],
      profile: null,
      transcript: null,
      transcriptCourses: [],
      creditMappings: [],
      gapAnalysis: null,
      gapRequirements: [],
    };
  }
  const client = requireSupabase();
  const userId = await getUserId();
  const { data: transcript, error: transcriptError } = await client
    .from("transcripts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfError(transcriptError);
  const transcriptId = transcript?.id as string | undefined;
  const [courseResult, mappingResult, analysisResult] = await Promise.all([
    transcriptId
      ? client
          .from("transcript_courses")
          .select("*")
          .eq("user_id", userId)
          .eq("transcript_id", transcriptId)
          .order("created_at")
      : Promise.resolve({ data: [], error: null }),
    transcriptId
      ? client
          .from("credit_mappings")
          .select("*")
          .eq("user_id", userId)
          .eq("transcript_id", transcriptId)
          .neq("mapping_status", "replaced")
          .order("created_at")
      : Promise.resolve({ data: [], error: null }),
    transcriptId
      ? client
          .from("gap_analyses")
          .select("*")
          .eq("user_id", userId)
          .eq("transcript_id", transcriptId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  throwIfError(courseResult.error);
  throwIfError(mappingResult.error);
  throwIfError(analysisResult.error);
  const gapAnalysis = analysisResult.data ? GapAnalysisSchema.parse(analysisResult.data) : null;
  const [gapRequirementResult, roadmapResult] = await Promise.all([
    gapAnalysis
      ? client
          .from("gap_requirements")
          .select("*")
          .eq("user_id", userId)
          .eq("gap_analysis_id", gapAnalysis.id)
          .order("display_order")
      : Promise.resolve({ data: [], error: null }),
    gapAnalysis
      ? client
          .from("roadmaps")
          .select("*")
          .eq("user_id", userId)
          .eq("gap_analysis_id", gapAnalysis.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  throwIfError(gapRequirementResult.error);
  throwIfError(roadmapResult.error);
  const roadmap = roadmapResult.data ? RoadmapSchema.parse(roadmapResult.data) : null;
  const itemResult = roadmap
    ? await client
        .from("roadmap_items")
        .select("*")
        .eq("user_id", userId)
        .eq("roadmap_id", roadmap.id)
        .order("display_order")
    : { data: [], error: null };
  throwIfError(itemResult.error);
  return {
    roadmap,
    items: z.array(RoadmapItemSchema).parse(itemResult.data ?? []),
    profile,
    transcript: transcript ? TranscriptSchema.parse(transcript) : null,
    transcriptCourses: z.array(TranscriptCourseSchema).parse(courseResult.data ?? []),
    creditMappings: z.array(CreditMappingSchema).parse(mappingResult.data ?? []),
    gapAnalysis,
    gapRequirements: z.array(GapRequirementSchema).parse(gapRequirementResult.data ?? []),
  };
}

export async function generateAcademicRoadmap(input: {
  gapAnalysisId?: string;
  transcriptId?: string;
}): Promise<unknown> {
  return authenticatedTranscriptFetch({
    method: "POST",
    body: JSON.stringify({
      action: "generate_academic_roadmap",
      payload: {
        gap_analysis_id: input.gapAnalysisId,
        transcript_id: input.transcriptId,
      },
    }),
  });
}

export async function regenerateAcademicRoadmap(input: {
  gapAnalysisId?: string;
  transcriptId?: string;
}): Promise<unknown> {
  return authenticatedTranscriptFetch({
    method: "POST",
    body: JSON.stringify({
      action: "regenerate_academic_roadmap",
      payload: {
        gap_analysis_id: input.gapAnalysisId,
        transcript_id: input.transcriptId,
      },
    }),
  });
}

export async function updateRoadmapItemStatus(
  itemId: string,
  status:
    | "todo"
    | "in_progress"
    | "done"
    | "blocked"
    | "skipped"
    | "needs_counselor"
    | "waiting_for_school",
  completionNote?: string | null,
): Promise<RoadmapItem> {
  return authenticatedTranscriptFetch<RoadmapItem>({
    method: "POST",
    body: JSON.stringify({
      action: "update_roadmap_item",
      payload: { id: itemId, status, completion_note: completionNote },
    }),
  }).then((data) => RoadmapItemSchema.parse(data));
}

export async function addManualRoadmapItem(input: {
  roadmapId: string;
  title: string;
  description?: string | null;
  actionType?: string;
  priority?: string;
  timingBucket?: string;
  counselorQuestion?: string | null;
}): Promise<RoadmapItem> {
  return authenticatedTranscriptFetch<RoadmapItem>({
    method: "POST",
    body: JSON.stringify({
      action: "add_manual_roadmap_item",
      payload: {
        roadmap_id: input.roadmapId,
        title: input.title,
        description: input.description ?? null,
        action_type: input.actionType ?? "manual_task",
        priority: input.priority ?? "medium",
        timing_bucket: input.timingBucket ?? "unknown",
        counselor_question: input.counselorQuestion ?? null,
      },
    }),
  }).then((data) => RoadmapItemSchema.parse(data));
}

function parseCounselorPacketPayload(data: unknown): CounselorPacketPayload {
  const raw = data as Record<string, unknown>;
  return {
    profile: raw.profile ? StudentProfileSchema.parse(raw.profile) : null,
    transcript: raw.transcript ? TranscriptSchema.parse(raw.transcript) : null,
    transcriptCourses: z.array(TranscriptCourseSchema).parse(raw.transcriptCourses ?? []),
    creditMappings: z.array(CreditMappingSchema).parse(raw.creditMappings ?? []),
    gapAnalysis: raw.gapAnalysis ? GapAnalysisSchema.parse(raw.gapAnalysis) : null,
    gapRequirements: z.array(GapRequirementSchema).parse(raw.gapRequirements ?? []),
    roadmap: raw.roadmap ? RoadmapSchema.parse(raw.roadmap) : null,
    roadmapItems: z.array(RoadmapItemSchema).parse(raw.roadmapItems ?? []),
    packet: raw.packet ? CounselorPacketSchema.parse(raw.packet) : null,
    packetSections: z.array(CounselorPacketSectionSchema).parse(raw.packetSections ?? []),
  };
}

export async function getLatestCounselorPacket(): Promise<CounselorPacketPayload> {
  const data = await authenticatedPacketFetch<unknown>({ method: "GET" });
  return parseCounselorPacketPayload(data);
}

export async function getCounselorPacketPreview(
  packetId?: string,
): Promise<CounselorPacketPayload> {
  const query = new URLSearchParams();
  if (packetId) query.set("packetId", packetId);
  const data = await authenticatedPacketFetch<unknown>({
    method: "GET",
    query,
  });
  return parseCounselorPacketPayload(data);
}

export async function generateCounselorPacket(input: {
  transcriptId?: string;
  gapAnalysisId?: string;
  roadmapId?: string;
}): Promise<CounselorPacketPayload> {
  const data = await authenticatedPacketFetch<{ preview: unknown }>({
    method: "POST",
    body: JSON.stringify({
      action: "generate_counselor_packet",
      payload: {
        transcript_id: input.transcriptId,
        gap_analysis_id: input.gapAnalysisId,
        roadmap_id: input.roadmapId,
      },
    }),
  });
  return parseCounselorPacketPayload(data.preview);
}

export async function regenerateCounselorPacket(input: {
  transcriptId?: string;
  gapAnalysisId?: string;
  roadmapId?: string;
}): Promise<CounselorPacketPayload> {
  const data = await authenticatedPacketFetch<{ preview: unknown }>({
    method: "POST",
    body: JSON.stringify({
      action: "regenerate_counselor_packet",
      payload: {
        transcript_id: input.transcriptId,
        gap_analysis_id: input.gapAnalysisId,
        roadmap_id: input.roadmapId,
      },
    }),
  });
  return parseCounselorPacketPayload(data.preview);
}

export async function getCounselorPacketDownloadUrl(packetId: string): Promise<unknown> {
  return authenticatedPacketFetch({
    method: "POST",
    body: JSON.stringify({
      action: "get_packet_download_url",
      payload: { packet_id: packetId },
    }),
  });
}

export async function getPathMatches(): Promise<PathMatch[]> {
  const { data, error } = await requireSupabase()
    .from("pathmatch_paths")
    .select("*")
    .eq("is_verified", true)
    .order("created_at", { ascending: false })
    .limit(20);
  throwIfError(error);
  return z.array(PathMatchSchema).parse(data ?? []);
}

export async function getTwinMentors(): Promise<TwinMentor[]> {
  const { data, error } = await requireSupabase()
    .from("twin_mentors")
    .select("*")
    .eq("is_verified", true)
    .eq("is_available", true)
    .order("created_at");
  throwIfError(error);
  return z.array(TwinMentorSchema).parse(data ?? []);
}

export async function submitTwinQuestion(input: {
  questionText: string;
  selectedPrompt?: string;
  anonymous: boolean;
}): Promise<TwinQuestion> {
  const client = requireSupabase();
  const userId = await getUserId();
  const parsed = z
    .object({
      questionText: z.string().trim().min(5).max(1000),
      selectedPrompt: z.string().optional(),
      anonymous: z.boolean(),
    })
    .parse(input);
  const { data, error } = await client
    .from("twin_questions")
    .insert({
      user_id: userId,
      question_text: parsed.questionText,
      selected_prompt: parsed.selectedPrompt ?? null,
      anonymous: parsed.anonymous,
      status: "pending_moderation",
    })
    .select("*")
    .single();
  throwIfError(error);
  return TwinQuestionSchema.parse(data);
}

export async function getPendingTwinQuestions(): Promise<TwinQuestion[]> {
  const client = requireSupabase();
  const userId = await getUserId();
  const { data, error } = await client
    .from("twin_questions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending_moderation")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return z.array(TwinQuestionSchema).parse(data ?? []);
}

export async function getGuideTopics(): Promise<GuideTopic[]> {
  const { data, error } = await requireSupabase()
    .from("guide_topics")
    .select("*")
    .eq("is_published", true)
    .order("order_index");
  throwIfError(error);
  return z.array(GuideTopicSchema).parse(data ?? []);
}

export async function getGuideArticle(
  topicId: string,
  language = "en",
): Promise<GuideArticle | null> {
  const { data, error } = await requireSupabase()
    .from("guide_articles")
    .select("*")
    .eq("topic_id", topicId)
    .eq("language", language)
    .eq("is_published", true)
    .maybeSingle();
  throwIfError(error);
  return data ? GuideArticleSchema.parse(data) : null;
}

async function getOrCreateAdvisorSession(): Promise<string> {
  const client = requireSupabase();
  const userId = await getUserId();
  const { data: existing, error: existingError } = await client
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfError(existingError);
  if (existing) return existing.id;
  const { data, error } = await client
    .from("chat_sessions")
    .insert({ user_id: userId, title: "Academic advisor", context: {}, is_active: true })
    .select("id")
    .single();
  throwIfError(error);
  if (!data) throw new Error("Unable to create an advisor session.");
  return data.id;
}

export async function getAdvisorMessages(): Promise<AdvisorMessage[]> {
  const client = requireSupabase();
  const userId = await getUserId();
  const { data: session, error: sessionError } = await client
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfError(sessionError);
  if (!session) return [];
  const { data, error } = await client
    .from("chat_messages")
    .select("*")
    .eq("session_id", session.id)
    .order("created_at");
  throwIfError(error);
  return z.array(AdvisorMessageSchema).parse(data ?? []);
}

export async function saveAdvisorMessage(input: {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  confidence?: string;
  modelUsed?: string;
}): Promise<AdvisorMessage> {
  const client = requireSupabase();
  const sessionId = await getOrCreateAdvisorSession();
  const parsed = z
    .object({
      role: z.enum(["user", "assistant"]),
      content: z.string().trim().min(1),
      sources: z.array(z.string()).default([]),
      confidence: z.string().optional(),
      modelUsed: z.string().optional(),
    })
    .parse(input);
  const { data, error } = await client
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role: parsed.role,
      content: parsed.content,
      sources: parsed.sources,
      confidence: parsed.confidence ?? null,
      model_used: parsed.modelUsed ?? null,
    })
    .select("*")
    .single();
  throwIfError(error);
  await client
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  return AdvisorMessageSchema.parse(data);
}

export async function createTranscriptUpload(
  file: File,
): Promise<{ transcript: Transcript; storageUploaded: boolean }> {
  const client = requireSupabase();
  const userId = await getUserId();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Complete onboarding before uploading a transcript.");
  const transcriptId = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userId}/${transcriptId}/${safeName}`;
  const storageResult = await client.storage.from("transcripts").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  const storageUploaded = !storageResult.error;
  const { data, error } = await client
    .from("transcripts")
    .insert({
      id: transcriptId,
      user_id: userId,
      student_profile_id: profile.id,
      original_filename: file.name,
      file_type: file.type || null,
      storage_path: storageUploaded ? storagePath : null,
      storage_error: storageResult.error?.message ?? null,
      upload_status: storageUploaded ? "uploaded_processing" : "uploaded_metadata_only",
      status: "pending",
      processing_status: storageUploaded ? "uploaded" : "storage_upload_failed",
      uploaded_file_path: storageUploaded ? storagePath : null,
      uploaded_file_name: file.name,
      uploaded_file_mime_type: file.type || null,
      uploaded_file_size_bytes: file.size,
      requires_manual_entry: !storageUploaded,
    })
    .select("*")
    .single();
  throwIfError(error);
  return { transcript: TranscriptSchema.parse(data), storageUploaded };
}

export async function getTranscriptReview(transcriptId?: string | null): Promise<TranscriptReview> {
  const query = new URLSearchParams();
  if (transcriptId) query.set("transcriptId", transcriptId);
  const data = await authenticatedTranscriptFetch<unknown>({ method: "GET", query });
  return TranscriptReviewSchema.parse(data);
}

async function transcriptAction<T>(action: string, payload?: unknown): Promise<T> {
  return authenticatedTranscriptFetch<T>({
    method: "POST",
    body: JSON.stringify({ action, payload }),
  });
}

export async function startTranscriptProcessing(transcriptId: string): Promise<TranscriptReview> {
  const data = await transcriptAction<{ review: unknown }>("start_ocr_translation", {
    transcript_id: transcriptId,
  });
  return TranscriptReviewSchema.parse(data.review);
}

export async function retryTranscriptProcessing(transcriptId: string): Promise<TranscriptReview> {
  const data = await transcriptAction<{ review: unknown }>("retry_ocr_translation", {
    transcript_id: transcriptId,
  });
  return TranscriptReviewSchema.parse(data.review);
}

export type TranscriptCandidatePatch = Partial<
  Pick<
    TranscriptCourseCandidate,
    | "course_name_original"
    | "course_name_translated"
    | "course_name_normalized"
    | "original_language_code"
    | "translated_language_code"
    | "subject_category"
    | "grade_original"
    | "grade_normalized"
    | "grade_scale_original"
    | "max_marks"
    | "credits_or_units"
    | "term_label_original"
    | "term_label_translated"
    | "academic_year"
    | "grade_level"
    | "needs_review"
    | "review_reason"
  >
> & { id: string };

export async function saveEditedTranscriptCandidate(
  patch: TranscriptCandidatePatch,
): Promise<TranscriptCourseCandidate> {
  const data = await transcriptAction<unknown>("save_edited_candidate", patch);
  return TranscriptCourseCandidateSchema.parse(data);
}

export async function addManualTranscriptCourse(
  payload: Omit<TranscriptCandidatePatch, "id"> & {
    transcript_id: string;
    course_name_original: string;
  },
): Promise<TranscriptCourseCandidate> {
  const data = await transcriptAction<unknown>("add_manual_course", payload);
  return TranscriptCourseCandidateSchema.parse(data);
}

export async function deleteTranscriptCandidate(id: string): Promise<void> {
  await transcriptAction("delete_candidate_course", { id });
}

export async function confirmTranscriptCourses(transcriptId: string): Promise<TranscriptReview> {
  const data = await transcriptAction<unknown>("confirm_transcript_courses", {
    transcript_id: transcriptId,
  });
  return TranscriptReviewSchema.parse(data);
}

export async function switchSelectedSourceFramework(payload: {
  transcript_id: string;
  method:
    | "profile_default"
    | "ocr_detected"
    | "student_override"
    | "manual_selection"
    | "counselor_review";
  selected_source_country_id?: string | null;
  selected_source_jurisdiction_id?: string | null;
  selected_source_curriculum_id?: string | null;
}): Promise<TranscriptReview> {
  const data = await transcriptAction<unknown>("switch_selected_source_framework", payload);
  return TranscriptReviewSchema.parse(data);
}

export async function markTranscriptForCounselorReview(
  transcriptId: string,
): Promise<TranscriptReview> {
  const data = await transcriptAction<unknown>("mark_for_counselor_review", {
    transcript_id: transcriptId,
  });
  return TranscriptReviewSchema.parse(data);
}

export async function startCreditMapping(transcriptId: string): Promise<CreditMappingRunSummary> {
  const data = await transcriptAction<unknown>("start_credit_mapping", {
    transcript_id: transcriptId,
  });
  return CreditMappingRunSummarySchema.parse(data);
}

export async function regenerateCreditMappings(
  transcriptId: string,
): Promise<CreditMappingRunSummary> {
  const data = await transcriptAction<unknown>("regenerate_credit_mappings", {
    transcript_id: transcriptId,
  });
  return CreditMappingRunSummarySchema.parse(data);
}

export async function updateCreditMapping(
  payload: Pick<CreditMapping, "id"> &
    Partial<
      Pick<
        CreditMapping,
        | "mapped_subject_category"
        | "probable_destination_equivalent"
        | "requirement_bucket"
        | "possible_credit_value"
        | "credit_unit"
        | "mapping_confidence"
        | "counselor_review_required"
        | "review_reason"
        | "student_note"
      >
    >,
): Promise<CreditMapping> {
  const data = await transcriptAction<unknown>("update_credit_mapping", payload);
  return CreditMappingSchema.parse(data);
}

export async function confirmCreditMapping(
  id: string,
  note?: string | null,
): Promise<CreditMapping> {
  const data = await transcriptAction<unknown>("confirm_credit_mapping", { id, note });
  return CreditMappingSchema.parse(data);
}

export async function rejectCreditMapping(
  id: string,
  note?: string | null,
): Promise<CreditMapping> {
  const data = await transcriptAction<unknown>("reject_credit_mapping", { id, note });
  return CreditMappingSchema.parse(data);
}

export async function markCreditMappingForCounselorReview(
  id: string,
  note?: string | null,
): Promise<CreditMapping> {
  const data = await transcriptAction<unknown>("mark_mapping_for_counselor_review", { id, note });
  return CreditMappingSchema.parse(data);
}

export async function startGapAnalysis(transcriptId: string): Promise<GapAnalysisPayload> {
  await transcriptAction<unknown>("start_gap_analysis", { transcript_id: transcriptId });
  return getGapAnalysis();
}

export async function regenerateGapAnalysis(transcriptId: string): Promise<GapAnalysisPayload> {
  await transcriptAction<unknown>("regenerate_gap_analysis", { transcript_id: transcriptId });
  return getGapAnalysis();
}
