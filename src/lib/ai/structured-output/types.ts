import type { StructuredCourseMappingOutput } from "@/lib/mapping/types";

export type StructuredOutputProviderName = "openai" | "gemini" | "mock";

export type StructuredCourseMappingInput = {
  course: {
    original_course_name: string;
    translated_course_name?: string | null;
    original_language_code?: string | null;
    grade_original?: string | null;
  };
  source: {
    country?: string | null;
    curriculum?: string | null;
    jurisdiction?: string | null;
    source_course_labels: string[];
  };
  destination: {
    state?: string | null;
    framework?: string | null;
    requirements: Array<{
      id?: string;
      subject_category?: string | null;
      credits_required?: number | null;
      specific_courses?: string[] | null;
      notes?: string | null;
      requirement_kind?: string | null;
    }>;
  };
  mapping_rules: Array<Record<string, unknown>>;
};

export type StructuredOutputResult = {
  provider: StructuredOutputProviderName;
  model: string;
  output: StructuredCourseMappingOutput;
  rawResponse?: unknown;
};

export interface StructuredOutputProvider {
  name: StructuredOutputProviderName;
  isConfigured(): boolean;
  mapCourse(input: StructuredCourseMappingInput): Promise<StructuredOutputResult>;
}
