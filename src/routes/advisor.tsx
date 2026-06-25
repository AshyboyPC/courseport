import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, CheckCircle2, Globe2, Languages, Send, ShieldCheck, UserRound } from "lucide-react";
import { PassportShell, StatusPill } from "@/components/PassportShell";
import { advisorStarters } from "@/lib/scholaport-data";
import { getAdvisorMessages, saveAdvisorMessage } from "@/lib/scholaport-api";
import { useAuth } from "@/components/AuthProvider";

type Message = { id: string; role: "user" | "assistant"; content: string; sources?: string[] };

export const Route = createFileRoute("/advisor")({
  head: () => ({
    meta: [
      { title: "AI Academic Advisor · Scholaport" },
      {
        name: "description",
        content:
          "Ask context-aware questions about your transcript, graduation requirements, and next steps.",
      },
    ],
  }),
  component: AdvisorPage,
});

function AdvisorPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const historyQuery = useQuery({ queryKey: ["advisor-messages"], queryFn: getAdvisorMessages });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!historyQuery.data) return;
    setMessages(
      historyQuery.data
        .filter((item) => item.role !== "system")
        .map((item) => ({
          id: item.id,
          role: item.role as "user" | "assistant",
          content: item.content,
          sources: item.sources,
        })),
    );
  }, [historyQuery.data]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  const ask = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    setInput("");
    setLoading(true);
    try {
      const savedUser = await saveAdvisorMessage({ role: "user", content: question });
      setMessages((current) => [...current, { id: savedUser.id, role: "user", content: question }]);
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          context: profile
            ? {
                originCountry: profile.origin_country,
                sourceCurriculum: profile.source_curriculum,
                targetState: profile.target_state,
                gradeAtTransfer: profile.grade_at_transfer,
              }
            : {},
        }),
      });
      if (!response.ok) throw new Error("Advisor service returned an error.");
      const data = (await response.json()) as { answer: string; sources?: string[] };
      const savedAssistant = await saveAdvisorMessage({
        role: "assistant",
        content: data.answer,
        sources: data.sources ?? [],
        confidence: "medium",
        modelUsed: "rule_based_or_configured_provider",
      });
      setMessages((current) => [
        ...current,
        { id: savedAssistant.id, role: "assistant", content: data.answer, sources: data.sources },
      ]);
      void queryClient.invalidateQueries({ queryKey: ["advisor-messages"] });
    } catch (cause) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            cause instanceof Error
              ? cause.message
              : "The advisor could not save this conversation.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PassportShell
      eyebrow="24/7 multilingual advisor"
      title="Ask with your full passport in context."
      description="Get grounded guidance based on your courses, target state, and roadmap—not a generic chatbot answer."
    >
      <div className="grid min-h-[690px] gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden space-y-5 xl:block">
          <section className="rounded-[24px] bg-[#0A175A] p-5 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#01C3AD] text-[#060F3D]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">Passport connected</p>
                <p className="mt-0.5 text-[10px] text-white/45">Authenticated student profile</p>
              </div>
            </div>
            <div className="mt-5 space-y-2.5 text-xs text-white/65">
              <Context
                label={`${profile?.source_curriculum ?? "Curriculum"} · ${profile?.origin_country ?? "Origin"}`}
              />
              <Context label={profile?.target_state ?? "Target state"} />
              <Context label="Persisted conversation history" />
            </div>
          </section>
          <section className="rounded-[20px] border border-[#CDD3DE]/70 bg-white p-5">
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-[#019A8A]" />
              <div>
                <p className="text-sm font-bold">Answer language</p>
                <p className="text-xs text-[#5A6380]">{profile?.preferred_language ?? "en"}</p>
              </div>
            </div>
            <button className="mt-4 h-10 w-full rounded-xl bg-[#F6F8FB] text-xs font-bold">
              Change language
            </button>
          </section>
          <p className="px-2 text-[10px] leading-4 text-[#9AA3B2]">
            Scholaport provides educational guidance, not official credential evaluation. Your
            school decides final credit.
          </p>
        </aside>

        <section className="flex min-h-[690px] flex-col overflow-hidden rounded-[24px] border border-[#CDD3DE]/70 bg-white shadow-card">
          <header className="flex items-center gap-3 border-b border-[#E8EBF0] px-4 py-4 sm:px-5">
            <span className="relative grid h-11 w-11 place-items-center rounded-[14px] bg-[#0A175A] text-white">
              <Bot className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#01C3AD]" />
            </span>
            <div>
              <p className="text-sm font-bold">Scholaport Advisor</p>
              <p className="text-[11px] text-[#5A6380]">Grounded in your academic passport</p>
            </div>
            <StatusPill tone="teal">Online</StatusPill>
            <Globe2 className="ml-auto h-4 w-4 text-[#9AA3B2]" />
          </header>
          <div className="flex-1 overflow-y-auto bg-[#F9FAFC] px-4 py-5 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-5">
              {historyQuery.isLoading && (
                <p className="text-sm text-[#5A6380]">Loading conversation…</p>
              )}
              {messages.length === 0 && !historyQuery.isLoading && (
                <ChatBubble
                  message={{
                    id: "welcome",
                    role: "assistant",
                    content: `Hi ${profile?.first_name ?? "there"}. Your advisor conversation is connected to your Scholaport account. What would make your transfer feel clearer today?`,
                    sources: ["Student profile"],
                  }}
                />
              )}
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {loading && (
                <div className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0A175A] text-white">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="rounded-2xl rounded-tl-sm border border-[#E8EBF0] bg-white px-4 py-3 shadow-soft">
                    <span className="flex gap-1">
                      <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#01C3AD]" />
                      <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#01C3AD] [animation-delay:120ms]" />
                      <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#01C3AD] [animation-delay:240ms]" />
                    </span>
                  </div>
                </div>
              )}
              {messages.length === 0 && !historyQuery.isLoading && (
                <div className="grid gap-2 pt-2 sm:grid-cols-2">
                  {advisorStarters.map((starter) => (
                    <button
                      key={starter}
                      onClick={() => void ask(starter)}
                      className="rounded-2xl border border-[#CDD3DE]/70 bg-white p-3.5 text-left text-xs font-semibold leading-5 transition hover:border-[#01C3AD] hover:bg-[#01C3AD]/[0.04]"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
            className="border-t border-[#E8EBF0] bg-white p-3 sm:p-4"
          >
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[#CDD3DE] bg-[#F6F8FB] p-2 transition focus-within:border-[#01C3AD] focus-within:ring-4 focus-within:ring-[#01C3AD]/10">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    ask(input);
                  }
                }}
                rows={1}
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
                placeholder="Ask about credits, GPA, your counselor meeting…"
              />
              <button
                disabled={!input.trim() || loading}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#01C3AD] text-[#060F3D] transition disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[9px] text-[#9AA3B2]">
              Scholaport may be uncertain. Confirm official decisions with your school counselor.
            </p>
          </form>
        </section>
      </div>
    </PassportShell>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const user = message.role === "user";
  return (
    <div className={`flex gap-3 ${user ? "justify-end" : ""}`}>
      {!user && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0A175A] text-white">
          <Bot className="h-4 w-4" />
        </span>
      )}
      <div
        className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 ${user ? "rounded-tr-sm bg-[#0A175A] text-white" : "rounded-tl-sm border border-[#E8EBF0] bg-white text-[#0A175A] shadow-soft"}`}
      >
        <p>{message.content}</p>
        {message.sources && !user && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#E8EBF0] pt-2">
            {message.sources.map((source) => (
              <span
                key={source}
                className="inline-flex items-center gap-1 rounded-full bg-[#01C3AD]/10 px-2 py-0.5 text-[9px] font-bold text-[#019A8A]"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                {source}
              </span>
            ))}
          </div>
        )}
      </div>
      {user && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#01C3AD] text-[#060F3D]">
          <UserRound className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}

function Context({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-3.5 w-3.5 text-[#01C3AD]" />
      {label}
    </div>
  );
}
