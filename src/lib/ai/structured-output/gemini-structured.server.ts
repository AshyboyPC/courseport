import { structuredCourseMappingOutputSchema } from "@/lib/mapping/mapping-validators";
import type {
  StructuredCourseMappingInput,
  StructuredOutputProvider,
  StructuredOutputResult,
} from "@/lib/ai/structured-output/types";

function prompt(input: StructuredCourseMappingInput) {
  return `Return only valid JSON for the Scholaport course mapping schema.
Rules: probable mapping only, no official credit decisions, no GPA conversion, low/unclear when unsure, counselor review for local/state-specific requirements.
Input: ${JSON.stringify(input)}`;
}

export class GeminiStructuredOutputProvider implements StructuredOutputProvider {
  name = "gemini" as const;

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async mapCourse(input: StructuredCourseMappingInput): Promise<StructuredOutputResult> {
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt(input) }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );
    if (!response.ok) throw new Error(`Gemini structured mapping failed: ${response.status}`);
    const raw = await response.json();
    const text = raw.candidates?.[0]?.content?.parts?.[0]?.text;
    const output = structuredCourseMappingOutputSchema.parse(JSON.parse(text));
    return { provider: "gemini", model, output, rawResponse: raw };
  }
}
