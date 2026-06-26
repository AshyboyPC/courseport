export type GapStatus =
  | "satisfied"
  | "likely_satisfied"
  | "partially_satisfied"
  | "missing"
  | "unclear"
  | "not_applicable"
  | "counselor_review_required";

export type RiskLevel = "green" | "yellow" | "red" | "gray";
export type GapPriority = "critical" | "high" | "medium" | "low" | "informational";

export type RequirementType =
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

export type CreditMappingForGap = {
  id: string;
  transcript_course_id: string;
  destination_requirement_id?: string | null;
  mapped_subject_category?: string | null;
  probable_destination_equivalent?: string | null;
  requirement_bucket?: string | null;
  possible_credit_value?: number | null;
  mapping_confidence?: "high" | "medium" | "low" | "unclear" | string | null;
  mapping_method?: string | null;
  mapping_status?: string | null;
  counselor_review_required?: boolean | null;
  original_course_name?: string | null;
  translated_course_name?: string | null;
};

export type GraduationRequirementForGap = {
  id: string;
  subject_category?: string | null;
  credits_required?: number | null;
  specific_courses?: string[] | null;
  notes?: string | null;
  requirement_type?: string | null;
  requirement_kind?: string | null;
  requirement_code?: string | null;
  unit_name?: string | null;
  local_override?: boolean | null;
  priority?: string | null;
};

export type RequirementGapResult = {
  destinationRequirementId?: string | null;
  requirementCategory: string;
  requirementType: RequirementType;
  requirementName: string;
  requiredAmount: number;
  earnedLikelyAmount: number;
  earnedPossibleAmount: number;
  earnedReviewAmount: number;
  missingAmount: number;
  unitType: string;
  status: GapStatus;
  riskLevel: RiskLevel;
  priority: GapPriority;
  matchedCreditMappingIds: string[];
  supportingCourseNames: string[];
  unclearCourseNames: string[];
  counselorReviewRequired: boolean;
  reviewReason?: string | null;
  requirementNotes?: string | null;
  studentExplanation: string;
  counselorQuestion: string;
  displayOrder: number;
};

export type GapAnalysisResult = {
  status: "completed" | "needs_review";
  overallRiskLevel: RiskLevel;
  totalRequiredCredits: number;
  totalLikelyEarnedCredits: number;
  totalPossibleEarnedCredits: number;
  totalMissingCredits: number;
  highConfidenceCredits: number;
  mediumConfidenceCredits: number;
  lowConfidenceCredits: number;
  unclearCredits: number;
  satisfiedRequirementCount: number;
  partialRequirementCount: number;
  missingRequirementCount: number;
  counselorReviewRequirementCount: number;
  assessmentGapCount: number;
  localReviewRequired: boolean;
  summaryText: string;
  studentNextSteps: string[];
  counselorQuestions: string[];
  warnings: string[];
  requirements: RequirementGapResult[];
};
