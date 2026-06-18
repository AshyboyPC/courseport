import { createFileRoute, redirect } from "@tanstack/react-router";
import { ensureInitialThread } from "@/lib/threads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduBridge AI — Transfer student copilot" },
      {
        name: "description",
        content:
          "EduBridge AI helps international transfer students convert transcripts, find curriculum gaps, and adapt to a new school system.",
      },
      { property: "og:title", content: "EduBridge AI" },
      {
        property: "og:description",
        content:
          "Convert transcripts, spot curriculum gaps, and survive culture shock with an AI academic copilot.",
      },
    ],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  if (typeof window === "undefined") return null;
  const t = ensureInitialThread();
  throw redirect({ to: "/chat/$threadId", params: { threadId: t.id } });
}
