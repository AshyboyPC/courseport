import type {
  GapRequirementForRoadmap,
  RequirementTypeForRoadmap,
  RoadmapActionType,
  RoadmapPriority,
  RoadmapRiskLevel,
} from "./types.ts";

const CORE_CATEGORIES = new Set([
  "english_language_arts",
  "mathematics",
  "science",
  "social_studies",
]);

export function normalizeRoadmapRisk(value: unknown): RoadmapRiskLevel {
  return value === "green" || value === "yellow" || value === "red" || value === "gray"
    ? value
    : "gray";
}

export function normalizeRequirementType(value: unknown): RequirementTypeForRoadmap {
  const type = String(value ?? "subject_credit");
  const allowed = new Set([
    "subject_credit",
    "total_credit",
    "named_course",
    "assessment",
    "non_course",
    "pathway",
    "endorsement",
    "local_requirement",
    "elective",
    "counselor_review",
    "other",
  ]);
  return allowed.has(type) ? (type as RequirementTypeForRoadmap) : "other";
}

function category(requirement: GapRequirementForRoadmap) {
  return String(
    requirement.requirement_category ?? requirement.subject_category ?? "unclear",
  ).toLowerCase();
}

function missingAmount(requirement: GapRequirementForRoadmap) {
  const parsed = Number(requirement.missing_amount ?? requirement.credits_remaining ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function actionTypeForGap(requirement: GapRequirementForRoadmap): RoadmapActionType | null {
  const status = String(requirement.status ?? "unclear");
  const type = normalizeRequirementType(requirement.requirement_type);
  if (status === "satisfied" || status === "not_applicable") return null;
  if (status === "likely_satisfied") {
    return requirement.counselor_review_required ? "informational" : null;
  }
  if (type === "assessment") return "assessment_requirement";
  if (type === "non_course" || type === "local_requirement") return "local_policy_check";
  if (status === "unclear") return "credit_review";
  if (status === "counselor_review_required") return "counselor_question";
  if (status === "partially_satisfied") return "course_planning";
  if (category(requirement).includes("elective")) return "elective_planning";
  return "missing_credit";
}

export function priorityForRoadmapItem(input: {
  requirement: GapRequirementForRoadmap;
  actionType: RoadmapActionType;
  gradeAtTransfer?: unknown;
}): RoadmapPriority {
  const existing = input.requirement.priority;
  if (
    existing === "critical" ||
    existing === "high" ||
    existing === "medium" ||
    existing === "low" ||
    existing === "informational"
  ) {
    return existing;
  }
  const grade = Number(input.gradeAtTransfer ?? 0);
  const type = normalizeRequirementType(input.requirement.requirement_type);
  const status = String(input.requirement.status ?? "unclear");
  const risk = normalizeRoadmapRisk(input.requirement.risk_level);
  const core = CORE_CATEGORIES.has(category(input.requirement));
  if (risk === "red" && (type === "assessment" || type === "named_course" || grade >= 12)) {
    return "critical";
  }
  if (status === "missing" && core && grade >= 11) return "critical";
  if (status === "missing" && (core || type === "total_credit")) return "high";
  if (input.actionType === "assessment_requirement") return grade >= 11 ? "critical" : "high";
  if (input.actionType === "counselor_question" || input.actionType === "credit_review") {
    return risk === "red" || grade >= 11 ? "high" : "medium";
  }
  if (missingAmount(input.requirement) > 0) return risk === "yellow" ? "medium" : "high";
  if (risk === "green") return "informational";
  return "medium";
}

export function priorityRank(priority: RoadmapPriority) {
  return {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    informational: 4,
  }[priority];
}
