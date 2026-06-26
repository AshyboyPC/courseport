import { getStructuredOutputProvider } from "@/lib/ai/structured-output/structured-output-service.server";
import type { StructuredCourseMappingInput } from "@/lib/ai/structured-output/types";
import { normalizeCourseName } from "@/lib/mapping/subject-taxonomy";
import type {
  CourseMappingCandidate,
  MappingContext,
  TranscriptCourseForMapping,
} from "@/lib/mapping/types";

function labels(rows: Array<Record<string, unknown>>) {
  return rows
    .map((row) => String(row.course_name_english ?? row.course_name_local ?? row.name ?? ""))
    .filter(Boolean)
    .slice(0, 80);
}

export async function tryStructuredAiMapping(
  context: MappingContext,
  course: TranscriptCourseForMapping,
): Promise<Partial<CourseMappingCandidate> | null> {
  const provider = getStructuredOutputProvider({ allowMockFallback: false });
  if (!provider) return null;
  const input: StructuredCourseMappingInput = {
    course: {
      original_course_name: course.course_name_original,
      translated_course_name: course.course_name_translated ?? null,
      original_language_code: course.original_language_code ?? null,
      grade_original: course.grade_original ?? null,
    },
    source: {
      country: String(context.profile.origin_country ?? ""),
      curriculum: String(context.profile.source_curriculum ?? ""),
      jurisdiction: null,
      source_course_labels: labels(context.sourceCurriculumCourses),
    },
    destination: {
      state: String(
        context.profile.destination_jurisdiction_label ?? context.profile.target_state ?? "",
      ),
      framework: String(context.destinationFramework?.framework_name ?? ""),
      requirements: context.destinationRequirements.map((requirement) => ({
        id: String(requirement.id ?? ""),
        subject_category: String(requirement.subject_category ?? ""),
        credits_required:
          requirement.credits_required === null || requirement.credits_required === undefined
            ? null
            : Number(requirement.credits_required),
        specific_courses: Array.isArray(requirement.specific_courses)
          ? (requirement.specific_courses as string[])
          : [],
        notes: String(requirement.notes ?? ""),
        requirement_kind: String(
          requirement.requirement_kind ?? requirement.requirement_type ?? "",
        ),
      })),
    },
    mapping_rules: context.mappingRules.slice(0, 20),
  };
  const result = await provider.mapCourse(input);
  return {
    normalized_course_name:
      result.output.normalized_course_name ||
      normalizeCourseName(course.course_name_translated || course.course_name_original),
    source_subject_category: result.output.source_subject_category,
    mapped_subject_category: result.output.mapped_subject_category,
    probable_destination_equivalent: result.output.probable_destination_equivalent,
    requirement_bucket: result.output.requirement_bucket,
    possible_credit_value: result.output.possible_credit_value,
    credit_unit: result.output.credit_unit,
    mapping_confidence: result.output.confidence,
    mapping_method: "structured_ai",
    mapping_status: result.output.counselor_review_required
      ? "counselor_review_required"
      : "candidate",
    counselor_review_required: result.output.counselor_review_required,
    review_reason: result.output.review_reason,
    evidence_summary: result.output.evidence_summary,
    ai_model: `${result.provider}:${result.model}`,
    ai_response_json: result.output,
  };
}
