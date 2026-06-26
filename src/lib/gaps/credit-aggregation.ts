import type { CreditMappingForGap } from "./types.ts";

export type AggregatedCredits = {
  likely: number;
  possible: number;
  review: number;
  high: number;
  medium: number;
  low: number;
  unclear: number;
  mappings: CreditMappingForGap[];
  supportingCourseNames: string[];
  unclearCourseNames: string[];
};

export function emptyAggregation(): AggregatedCredits {
  return {
    likely: 0,
    possible: 0,
    review: 0,
    high: 0,
    medium: 0,
    low: 0,
    unclear: 0,
    mappings: [],
    supportingCourseNames: [],
    unclearCourseNames: [],
  };
}

function creditValue(mapping: CreditMappingForGap) {
  const value = Number(mapping.possible_credit_value ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function courseName(mapping: CreditMappingForGap) {
  return (
    mapping.translated_course_name ||
    mapping.original_course_name ||
    mapping.probable_destination_equivalent ||
    "Transcript course"
  );
}

export function isRejected(mapping: CreditMappingForGap) {
  return mapping.mapping_status === "rejected" || mapping.mapping_status === "replaced";
}

export function addMappingCredit(aggregation: AggregatedCredits, mapping: CreditMappingForGap) {
  if (isRejected(mapping)) return aggregation;
  if (aggregation.mappings.some((existing) => existing.id === mapping.id)) return aggregation;
  const value = creditValue(mapping);
  const confidence = mapping.mapping_confidence ?? "unclear";
  aggregation.mappings.push(mapping);
  if (confidence === "high" && !mapping.counselor_review_required) {
    aggregation.likely += value;
    aggregation.high += value;
    aggregation.supportingCourseNames.push(courseName(mapping));
  } else if (confidence === "high" || confidence === "medium") {
    aggregation.possible += value;
    if (confidence === "high") aggregation.high += value;
    if (confidence === "medium") aggregation.medium += value;
    aggregation.supportingCourseNames.push(courseName(mapping));
  } else if (confidence === "low") {
    aggregation.review += value;
    aggregation.low += value;
    aggregation.unclearCourseNames.push(courseName(mapping));
  } else {
    aggregation.review += value;
    aggregation.unclear += value;
    aggregation.unclearCourseNames.push(courseName(mapping));
  }
  return aggregation;
}

export function aggregateMappingsForRequirement(input: {
  requirementId?: string | null;
  category: string;
  mappings: CreditMappingForGap[];
}) {
  const aggregation = emptyAggregation();
  const category = input.category.toLowerCase();
  for (const mapping of input.mappings) {
    const direct =
      input.requirementId && mapping.destination_requirement_id === input.requirementId;
    const categoryMatch =
      !mapping.destination_requirement_id &&
      [mapping.mapped_subject_category, mapping.requirement_bucket]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .some(
          (value) => value === category || value.includes(category) || category.includes(value),
        );
    if (direct || categoryMatch) addMappingCredit(aggregation, mapping);
  }
  return aggregation;
}
