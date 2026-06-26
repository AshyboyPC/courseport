export type RoadmapStatus =
  | "not_started"
  | "processing"
  | "active"
  | "completed"
  | "failed"
  | "needs_review"
  | "stale";

export type RoadmapType =
  | "transfer_graduation_plan"
  | "counselor_meeting_plan"
  | "credit_recovery_plan"
  | "course_selection_plan";

export type RoadmapRiskLevel = "green" | "yellow" | "red" | "gray";
export type TimelineUrgency = "low" | "medium" | "high" | "urgent" | "unknown";
export type RoadmapPriority = "critical" | "high" | "medium" | "low" | "informational";

export type RoadmapItemStatus =
  | "todo"
  | "in_progress"
  | "done"
  | "blocked"
  | "skipped"
  | "needs_counselor"
  | "waiting_for_school";

export type RoadmapActionType =
  | "counselor_question"
  | "course_planning"
  | "credit_review"
  | "missing_credit"
  | "assessment_requirement"
  | "local_policy_check"
  | "transcript_followup"
  | "summer_option"
  | "online_option"
  | "credit_recovery_option"
  | "program_pathway_check"
  | "elective_planning"
  | "informational"
  | "manual_task";

export type TimingBucket =
  | "immediately"
  | "before_course_registration"
  | "current_semester"
  | "next_semester"
  | "summer"
  | "senior_year"
  | "before_graduation"
  | "ongoing"
  | "counselor_meeting"
  | "unknown";

export type GapStatusForRoadmap =
  | "satisfied"
  | "likely_satisfied"
  | "partially_satisfied"
  | "missing"
  | "unclear"
  | "not_applicable"
  | "counselor_review_required";

export type RequirementTypeForRoadmap =
  | "subject_credit"
  | "total_credit"
  | "named_course"
  | "assessment"
  | "non_course"
  | "pathway"
  | "endorsement"
  | "local_requirement"
  | "elective"
  | "counselor_review"
  | "other";

export type GapRequirementForRoadmap = {
  id: string;
  gap_analysis_id: string;
  user_id?: string;
  student_profile_id?: string | null;
  transcript_id?: string | null;
  destination_requirement_id?: string | null;
  subject_category?: string | null;
  requirement_category?: string | null;
  requirement_type?: string | null;
  requirement_name?: string | null;
  credits_required?: number | string | null;
  required_amount?: number | string | null;
  credits_mapped?: number | string | null;
  earned_likely_amount?: number | string | null;
  earned_possible_amount?: number | string | null;
  earned_review_amount?: number | string | null;
  credits_remaining?: number | string | null;
  missing_amount?: number | string | null;
  unit_type?: string | null;
  status?: string | null;
  risk_level?: string | null;
  priority?: string | null;
  matched_credit_mapping_ids?: string[] | null;
  supporting_course_names?: string[] | null;
  unclear_course_names?: string[] | null;
  counselor_review_required?: boolean | null;
  review_reason?: string | null;
  requirement_notes?: string | null;
  notes?: string | null;
  student_explanation?: string | null;
  counselor_question?: string | null;
  display_order?: number | null;
};

export type RoadmapContext = {
  userId: string;
  profile: Record<string, unknown>;
  transcript: Record<string, unknown>;
  gapAnalysis: Record<string, unknown>;
  gapRequirements: GapRequirementForRoadmap[];
  destinationFramework?: Record<string, unknown> | null;
  graduationRequirements?: Record<string, unknown>[];
};

export type GeneratedRoadmapItem = {
  gapRequirementId?: string | null;
  destinationRequirementId?: string | null;
  creditMappingId?: string | null;
  title: string;
  description: string;
  actionType: RoadmapActionType;
  priority: RoadmapPriority;
  status: RoadmapItemStatus;
  timingBucket: TimingBucket;
  suggestedTerm?: string | null;
  suggestedGradeLevel?: number | null;
  dueWindowLabel?: string | null;
  requiredBefore?: string | null;
  requirementCategory?: string | null;
  riskLevel: RoadmapRiskLevel;
  counselorReviewRequired: boolean;
  counselorQuestion?: string | null;
  studentInstructions?: string | null;
  evidenceNote?: string | null;
  completionNote?: string | null;
  displayOrder: number;
  legacyCreditsNeeded?: number | null;
  legacyCompletionMethod?: string | null;
};

export type RoadmapGenerationResult = {
  status: "active" | "needs_review";
  roadmapType: RoadmapType;
  overallRiskLevel: RoadmapRiskLevel;
  timelineUrgency: TimelineUrgency;
  planningHorizon: string;
  summaryText: string;
  timelineSummary: string;
  studentNextSteps: string[];
  counselorQuestions: string[];
  assumptions: string[];
  warnings: string[];
  items: GeneratedRoadmapItem[];
  counts: {
    total: number;
    completed: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    counselorReview: number;
  };
};
