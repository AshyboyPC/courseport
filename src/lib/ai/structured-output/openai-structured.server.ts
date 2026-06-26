import { structuredCourseMappingOutputSchema } from "@/lib/mapping/mapping-validators";
import type {
  StructuredCourseMappingInput,
  StructuredOutputProvider,
  StructuredOutputResult,
} from "@/lib/ai/structured-output/types";

const schema = {
  name: "course_credit_mapping",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "original_course_name",
      "translated_course_name",
      "normalized_course_name",
      "source_subject_category",
      "mapped_subject_category",
      "probable_destination_equivalent",
      "requirement_bucket",
      "possible_credit_value",
      "credit_unit",
      "confidence",
      "counselor_review_required",
      "review_reason",
      "evidence_summary",
      "warnings",
    ],
    properties: {
      original_course_name: { type: "string" },
      translated_course_name: { type: ["string", "null"] },
      normalized_course_name: { type: "string" },
      source_subject_category: { type: "string" },
      mapped_subject_category: { type: "string" },
      probable_destination_equivalent: { type: "string" },
      requirement_bucket: { type: ["string", "null"] },
      possible_credit_value: { type: ["number", "null"] },
      credit_unit: { type: "string" },
      confidence: { type: "string" },
      counselor_review_required: { type: "boolean" },
      review_reason: { type: ["string", "null"] },
      evidence_summary: { type: "string" },
      warnings: { type: "array", items: { type: "string" } },
    },
  },
  strict: true,
};

function prompt(input: StructuredCourseMappingInput) {
  return `Map one confirmed international transcript course into a probable U.S. destination credit category.

Return only JSON matching the schema. Do not invent official credit decisions. If unsure, set confidence to low or unclear. If a course could satisfy a broad category but not a named course requirement, say so. If a course probably maps to elective credit only, say so. If a U.S.-specific requirement like U.S. History, Georgia Studies, Government, Economics, Health, PE, or state testing cannot be satisfied by the foreign course, do not mark it satisfied. If local counselor evaluation is required, set counselor_review_required = true. Never mark an international course as satisfying a state-specific civics/history/government requirement unless the source clearly supports that exact content. Do not convert marks to GPA.

Input:
${JSON.stringify(input, null, 2)}`;
}

export class OpenAiStructuredOutputProvider implements StructuredOutputProvider {
  name = "openai" as const;

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async mapCourse(input: StructuredCourseMappingInput): Promise<StructuredOutputResult> {
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "You are a cautious academic credit-mapping classifier. You create probable counselor-ready mappings, never official decisions.",
          },
          { role: "user", content: prompt(input) },
        ],
        text: { format: { type: "json_schema", ...schema } },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI structured mapping failed: ${response.status}`);
    const raw = await response.json();
    const text =
      raw.output_text ??
      raw.output
        ?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? [])
        ?.map((item: { text?: string }) => item.text)
        ?.join("");
    const output = structuredCourseMappingOutputSchema.parse(JSON.parse(text));
    return { provider: "openai", model, output, rawResponse: raw };
  }
}
