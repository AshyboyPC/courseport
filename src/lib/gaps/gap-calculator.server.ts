import { aggregateMappingsForRequirement, emptyAggregation } from "./credit-aggregation.ts";
import { counselorQuestionForRequirement, uniqueQuestions } from "./counselor-questions.ts";
import { explainGap, summarizeGapAnalysis } from "./gap-explanations.ts";
import {
  inferRequirementType,
  isStateSpecificNamedRequirement,
  normalizeRequirementCategory,
  requirementDisplayName,
} from "./requirement-matcher.ts";
import {
  overallRisk,
  priorityForRequirement,
  riskForStatus,
  statusForRequirement,
} from "./risk-scoring.ts";
import type {
  CreditMappingForGap,
  GapAnalysisResult,
  GraduationRequirementForGap,
  RequirementGapResult,
} from "./types.ts";

const CORE_CATEGORIES = new Set([
  "english_language_arts",
  "mathematics",
  "science",
  "social_studies",
]);

function numberOrZero(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function highMediumLowTotals(mappings: CreditMappingForGap[]) {
  return mappings.reduce(
    (totals, mapping) => {
      if (mapping.mapping_status === "rejected" || mapping.mapping_status === "replaced")
        return totals;
      const credit = numberOrZero(mapping.possible_credit_value);
      if (mapping.mapping_confidence === "high") totals.high += credit;
      else if (mapping.mapping_confidence === "medium") totals.medium += credit;
      else if (mapping.mapping_confidence === "low") totals.low += credit;
      else totals.unclear += credit;
      return totals;
    },
    { high: 0, medium: 0, low: 0, unclear: 0 },
  );
}

function stateSpecificAggregation(input: {
  requirement: GraduationRequirementForGap;
  category: string;
  mappings: CreditMappingForGap[];
}) {
  if (!isStateSpecificNamedRequirement(input.requirement)) {
    return aggregateMappingsForRequirement({
      requirementId: input.requirement.id,
      category: input.category,
      mappings: input.mappings,
    });
  }
  const direct = aggregateMappingsForRequirement({
    requirementId: input.requirement.id,
    category: input.category,
    mappings: input.mappings.filter(
      (mapping) => mapping.destination_requirement_id === input.requirement.id,
    ),
  });
  const generic = input.mappings.filter(
    (mapping) =>
      !mapping.destination_requirement_id &&
      [mapping.mapped_subject_category, mapping.requirement_bucket]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .includes(input.category.toLowerCase()),
  );
  for (const mapping of generic) {
    direct.review += numberOrZero(mapping.possible_credit_value);
    direct.unclearCourseNames.push(
      mapping.translated_course_name ||
        mapping.original_course_name ||
        "Possible supporting course",
    );
  }
  return direct;
}

function resultForRequirement(input: {
  requirement: GraduationRequirementForGap;
  mappings: CreditMappingForGap[];
  gradeAtTransfer?: number | null;
  displayOrder: number;
}): RequirementGapResult {
  const category = normalizeRequirementCategory(input.requirement.subject_category);
  const requirementType = inferRequirementType(input.requirement);
  const isStateSpecific = isStateSpecificNamedRequirement(input.requirement);
  const aggregation = stateSpecificAggregation({
    requirement: input.requirement,
    category,
    mappings: input.mappings,
  });
  const requiredAmount = numberOrZero(input.requirement.credits_required);
  const missingAmount = Math.max(0, requiredAmount - aggregation.likely);
  const status = statusForRequirement({
    requiredAmount,
    likely: aggregation.likely,
    possible: aggregation.possible,
    review: aggregation.review,
    requirementType,
    isStateSpecific,
    localOverride: Boolean(input.requirement.local_override),
  });
  const riskLevel = riskForStatus(status);
  const counselorReviewRequired =
    status === "counselor_review_required" ||
    aggregation.review > 0 ||
    aggregation.mappings.some((mapping) => mapping.counselor_review_required);
  const requirementName = requirementDisplayName(input.requirement);
  const priority = priorityForRequirement({
    status,
    requirementType,
    gradeAtTransfer: input.gradeAtTransfer,
    missingAmount,
    coreSubject: CORE_CATEGORIES.has(category),
    counselorReviewRequired,
  });
  const studentExplanation = explainGap({
    requirementName,
    status,
    likely: aggregation.likely,
    possible: aggregation.possible,
    missing: missingAmount,
    unit: input.requirement.unit_name || "credit(s)",
    requirementType,
    gradeAtTransfer: input.gradeAtTransfer,
  });
  const partial: RequirementGapResult = {
    destinationRequirementId: input.requirement.id,
    requirementCategory: category,
    requirementType,
    requirementName,
    requiredAmount,
    earnedLikelyAmount: aggregation.likely,
    earnedPossibleAmount: aggregation.possible,
    earnedReviewAmount: aggregation.review,
    missingAmount,
    unitType: input.requirement.unit_name || "credit",
    status,
    riskLevel,
    priority,
    matchedCreditMappingIds: aggregation.mappings.map((mapping) => mapping.id),
    supportingCourseNames: Array.from(new Set(aggregation.supportingCourseNames)),
    unclearCourseNames: Array.from(new Set(aggregation.unclearCourseNames)),
    counselorReviewRequired,
    reviewReason: counselorReviewRequired
      ? "Credit placement requires counselor or local school review."
      : null,
    requirementNotes: input.requirement.notes ?? null,
    studentExplanation,
    counselorQuestion: "",
    displayOrder: input.displayOrder,
  };
  return { ...partial, counselorQuestion: counselorQuestionForRequirement(partial) };
}

function addTotalCreditRequirement(input: {
  frameworkTotalCredits?: number | null;
  mappings: CreditMappingForGap[];
  gradeAtTransfer?: number | null;
  displayOrder: number;
}): RequirementGapResult | null {
  const total = numberOrZero(input.frameworkTotalCredits);
  if (!total) return null;
  const aggregation = emptyAggregation();
  for (const mapping of input.mappings) {
    if (mapping.mapping_status === "rejected" || mapping.mapping_status === "replaced") continue;
    const credit = numberOrZero(mapping.possible_credit_value);
    if (mapping.mapping_confidence === "high" && !mapping.counselor_review_required)
      aggregation.likely += credit;
    else if (mapping.mapping_confidence === "high" || mapping.mapping_confidence === "medium")
      aggregation.possible += credit;
    else aggregation.review += credit;
  }
  const missing = Math.max(0, total - aggregation.likely);
  const status = statusForRequirement({
    requiredAmount: total,
    likely: aggregation.likely,
    possible: aggregation.possible,
    review: aggregation.review,
    requirementType: "total_credit",
    isStateSpecific: false,
    localOverride: false,
  });
  const riskLevel = riskForStatus(status);
  const partial: RequirementGapResult = {
    destinationRequirementId: null,
    requirementCategory: "total_credits",
    requirementType: "total_credit",
    requirementName: "Total credits",
    requiredAmount: total,
    earnedLikelyAmount: aggregation.likely,
    earnedPossibleAmount: aggregation.possible,
    earnedReviewAmount: aggregation.review,
    missingAmount: missing,
    unitType: "credit",
    status,
    riskLevel,
    priority: priorityForRequirement({
      status,
      requirementType: "total_credit",
      gradeAtTransfer: input.gradeAtTransfer,
      missingAmount: missing,
      coreSubject: false,
      counselorReviewRequired: aggregation.review > 0,
    }),
    matchedCreditMappingIds: [],
    supportingCourseNames: [],
    unclearCourseNames: [],
    counselorReviewRequired: aggregation.review > 0,
    reviewReason:
      aggregation.review > 0 ? "Some possible credits still need counselor review." : null,
    requirementNotes: null,
    studentExplanation: explainGap({
      requirementName: "Total credits",
      status,
      likely: aggregation.likely,
      possible: aggregation.possible,
      missing,
      unit: "credit(s)",
      requirementType: "total_credit",
      gradeAtTransfer: input.gradeAtTransfer,
    }),
    counselorQuestion: "How many total local credits can be awarded from my previous transcript?",
    displayOrder: input.displayOrder,
  };
  return partial;
}

export function calculateGapAnalysis(input: {
  requirements: GraduationRequirementForGap[];
  mappings: CreditMappingForGap[];
  frameworkTotalCredits?: number | null;
  gradeAtTransfer?: number | null;
  expectedGraduationYear?: number | null;
}): GapAnalysisResult {
  const requirementResults = input.requirements.map((requirement, index) =>
    resultForRequirement({
      requirement,
      mappings: input.mappings,
      gradeAtTransfer: input.gradeAtTransfer,
      displayOrder: index + 1,
    }),
  );
  const totalRequirement = addTotalCreditRequirement({
    frameworkTotalCredits: input.frameworkTotalCredits,
    mappings: input.mappings,
    gradeAtTransfer: input.gradeAtTransfer,
    displayOrder: requirementResults.length + 1,
  });
  const requirements = totalRequirement
    ? [totalRequirement, ...requirementResults]
    : requirementResults;
  const withQuestions = requirements.map((requirement) => ({
    ...requirement,
    counselorQuestion:
      requirement.counselorQuestion || "Can this requirement be reviewed for transfer credit?",
  }));
  const risk = overallRisk(withQuestions);
  const totals = highMediumLowTotals(input.mappings);
  const missingCount = withQuestions.filter(
    (requirement) => requirement.status === "missing",
  ).length;
  const reviewCount = withQuestions.filter(
    (requirement) => requirement.counselorReviewRequired,
  ).length;
  return {
    status: reviewCount ? "needs_review" : "completed",
    overallRiskLevel: risk,
    totalRequiredCredits: withQuestions.reduce(
      (sum, requirement) => sum + requirement.requiredAmount,
      0,
    ),
    totalLikelyEarnedCredits: withQuestions.reduce(
      (sum, requirement) => sum + requirement.earnedLikelyAmount,
      0,
    ),
    totalPossibleEarnedCredits: withQuestions.reduce(
      (sum, requirement) => sum + requirement.earnedLikelyAmount + requirement.earnedPossibleAmount,
      0,
    ),
    totalMissingCredits: withQuestions.reduce(
      (sum, requirement) => sum + requirement.missingAmount,
      0,
    ),
    highConfidenceCredits: totals.high,
    mediumConfidenceCredits: totals.medium,
    lowConfidenceCredits: totals.low,
    unclearCredits: totals.unclear,
    satisfiedRequirementCount: withQuestions.filter((requirement) =>
      ["satisfied", "likely_satisfied"].includes(requirement.status),
    ).length,
    partialRequirementCount: withQuestions.filter(
      (requirement) => requirement.status === "partially_satisfied",
    ).length,
    missingRequirementCount: missingCount,
    counselorReviewRequirementCount: reviewCount,
    assessmentGapCount: withQuestions.filter(
      (requirement) =>
        requirement.requirementType === "assessment" && requirement.status !== "likely_satisfied",
    ).length,
    localReviewRequired: withQuestions.some(
      (requirement) => requirement.requirementType === "local_requirement",
    ),
    summaryText: summarizeGapAnalysis({
      risk,
      missingCount,
      reviewCount,
      totalMissingCredits: 0,
    }),
    studentNextSteps: [
      "Review each red or yellow requirement with your counselor.",
      "Bring original and translated transcript course names to the meeting.",
      "Ask which possible credits can be confirmed before course registration.",
    ],
    counselorQuestions: uniqueQuestions(withQuestions),
    warnings: [
      "Scholaport gap analysis is a preview, not an official graduation decision.",
      "Low or unclear mappings are not counted as satisfied requirements.",
    ],
    requirements: withQuestions,
  };
}
