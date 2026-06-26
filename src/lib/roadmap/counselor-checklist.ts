import type { GeneratedRoadmapItem, GapRequirementForRoadmap } from "./types.ts";
import { requirementCategory, requirementLabel } from "./roadmap-explanations.ts";

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function questionForGapRequirement(requirement: GapRequirementForRoadmap) {
  if (requirement.counselor_question) return requirement.counselor_question;
  const label = requirementLabel(requirement);
  const category = requirementCategory(requirement);
  if (requirement.unclear_course_names?.length) {
    return `Can my ${requirement.unclear_course_names.join(", ")} coursework count toward ${label}?`;
  }
  if (String(requirement.requirement_type) === "assessment") {
    return `Does ${label} apply to me as a transfer student?`;
  }
  if (String(requirement.requirement_type) === "local_requirement") {
    return `Does my school or district add local rules for ${label}?`;
  }
  return `Which next step should I plan for ${label} in the ${category} category?`;
}

export function counselorChecklist(input: {
  items: GeneratedRoadmapItem[];
  gapRequirements: GapRequirementForRoadmap[];
}) {
  const itemQuestions = input.items
    .filter((item) => item.counselorReviewRequired || item.actionType === "counselor_question")
    .map((item) => item.counselorQuestion ?? "");
  const requirementQuestions = input.gapRequirements
    .filter(
      (requirement) =>
        requirement.counselor_review_required ||
        ["missing", "unclear", "partially_satisfied", "counselor_review_required"].includes(
          String(requirement.status),
        ),
    )
    .map(questionForGapRequirement);
  const graduationTimeline = input.items.some(
    (item) => item.priority === "critical" || item.timingBucket === "before_graduation",
  )
    ? ["Which missing or review-needed items should be handled first for my graduation timeline?"]
    : [];
  return unique([...itemQuestions, ...requirementQuestions, ...graduationTimeline]).slice(0, 12);
}
