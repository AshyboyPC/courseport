import { counselorChecklist, questionForGapRequirement } from "./counselor-checklist.ts";
import {
  normalizeRequirementType,
  normalizeRoadmapRisk,
  actionTypeForGap,
  priorityForRoadmapItem,
  priorityRank,
} from "./priority-scoring.ts";
import {
  dueWindowLabel,
  determineTimelineUrgency,
  planningHorizon,
  suggestedTiming,
  timelineSummary,
} from "./timeline-builder.ts";
import {
  evidenceNote,
  itemDescription,
  itemTitle,
  nextStepsFromItems,
  numberOrZero,
  requirementCategory,
  requirementLabel,
  studentInstructions,
  summarizeRoadmap,
} from "./roadmap-explanations.ts";
import type {
  GapRequirementForRoadmap,
  GeneratedRoadmapItem,
  RoadmapActionType,
  RoadmapContext,
  RoadmapGenerationResult,
  RoadmapPriority,
  RoadmapRiskLevel,
} from "./types.ts";

function status(requirement: GapRequirementForRoadmap) {
  return String(requirement.status ?? "unclear");
}

function shouldAddAlternateOption(input: {
  requirement: GapRequirementForRoadmap;
  priority: RoadmapPriority;
}) {
  return (
    ["critical", "high"].includes(input.priority) &&
    ["missing", "partially_satisfied"].includes(status(input.requirement)) &&
    numberOrZero(input.requirement.missing_amount ?? input.requirement.credits_remaining) > 0
  );
}

function sortItems(items: GeneratedRoadmapItem[]) {
  return items
    .slice()
    .sort((a, b) => {
      const priority = priorityRank(a.priority) - priorityRank(b.priority);
      if (priority) return priority;
      return a.displayOrder - b.displayOrder;
    })
    .map((item, index) => ({ ...item, displayOrder: index + 1 }));
}

function generatedItem(input: {
  requirement: GapRequirementForRoadmap;
  actionType: RoadmapActionType;
  priority: RoadmapPriority;
  urgency: RoadmapGenerationResult["timelineUrgency"];
  displayOrder: number;
}): GeneratedRoadmapItem {
  const timingBucket = suggestedTiming({
    urgency: input.urgency,
    priority: input.priority,
    actionType: input.actionType,
  });
  const riskLevel = normalizeRoadmapRisk(input.requirement.risk_level);
  const counselorReviewRequired =
    Boolean(input.requirement.counselor_review_required) ||
    ["unclear", "counselor_review_required"].includes(status(input.requirement)) ||
    input.actionType === "counselor_question" ||
    input.actionType === "credit_review";
  return {
    gapRequirementId: input.requirement.id,
    destinationRequirementId: input.requirement.destination_requirement_id ?? null,
    creditMappingId: input.requirement.matched_credit_mapping_ids?.[0] ?? null,
    title: itemTitle({ requirement: input.requirement, actionType: input.actionType }),
    description: itemDescription({
      requirement: input.requirement,
      actionType: input.actionType,
      urgency: input.urgency,
    }),
    actionType: input.actionType,
    priority: input.priority,
    status: counselorReviewRequired ? "needs_counselor" : "todo",
    timingBucket,
    suggestedTerm: null,
    suggestedGradeLevel: null,
    dueWindowLabel: dueWindowLabel({ timingBucket, urgency: input.urgency }),
    requiredBefore: timingBucket === "before_graduation" ? "Graduation deadline" : null,
    requirementCategory: requirementCategory(input.requirement),
    riskLevel,
    counselorReviewRequired,
    counselorQuestion: counselorReviewRequired
      ? questionForGapRequirement(input.requirement)
      : null,
    studentInstructions: studentInstructions({
      requirement: input.requirement,
      actionType: input.actionType,
    }),
    evidenceNote: evidenceNote(input.requirement),
    displayOrder: input.displayOrder,
    legacyCreditsNeeded: numberOrZero(
      input.requirement.missing_amount ?? input.requirement.credits_remaining,
    ),
    legacyCompletionMethod:
      input.actionType === "counselor_question" || counselorReviewRequired
        ? "counselor_meeting"
        : input.actionType,
  };
}

