import { createFileRoute, redirect } from "@tanstack/react-router";
import { ensureInitialThread } from "@/lib/threads";

export const Route = createFileRoute("/chat")({
  component: ChatRedirect,
});

function ChatRedirect() {
  if (typeof window === "undefined") return null;
  const t = ensureInitialThread();
  throw redirect({ to: "/chat/$threadId", params: { threadId: t.id } });
}
