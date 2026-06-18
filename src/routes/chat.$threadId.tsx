import { createFileRoute, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ChatView } from "@/components/ChatView";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat · EduBridge AI" },
      {
        name: "description",
        content:
          "Talk to EduBridge AI about GPA conversions, AP vs IB, credits and surviving a new school system.",
      },
    ],
  }),
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = useParams({ from: "/chat/$threadId" });
  return (
    <AppShell title="Chat" showThreads activeThreadId={threadId}>
      <ChatView key={threadId} threadId={threadId} />
    </AppShell>
  );
}
