import type { RequirementGapResult } from "./types.ts";

export function counselorQuestionForRequirement(result: RequirementGapResult) {
  if (result.requirementType === "assessment") {
    return `Do I need to complete this assessment or EOC requirement as a transfer student?`;
  }
  if (result.requirementCategory.includes("social")) {
    return `Can my previous social studies coursework count toward any ${result.requirementName} credit, and do I still need U.S.-specific history or government?`;
  }
  if (result.requirementCategory.includes("language")) {
    return `Can my prior language coursework count toward world language or elective credit?`;
  }
  if (
    result.requirementCategory.includes("health") ||
    result.requirementCategory.includes("physical")
  ) {
    return `Can my previous health or physical education coursework count toward this local requirement?`;
  }
  return `Can my previous coursework count toward ${result.requirementName}, and how many local credits can be awarded?`;
}

export function uniqueQuestions(requirements: RequirementGapResult[]) {
  return Array.from(
    new Set(
      requirements
        .filter((requirement) => requirement.riskLevel !== "green")
        .map((requirement) => requirement.counselorQuestion)
        .filter(Boolean),
    ),
  ).slice(0, 8);
}
