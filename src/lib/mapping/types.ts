export const SUBJECT_CATEGORIES = [
  "english_language_arts",
  "mathematics",
  "science",
  "social_studies",
  "world_language",
  "physical_education",
  "health",
  "arts",
  "career_technical",
  "computer_science",
  "financial_literacy",
  "elective",
  "unclear",
] as const;

export type SubjectCategory = (typeof SUBJECT_CATEGORIES)[number];
export type MappingConfidence = "high" | "medium" | "low" | "unclear";
export type MappingMethod =
  | "verified_rule"
  | "exact_reference_match"
  | "deterministic_taxonomy"
  | "vector_similarity"
  | "structured_ai"
  | "manual_student"
  | "counselor_review";
export type MappingStatus =
  | "candidate"
  | "student_confirmed"
  | "counselor_review_required"
  | "counselor_confirmed"
  | "rejected"
  | "replaced";
export type CreditUnit = "credit" | "unit" | "carnegie_unit" | "local_unit" | "unknown";

export type StructuredCourseMappingOutput = {
  original_course_name: string;
  translated_course_name: string | null;
  normalized_course_name: string;
  source_subject_category: SubjectCategory;
  mapped_subject_category: SubjectCategory;
  probable_destination_equivalent: string;
  requirement_bucket: string | null;
  possible_credit_value: number | null;
  credit_unit: CreditUnit;
  confidence: MappingConfidence;
  counselor_review_required: boolean;
  review_reason: string | null;
  evidence_summary: string;
  warnings: string[];
};

export type TranscriptCourseForMapping = {
  id: string;
  transcript_id: string;
  course_name_original: string;
  course_name_translated?: string | null;
  course_name_normalized?: string | null;
  original_language_code?: string | null;
  subject_category?: string | null;
  credits?: number | null;
  credits_or_units?: string | null;
  grade_original?: string | null;
  grade_level?: number | null;
  student_confirmed?: boolean | null;
  mapping_status?: string | null;
};

export type MappingContext = {
  userId: string;
  transcript: Record<string, unknown>;
  profile: Record<string, unknown>;
  sourceCountryId?: string | null;
  sourceJurisdictionId?: string | null;
  sourceCurriculumId?: string | null;
  destinationCountryId?: string | null;
  destinationJurisdictionId?: string | null;
  destinationFrameworkId?: string | null;
  destinationFramework?: Record<string, unknown> | null;
  destinationRequirements: Array<Record<string, unknown>>;
  sourceCurriculumCourses: Array<Record<string, unknown>>;
  mappingRules: Array<Record<string, unknown>>;
};

export type CourseMappingCandidate = {
  transcript_course_id: string;
  student_profile_id: string;
  transcript_id: string;
  user_id: string;
  source_country_id?: string | null;
  source_jurisdiction_id?: string | null;
  source_curriculum_id?: string | null;
  destination_country_id?: string | null;
  destination_jurisdiction_id?: string | null;
  destination_framework_id?: string | null;
  destination_requirement_id?: string | null;
  original_course_name: string;
  translated_course_name?: string | null;
  normalized_course_name: string;
  source_subject_category: SubjectCategory;
  mapped_subject_category: SubjectCategory;
  probable_destination_equivalent: string;
  requirement_bucket?: string | null;
  possible_credit_value?: number | null;
  credit_unit: CreditUnit;
  mapping_confidence: MappingConfidence;
  mapping_method: MappingMethod;
  mapping_status: MappingStatus;
  counselor_review_required: boolean;
  review_reason?: string | null;
  evidence_summary: string;
  source_evidence_json: Record<string, unknown>;
  ai_model?: string | null;
  ai_response_json?: unknown;
};

export type MappingRunSummary = {
  runId: string;
  totalCourses: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  unclearCount: number;
  counselorReviewCount: number;
  status: "completed" | "needs_review" | "failed";
};
