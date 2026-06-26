import { buildEvidenceSummary } from "@/lib/mapping/mapping-explanations";
import {
  computeMappingConfidence,
  requiresCounselorReview,
} from "@/lib/mapping/mapping-confidence";
import {
  classifySubjectDeterministically,
  normalizeCourseName,
  normalizeSubjectCategory,
} from "@/lib/mapping/subject-taxonomy";
import type {
  CourseMappingCandidate,
  MappingContext,
  SubjectCategory,
  TranscriptCourseForMapping,
} from "@/lib/mapping/types";

function textArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function findRequirementByCategory(
  requirements: Array<Record<string, unknown>>,
  category: SubjectCategory,
) {
  if (category === "unclear") return null;
  return (
    requirements.find((requirement) => requirement.subject_category === category) ??
    requirements.find((requirement) =>
      normalizeCourseName(String(requirement.subject_category ?? "")).includes(
        normalizeCourseName(category.replaceAll("_", " ")),
      ),
    ) ??
    null
  );
}

function findVerifiedRule(context: MappingContext, category: SubjectCategory) {
  return context.mappingRules.find(
    (rule) =>
      ["partial", "verified", "official"].includes(String(rule.coverage_status)) &&
      (normalizeSubjectCategory(String(rule.source_subject_category ?? "")) === category ||
        normalizeSubjectCategory(String(rule.target_subject_category ?? "")) === category),
  );
}

function findExactSourceCourse(context: MappingContext, course: TranscriptCourseForMapping) {
  const name = normalizeCourseName(course.course_name_translated || course.course_name_original);
  if (!name) return null;
  return (
    context.sourceCurriculumCourses.find((row) => {
      const local = normalizeCourseName(String(row.course_name_local ?? ""));
      const english = normalizeCourseName(String(row.course_name_english ?? ""));
      return local === name || english === name;
    }) ?? null
  );
}

export function mapCourseDeterministically(
  context: MappingContext,
  course: TranscriptCourseForMapping,
): CourseMappingCandidate {
  const exactSource = findExactSourceCourse(context, course);
  const classified = classifySubjectDeterministically({
    original: course.course_name_original,
    translated: course.course_name_translated,
    providedCategory: course.subject_category ?? String(exactSource?.subject_category ?? ""),
  });
  const category = classified.category;
  const verifiedRule = findVerifiedRule(context, category);
  const requirement = findRequirementByCategory(context.destinationRequirements, category);
  const method = verifiedRule
    ? "verified_rule"
    : exactSource && requirement
      ? "exact_reference_match"
      : "deterministic_taxonomy";
  const requirementText = [
    requirement?.subject_category,
    textArray(requirement?.specific_courses).join(" "),
    requirement?.notes,
  ].join(" ");
  const destinationFrameworkStatus = String(
    context.destinationFramework?.coverage_status ??
      context.destinationFramework?.detail_coverage_status ??
      "partial",
  );
  const confidence = computeMappingConfidence({
    method,
    category,
    hasDestinationRequirement: Boolean(requirement),
    destinationFrameworkStatus,
    sourceFrameworkComplete: Boolean(context.sourceCurriculumId && exactSource),
    requirementText,
    deterministicConfidence: classified.confidence,
  });
  const warnings: string[] = [];
  if (!context.destinationFrameworkId) warnings.push("Destination framework still being verified.");
  if (!context.sourceCurriculumId)
    warnings.push("Source curriculum is missing; counselor review required.");
  if (!requirement) warnings.push("No destination requirement bucket was found.");
  if (category === "social_studies")
    warnings.push(
      "Do not treat this as U.S. History, Government, or state civics without counselor review.",
    );
  if (category === "world_language")
    warnings.push("World language credit may depend on local placement policy.");
  if (category === "physical_education" || category === "health")
    warnings.push("Health/PE transfer credit is often locally evaluated.");
  const counselorReview = requiresCounselorReview({
    confidence,
    requirementText,
    sourceFrameworkComplete: Boolean(context.sourceCurriculumId && exactSource),
    destinationFrameworkStatus,
    creditsMissing: !course.credits && !course.credits_or_units,
    category,
  });
  const probableEquivalent =
    verifiedRule?.probable_equivalent ??
    textArray(requirement?.specific_courses)[0] ??
    (category === "unclear" ? "Unclear course credit" : `${category.replaceAll("_", " ")} credit`);
  return {
    transcript_course_id: course.id,
    student_profile_id: String(context.profile.id),
    transcript_id: course.transcript_id,
    user_id: context.userId,
    source_country_id: context.sourceCountryId,
    source_jurisdiction_id: context.sourceJurisdictionId,
    source_curriculum_id: context.sourceCurriculumId,
    destination_country_id: context.destinationCountryId,
    destination_jurisdiction_id: context.destinationJurisdictionId,
    destination_framework_id: context.destinationFrameworkId,
    destination_requirement_id: typeof requirement?.id === "string" ? requirement.id : null,
    original_course_name: course.course_name_original,
    translated_course_name: course.course_name_translated ?? null,
    normalized_course_name: normalizeCourseName(
      course.course_name_translated || course.course_name_original,
    ),
    source_subject_category: category,
    mapped_subject_category: normalizeSubjectCategory(
      String(verifiedRule?.target_subject_category ?? category),
    ),
    probable_destination_equivalent: String(probableEquivalent),
    requirement_bucket: requirement ? String(requirement.subject_category ?? category) : null,
    possible_credit_value: numberOrNull(requirement?.credits_required) ?? course.credits ?? null,
    credit_unit: String(context.destinationFramework?.credit_unit_name ?? "unknown")
      .toLowerCase()
      .includes("carnegie")
      ? "carnegie_unit"
      : "unknown",
    mapping_confidence: confidence,
    mapping_method: method,
    mapping_status: counselorReview ? "counselor_review_required" : "candidate",
    counselor_review_required: counselorReview,
    review_reason: counselorReview
      ? (warnings[0] ?? "Counselor review required before use.")
      : null,
    evidence_summary: buildEvidenceSummary({
      method,
      original: course.course_name_original,
      translated: course.course_name_translated,
      category,
      requirement,
      warnings,
    }),
    source_evidence_json: {
      rule_id: verifiedRule?.id ?? null,
      source_course_id: exactSource?.id ?? null,
      requirement_id: requirement?.id ?? null,
      warnings,
    },
  };
}
