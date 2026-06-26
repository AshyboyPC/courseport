import { isStateSpecificRequirement } from "./subject-taxonomy.ts";
import type { MappingConfidence, SubjectCategory } from "./types.ts";

export function rankConfidence(confidence: MappingConfidence) {
  return { high: 3, medium: 2, low: 1, unclear: 0 }[confidence];
}

export function computeMappingConfidence(input: {
  method: string;
  category: SubjectCategory;
  hasDestinationRequirement: boolean;
  destinationFrameworkStatus?: string | null;
  sourceFrameworkComplete: boolean;
  requirementText?: string | null;
  deterministicConfidence?: "high" | "medium" | "low";
}): MappingConfidence {
  if (input.method === "verified_rule") return "high";
  if (input.category === "unclear" || !input.hasDestinationRequirement) return "unclear";
  if (isStateSpecificRequirement(input.requirementText)) return "low";
  if (input.method === "exact_reference_match" && input.sourceFrameworkComplete) return "high";
  if (input.deterministicConfidence === "high" && input.destinationFrameworkStatus === "verified") {
    return "high";
  }
  if (input.deterministicConfidence === "medium" || input.hasDestinationRequirement)
    return "medium";
  return "low";
}

export function requiresCounselorReview(input: {
  confidence: MappingConfidence;
  requirementText?: string | null;
  sourceFrameworkComplete: boolean;
  destinationFrameworkStatus?: string | null;
  creditsMissing: boolean;
  manualOverride?: boolean;
  category: SubjectCategory;
}) {
  return (
    input.confidence === "low" ||
    input.confidence === "unclear" ||
    isStateSpecificRequirement(input.requirementText) ||
    !input.sourceFrameworkComplete ||
    input.destinationFrameworkStatus === "partial" ||
    input.creditsMissing ||
    input.manualOverride ||
    input.category === "health" ||
    input.category === "physical_education" ||
    input.category === "social_studies"
  );
}
