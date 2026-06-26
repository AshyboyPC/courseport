import type { GapPriority, GapStatus, RequirementType, RiskLevel } from "./types.ts";

export function statusForRequirement(input: {
  requiredAmount: number;
  likely: number;
  possible: number;
  review: number;
  requirementType: RequirementType;
  isStateSpecific: boolean;
  localOverride: boolean;
}): GapStatus {
  if (input.requiredAmount <= 0 && input.requirementType === "other") return "not_applicable";
  if (input.requirementType === "assessment" || input.requirementType === "non_course") {
    return input.review > 0 ? "counselor_review_required" : "missing";
  }
  if (input.isStateSpecific && input.likely <= 0) return "missing";
  if (input.localOverride) return "counselor_review_required";
  if (input.requiredAmount > 0 && input.likely >= input.requiredAmount) return "likely_satisfied";
  if (input.requiredAmount > 0 && input.likely + input.possible >= input.requiredAmount) {
    return "partially_satisfied";
  }
  if (input.possible > 0 || input.review > 0) return "partially_satisfied";
  return "missing";
}

export function riskForStatus(status: GapStatus): RiskLevel {
  if (status === "satisfied" || status === "likely_satisfied") return "green";
  if (status === "partially_satisfied" || status === "counselor_review_required") return "yellow";
  if (status === "missing") return "red";
  return "gray";
}

export function priorityForRequirement(input: {
  status: GapStatus;
  requirementType: RequirementType;
  gradeAtTransfer?: number | null;
  missingAmount: number;
  coreSubject: boolean;
  counselorReviewRequired: boolean;
}): GapPriority {
  if (input.requirementType === "assessment" && input.status === "missing") return "critical";
  if (input.status === "missing" && input.coreSubject && (input.gradeAtTransfer ?? 9) >= 11)
    return "critical";
  if (input.status === "missing" && input.coreSubject) return "high";
  if (input.counselorReviewRequired && input.coreSubject) return "high";
  if (input.status === "partially_satisfied") return "medium";
  if (input.status === "missing" && input.missingAmount > 0) return "medium";
  if (input.status === "not_applicable" || input.status === "unclear") return "informational";
  return "low";
}

export function overallRisk(requirements: Array<{ riskLevel: RiskLevel }>): RiskLevel {
  if (!requirements.length) return "gray";
  if (requirements.some((requirement) => requirement.riskLevel === "red")) return "red";
  if (requirements.some((requirement) => requirement.riskLevel === "yellow")) return "yellow";
  if (requirements.every((requirement) => requirement.riskLevel === "green")) return "green";
  return "gray";
}
