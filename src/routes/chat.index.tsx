import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ensureInitialThread } from "@/lib/threads";

export const Route = createFileRoute("/chat")({
  component: ChatRedirect,
});

function ChatRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = ensureInitialThread();
    navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
  }, [navigate]);
  return (
    <div className="flex h-dvh items-center justify-center bg-background text-muted-foreground">
      Loading…
    </div>
  );
}
