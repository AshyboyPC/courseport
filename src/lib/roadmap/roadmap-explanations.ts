import type {
  GapRequirementForRoadmap,
  RoadmapActionType,
  RoadmapPriority,
  RoadmapRiskLevel,
  TimelineUrgency,
} from "./types.ts";

export function numberOrZero(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function requirementLabel(requirement: GapRequirementForRoadmap) {
  return (
    requirement.requirement_name ||
    requirement.requirement_category ||
    requirement.subject_category ||
    "Unclear requirement"
  );
}

export function requirementCategory(requirement: GapRequirementForRoadmap) {
  return requirement.requirement_category || requirement.subject_category || "unclear";
}

export function itemTitle(input: {
  requirement: GapRequirementForRoadmap;
  actionType: RoadmapActionType;
}) {
  const name = requirementLabel(input.requirement);
  if (input.actionType === "assessment_requirement")
    return `Confirm assessment requirement: ${name}`;
  if (input.actionType === "local_policy_check") return `Check local policy for ${name}`;
  if (input.actionType === "credit_review") return `Review unclear credit for ${name}`;
  if (input.actionType === "counselor_question") return `Ask your counselor about ${name}`;
  if (input.actionType === "course_planning") return `Plan next step for ${name}`;
  if (input.actionType === "elective_planning") return `Plan elective credit for ${name}`;
  if (input.actionType === "summer_option") return `Ask about summer options for ${name}`;
  if (input.actionType === "online_option") return `Ask about approved online options for ${name}`;
  if (input.actionType === "credit_recovery_option")
    return `Ask about credit-recovery options for ${name}`;
  if (input.actionType === "informational") return `Keep ${name} in counselor review notes`;
  return `Plan for ${name}`;
}

export function itemDescription(input: {
  requirement: GapRequirementForRoadmap;
  actionType: RoadmapActionType;
  urgency: TimelineUrgency;
}) {
  const name = requirementLabel(input.requirement);
  const unit = input.requirement.unit_type || "credit";
  const missing = numberOrZero(
    input.requirement.missing_amount ?? input.requirement.credits_remaining,
  );
  const explanation = input.requirement.student_explanation || input.requirement.notes;
  if (input.actionType === "assessment_requirement") {
    return `${name} appears as an assessment or non-course requirement in the saved gap analysis. Ask whether it applies to transfer students before treating it as complete.`;
  }
  if (input.actionType === "local_policy_check") {
    return `${name} depends on local school or district policy in this preview. Confirm the rule before planning around it.`;
  }
  if (input.actionType === "credit_review") {
    return `${name} has unclear or low-confidence supporting evidence. It should be reviewed before Scholaport treats it as likely satisfied.`;
  }
  if (
    input.actionType === "summer_option" ||
    input.actionType === "online_option" ||
    input.actionType === "credit_recovery_option"
  ) {
    return `Because ${name} still shows a planning gap, ask whether your school allows this kind of option for the requirement. Availability depends on the school or district.`;
  }
  if (missing > 0) {
    return `${name} still shows about ${missing.toFixed(2)} ${unit} missing or unresolved in the saved gap analysis. ${explanation ?? "Review this before course registration."}`;
  }
  return (
    explanation ||
    `${name} needs confirmation before it should be used for a school planning decision.`
  );
}

export function studentInstructions(input: {
  requirement: GapRequirementForRoadmap;
  actionType: RoadmapActionType;
}) {
  const name = requirementLabel(input.requirement);
  if (input.actionType === "assessment_requirement") {
    return `Bring this requirement name to your counselor and ask what assessment or testing steps apply.`;
  }
  if (input.actionType === "credit_review") {
    return `Bring the supporting transcript course names and ask which, if any, can count toward ${name}.`;
  }
  if (input.actionType === "course_planning" || input.actionType === "missing_credit") {
    return `Ask which destination course category or school course should be scheduled for ${name}.`;
  }
  if (
    input.actionType === "summer_option" ||
    input.actionType === "online_option" ||
    input.actionType === "credit_recovery_option"
  ) {
    return `Ask whether this option is allowed and which approved school process must be followed.`;
  }
  return `Keep this item in your counselor conversation before relying on it for planning.`;
}

export function evidenceNote(requirement: GapRequirementForRoadmap) {
  const supporting = requirement.supporting_course_names ?? [];
  const unclear = requirement.unclear_course_names ?? [];
  const parts: string[] = [];
  if (supporting.length) parts.push(`Supporting courses: ${supporting.join(", ")}`);
  if (unclear.length) parts.push(`Needs review: ${unclear.join(", ")}`);
  if (requirement.review_reason) parts.push(requirement.review_reason);
  if (requirement.requirement_notes) parts.push(requirement.requirement_notes);
  return parts.join(" · ") || null;
}

export function summarizeRoadmap(input: {
  risk: RoadmapRiskLevel;
  urgency: TimelineUrgency;
  totalItems: number;
  counselorReviewItems: number;
}) {
  if (!input.totalItems) {
    return "The saved gap analysis did not produce active roadmap tasks. Keep the preview available for counselor review.";
  }
  const review = input.counselorReviewItems
    ? ` ${input.counselorReviewItems} item(s) need counselor confirmation.`
    : "";
  if (input.risk === "red") {
    return `Scholaport created a planning preview with urgent or high-risk items from the saved gap analysis.${review}`;
  }
  if (input.risk === "yellow") {
    return `Scholaport created a planning preview focused on review items and possible remaining requirements.${review}`;
  }
  if (input.risk === "green") {
    return `Scholaport created a lower-risk planning preview from the saved gap analysis.${review}`;
  }
  return `Scholaport created a roadmap from the saved gap analysis, but some framework data still needs verification.${review}`;
}

export function nextStepsFromItems(
  items: Array<{ title: string; priority: RoadmapPriority; counselorReviewRequired: boolean }>,
) {
  return items
    .filter((item) => item.priority === "critical" || item.priority === "high")
    .slice(0, 5)
    .map((item) => item.title);
}
