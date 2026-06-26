import type { GapStatus, RequirementType } from "./types.ts";

export function explainGap(input: {
  requirementName: string;
  status: GapStatus;
  likely: number;
  possible: number;
  missing: number;
  unit: string;
  requirementType: RequirementType;
  gradeAtTransfer?: number | null;
}) {
  if (input.status === "likely_satisfied") {
    return `This requirement appears likely satisfied in the Scholaport preview. Your school still makes the final credit decision.`;
  }
  if (input.status === "partially_satisfied") {
    return `You may have some supporting coursework for ${input.requirementName}, but about ${input.missing.toFixed(2)} ${input.unit} still needs review or completion.`;
  }
  if (input.status === "counselor_review_required") {
    return `This requirement depends on counselor or local school review before Scholaport can treat it as likely satisfied.`;
  }
  if (input.requirementType === "assessment") {
    return `This appears to be an assessment or EOC requirement. Coursework alone should not be treated as satisfying it unless your school confirms that rule.`;
  }
  if (input.status === "missing") {
    const urgency =
      (input.gradeAtTransfer ?? 9) >= 11
        ? "Because you are transferring later in high school, ask about this early."
        : "There may be time to plan this with your counselor.";
    return `${input.requirementName} still appears missing in this preview. ${urgency}`;
  }
  return `There is not enough verified framework or mapping data to evaluate this requirement yet.`;
}

export function summarizeGapAnalysis(input: {
  risk: string;
  missingCount: number;
  reviewCount: number;
  totalMissingCredits: number;
}) {
  if (input.risk === "red") {
    return `Scholaport found likely graduation gaps that should be reviewed with a counselor. ${input.missingCount} requirement(s) appear missing and ${input.reviewCount} need review.`;
  }
  if (input.risk === "yellow") {
    return `Scholaport found possible progress, but some credits or requirements need counselor review before they can be counted confidently.`;
  }
  if (input.risk === "green") {
    return `Scholaport did not find major missing requirements in this preview. Your school still makes the final decision.`;
  }
  return `Scholaport needs more verified framework or mapping data before this analysis can be complete.`;
}
