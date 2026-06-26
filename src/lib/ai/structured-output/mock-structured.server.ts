import {
  classifySubjectDeterministically,
  normalizeCourseName,
} from "@/lib/mapping/subject-taxonomy";
import type {
  StructuredCourseMappingInput,
  StructuredOutputProvider,
  StructuredOutputResult,
} from "@/lib/ai/structured-output/types";

export class MockStructuredOutputProvider implements StructuredOutputProvider {
  name = "mock" as const;

  isConfigured() {
    return true;
  }

  async mapCourse(input: StructuredCourseMappingInput): Promise<StructuredOutputResult> {
    const classified = classifySubjectDeterministically({
      original: input.course.original_course_name,
      translated: input.course.translated_course_name,
    });
    return {
      provider: "mock",
      model: "mock-structured",
      output: {
        original_course_name: input.course.original_course_name,
        translated_course_name: input.course.translated_course_name ?? null,
        normalized_course_name: normalizeCourseName(
          input.course.translated_course_name || input.course.original_course_name,
        ),
        source_subject_category: classified.category,
        mapped_subject_category: classified.category,
        probable_destination_equivalent:
          classified.category === "unclear"
            ? "Unclear course credit"
            : `${classified.category.replaceAll("_", " ")} credit`,
        requirement_bucket: classified.category === "unclear" ? null : classified.category,
        possible_credit_value: null,
        credit_unit: "unknown",
        confidence: classified.category === "unclear" ? "unclear" : "low",
        counselor_review_required: true,
        review_reason: "Mock structured provider is for tests/local fallback only.",
        evidence_summary: "Mock provider produced a non-official mapping candidate.",
        warnings: ["Mock provider output must not be used as an official decision."],
      },
    };
  }
}