function alternateOptionItem(input: {
  requirement: GapRequirementForRoadmap;
  urgency: RoadmapGenerationResult["timelineUrgency"];
  displayOrder: number;
}): GeneratedRoadmapItem {
  const timingBucket = suggestedTiming({
    urgency: input.urgency,
    priority: "medium",
    actionType: "summer_option",
  });
  const label = requirementLabel(input.requirement);
  return {
    gapRequirementId: input.requirement.id,
    destinationRequirementId: input.requirement.destination_requirement_id ?? null,
    creditMappingId: null,
    title: itemTitle({ requirement: input.requirement, actionType: "summer_option" }),
    description: `If ${label} cannot fit into the regular schedule, ask whether summer school, approved online coursework, or credit recovery is allowed. Availability depends on the school or district.`,
    actionType: "summer_option",
    priority: "medium",
    status: "needs_counselor",
    timingBucket,
    suggestedTerm: null,
    suggestedGradeLevel: null,
    dueWindowLabel: dueWindowLabel({ timingBucket, urgency: input.urgency }),
    requiredBefore: null,
    requirementCategory: requirementCategory(input.requirement),
    riskLevel: normalizeRoadmapRisk(input.requirement.risk_level),
    counselorReviewRequired: true,
    counselorQuestion: `Are summer school, approved online options, or credit recovery allowed for ${label}?`,
    studentInstructions:
      "Ask which options are actually approved by your school before planning around them.",
    evidenceNote: evidenceNote(input.requirement),
    displayOrder: input.displayOrder,
    legacyCreditsNeeded: numberOrZero(
      input.requirement.missing_amount ?? input.requirement.credits_remaining,
    ),
    legacyCompletionMethod: "counselor_meeting",
  };
}

function riskFromGapAnalysis(gapAnalysis: Record<string, unknown>): RoadmapRiskLevel {
  return normalizeRoadmapRisk(gapAnalysis.overall_risk_level);
}

function counts(items: GeneratedRoadmapItem[]) {
  return {
    total: items.length,
    completed: items.filter((item) => item.status === "done").length,
    critical: items.filter((item) => item.priority === "critical").length,
    high: items.filter((item) => item.priority === "high").length,
    medium: items.filter((item) => item.priority === "medium").length,
    low: items.filter((item) => item.priority === "low").length,
    counselorReview: items.filter((item) => item.counselorReviewRequired).length,
  };
}

function assumptions(input: RoadmapContext) {
  const values = [
    "Roadmap items are generated from the latest saved gap analysis and saved gap requirement rows.",
    "Credit and requirement decisions must be confirmed by the destination school or counselor.",
  ];
  if (!input.profile.expected_graduation_year) {
    values.push("Timeline urgency is limited because expected graduation year is missing.");
  }
  if (!input.destinationFramework) {
    values.push("Destination framework details were not loaded for this roadmap.");
  }
  return values;
}

function warnings(input: { items: GeneratedRoadmapItem[]; risk: RoadmapRiskLevel }) {
  const values = [
    "This roadmap is a planning preview, not an official school schedule.",
    "Do not treat roadmap completion as official credit approval.",
  ];
  if (input.items.some((item) => item.counselorReviewRequired)) {
    values.push(
      "Some tasks require counselor or local school confirmation before planning around them.",
    );
  }
  if (input.risk === "red") {
    values.push(
      "High-risk items should be discussed before course registration or graduation deadlines.",
    );
  }
  return values;
}

export function generateRoadmapFromGapAnalysis(context: RoadmapContext): RoadmapGenerationResult {
  const urgency = determineTimelineUrgency({
    gradeAtTransfer: context.profile.grade_at_transfer,
    expectedGraduationYear: context.profile.expected_graduation_year,
  });
  const baseItems: GeneratedRoadmapItem[] = [];
  let displayOrder = 1;
  for (const requirement of context.gapRequirements) {
    const actionType = actionTypeForGap(requirement);
    if (!actionType) continue;
    const priority = priorityForRoadmapItem({
      requirement,
      actionType,
      gradeAtTransfer: context.profile.grade_at_transfer,
    });
    const type = normalizeRequirementType(requirement.requirement_type);
    baseItems.push(
      generatedItem({
        requirement: {
          ...requirement,
          requirement_type: type,
        },
        actionType,
        priority,
        urgency,
        displayOrder: displayOrder++,
      }),
    );
    if (shouldAddAlternateOption({ requirement, priority })) {
      baseItems.push(alternateOptionItem({ requirement, urgency, displayOrder: displayOrder++ }));
    }
  }

  const items = sortItems(baseItems);
  const itemCounts = counts(items);
  const risk = riskFromGapAnalysis(context.gapAnalysis);
  const counselorQuestions = counselorChecklist({
    items,
    gapRequirements: context.gapRequirements,
  });
  const nextSteps = nextStepsFromItems(items);
  return {
    status: itemCounts.counselorReview ? "needs_review" : "active",
    roadmapType: "transfer_graduation_plan",
    overallRiskLevel: risk,
    timelineUrgency: urgency,
    planningHorizon: planningHorizon({
      gradeAtTransfer: context.profile.grade_at_transfer,
      expectedGraduationYear: context.profile.expected_graduation_year,
    }),
    summaryText: summarizeRoadmap({
      risk,
      urgency,
      totalItems: itemCounts.total,
      counselorReviewItems: itemCounts.counselorReview,
    }),
    timelineSummary: timelineSummary({
      urgency,
      gradeAtTransfer: context.profile.grade_at_transfer,
      expectedGraduationYear: context.profile.expected_graduation_year,
    }),
    studentNextSteps: nextSteps.length
      ? nextSteps
      : ["Keep this roadmap available for your next counselor conversation."],
    counselorQuestions,
    assumptions: assumptions(context),
    warnings: warnings({ items, risk }),
    items,
    counts: itemCounts,
  };
}
