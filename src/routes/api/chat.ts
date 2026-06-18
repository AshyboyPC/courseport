import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayProvider,
  DEFAULT_CHAT_MODEL,
} from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are EduBridge AI — an empathetic, knowledgeable academic advisor helping international high-school students survive and thrive after transferring to a new country.

Your tone is encouraging, clear and modern — never corporate or clinical. When asked about class workloads, grading scales (GPA weighted vs unweighted, AP vs IB vs Honors), credit transfers, cultural differences, peer dynamics or stress, respond with actionable bullet points, short paragraphs, and concrete next steps. Use markdown for structure (headings, lists, bold) but keep answers tight. If the student shares a transcript summary or gap-analysis result earlier in the thread, refer back to it specifically.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const { messages }: { messages: UIMessage[] } = await request.json();

        const gateway = createLovableAiGatewayProvider(apiKey);

        const result = streamText({
          model: gateway(DEFAULT_CHAT_MODEL),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          onError: (error) => {
            console.error("chat stream error", error);
            const err = error as { statusCode?: number; message?: string };
            if (err?.statusCode === 429)
              return "Rate limit hit — please wait a moment and try again.";
            if (err?.statusCode === 402)
              return "AI credits exhausted on this workspace.";
            return "Something went wrong generating a reply.";
          },
        });
      },
    },
  },
});
