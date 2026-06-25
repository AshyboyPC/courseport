import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, DEFAULT_CHAT_MODEL } from "./ai-gateway.server";

// ---------- Transcript conversion ----------

const TranscriptInput = z.object({
  imageDataUrl: z.string().optional(),
  rawText: z.string().optional(),
  targetSystem: z.string().default("US 4.0 GPA"),
});

const CourseSchema = z.object({
  course: z.string(),
  year: z.string(),
  originalGrade: z.string(),
  convertedGrade: z.string(),
  creditsLikely: z.string(),
});

const TranscriptOutput = z.object({
  country: z.string(),
  originalScale: z.string(),
  convertedGpa: z.string(),
  summary: z.string(),
  courses: z.array(CourseSchema),
});

export const convertTranscript = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => TranscriptInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    if (!data.imageDataUrl && !data.rawText)
      throw new Error("Provide a transcript image or paste the transcript text.");

    const gateway = createLovableAiGatewayProvider(apiKey);

    const system = `You are an expert international academic credential evaluator.
Analyze the transcript provided.
1. Identify the country of origin and the grading scale used.
2. Extract all courses, the year/grade level taken, and the grade achieved.
3. Convert grades to the requested local scale: ${data.targetSystem}.
4. Estimate credit hours under the target system in "creditsLikely" (e.g. "1.0", "0.5").
5. Write a 2-3 sentence plain-language "summary" the student can read.
Be conservative — if the scale is ambiguous, say so in the summary.`;

    const userContent: Array<{ type: "text"; text: string } | { type: "image"; image: string }> =
      [];

    if (data.rawText) {
      userContent.push({
        type: "text",
        text: `Transcript text:\n\n${data.rawText}`,
      });
    }
    if (data.imageDataUrl) {
      userContent.push({
        type: "text",
        text: "Transcript image attached. Read every visible course and grade.",
      });
      userContent.push({ type: "image", image: data.imageDataUrl });
    }

    const { output } = await generateText({
      model: gateway(DEFAULT_CHAT_MODEL),
      system,
      messages: [{ role: "user", content: userContent }],
      experimental_output: Output.object({ schema: TranscriptOutput }),
    });

    return output;
  });

// ---------- Gap analysis ----------

const GapInput = z.object({
  previousCurriculum: z.string().min(1),
  previousCourses: z.string().min(1),
  targetCurriculum: z.string().min(1),
  gradeLevel: z.string().default("Grade 10"),
});

const GapOutput = z.object({
  creditsTransferred: z.array(z.string()),
  gapsIdentified: z.array(z.string()),
  acceleratedPlacement: z.array(z.string()),
  recommendedNextSteps: z.array(z.string()),
  summary: z.string(),
});

export const analyzeCurriculumGap = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => GapInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(apiKey);

    const { output } = await generateText({
      model: gateway(DEFAULT_CHAT_MODEL),
      system: `You are an academic placement specialist for international transfer students.
Compare the student's prior coursework against the target curriculum's graduation requirements and give a practical readout. Be specific to the named curricula (e.g. UK A-Levels vs US high school, CBSE vs Ontario, IB vs AP). Keep each bullet to one sentence.`,
      prompt: `Previous curriculum: ${data.previousCurriculum}
Previous courses taken: ${data.previousCourses}
Target curriculum / district: ${data.targetCurriculum}
Current grade level entering: ${data.gradeLevel}

Produce a gap analysis.`,
      experimental_output: Output.object({ schema: GapOutput }),
    });

    return output;
  });
