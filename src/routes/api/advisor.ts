import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider, DEFAULT_CHAT_MODEL } from "@/lib/ai-gateway.server";

type AdvisorContext = {
  originCountry?: string;
  sourceCurriculum?: string;
  targetState?: string;
  gradeAtTransfer?: number;
};

const system = `You are Scholaport, an academic advisor for international high-school transfer students. Be encouraging, specific, culturally sensitive, concise, and always state that the receiving school counselor makes final credit decisions. Never invent transcript courses, mapped credits, requirements, or school decisions that were not supplied in the request context.`;

function ruleBasedAnswer(message: string, context: AdvisorContext) {
  const lower = message.toLowerCase();
  const route = [context.sourceCurriculum, context.originCountry, context.targetState]
    .filter(Boolean)
    .join(" → ");
  if (lower.includes("history") || lower.includes("online"))
    return `Scholaport does not have an official course decision for your ${route || "transfer"} route. Ask your counselor which state-specific history courses remain and whether your school accepts an approved online or summer option.`;
  if (lower.includes("counselor") || lower.includes("meeting"))
    return "Bring your original transcript, translation, course syllabi, and a written list of questions. Ask which credits are confirmed, which remain under review, and which graduation requirements are still outstanding. Record each official decision in your Scholaport passport.";
  if (lower.includes("science") || lower.includes("lab"))
    return "A receiving school may review course content, instructional time, and evidence of practical laboratory work before awarding lab-science credit. Bring the syllabus or laboratory record; Scholaport cannot mark that credit as official without the school’s decision.";
  if (lower.includes("gpa") || lower.includes("weighted"))
    return "An unweighted GPA commonly uses a 4.0 scale, while a weighted GPA may add points for advanced classes. The receiving school decides whether and how international grades enter GPA or class-rank calculations.";
  return `For your ${route || "international transfer"} route, the safest next step is to confirm unreviewed course and graduation-requirement decisions with the receiving school counselor. Scholaport stores your records but does not make official credit decisions.`;
}

export const Route = createFileRoute("/api/advisor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { message, context = {} } = (await request.json()) as {
          message?: string;
          context?: AdvisorContext;
        };
        if (!message?.trim())
          return Response.json({ error: "Message is required" }, { status: 400 });
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json({
            answer: ruleBasedAnswer(message, context),
            confidence: "medium",
            sources: ["Student profile"],
            mode: "rule_based",
          });
        }
        try {
          const gateway = createLovableAiGatewayProvider(apiKey);
          const result = await generateText({
            model: gateway(DEFAULT_CHAT_MODEL),
            system,
            prompt: `Student context: ${JSON.stringify(context)}\n\nQuestion: ${message}`,
          });
          return Response.json({
            answer: result.text,
            confidence: "medium",
            sources: ["Student profile"],
            mode: "configured_provider",
          });
        } catch {
          return Response.json({
            answer: ruleBasedAnswer(message, context),
            confidence: "medium",
            sources: ["Student profile"],
            mode: "rule_based",
          });
        }
      },
    },
  },
});
