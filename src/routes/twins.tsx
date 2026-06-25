import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  LockKeyhole,
  MessageCircleQuestion,
  Send,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PassportShell, StatusPill } from "@/components/PassportShell";
import {
  getPendingTwinQuestions,
  getTwinMentors,
  submitTwinQuestion,
  type TwinMentor,
} from "@/lib/scholaport-api";

const prompts = [
  "What do you wish you asked your counselor?",
  "How did you adjust after transferring?",
  "Which credit decision surprised you most?",
];

export const Route = createFileRoute("/twins")({
  head: () => ({ meta: [{ title: "Twin Connect · Scholaport" }] }),
  component: TwinConnect,
});

function TwinConnect() {
  const queryClient = useQueryClient();
  const mentorsQuery = useQuery({ queryKey: ["twin-mentors"], queryFn: getTwinMentors });
  const pendingQuery = useQuery({
    queryKey: ["pending-twin-questions"],
    queryFn: getPendingTwinQuestions,
  });
  const [question, setQuestion] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(prompts[0]);
  const [anonymous, setAnonymous] = useState(true);
  const submitMutation = useMutation({
    mutationFn: submitTwinQuestion,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["pending-twin-questions"] }),
  });

  const submit = async () => {
    if (!question.trim()) return;
    try {
      await submitMutation.mutateAsync({ questionText: question, selectedPrompt, anonymous });
      toast.success("Question saved and submitted for moderation.");
      setQuestion("");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to submit your question.");
    }
  };

  const mentors = mentorsQuery.data ?? [];
  const pending = pendingQuery.data ?? [];

  return (
    <PassportShell
      eyebrow="Safe, moderated peer guidance"
      title="Ask someone who has lived it."
      description="Send a guided question to a verified mentor. Questions are stored with your account and remain pending until moderation."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9AA3B2]">
                Available mentors
              </p>
              <h2 className="mt-1.5 font-display text-xl font-bold">Verified profiles</h2>
            </div>
            <StatusPill tone="teal">{mentors.length} available</StatusPill>
          </div>
          <div className="mt-6 space-y-3">
            {mentorsQuery.isLoading && (
              <p className="rounded-xl bg-[#F6F8FB] p-4 text-sm text-[#5A6380]">Loading mentors…</p>
            )}
            {mentorsQuery.error && (
              <p className="rounded-xl bg-[#F86746]/10 p-4 text-sm text-[#E65234]">
                {mentorsQuery.error instanceof Error
                  ? mentorsQuery.error.message
                  : "Unable to load mentors."}
              </p>
            )}
            {!mentorsQuery.isLoading && !mentorsQuery.error && mentors.length === 0 && (
              <p className="rounded-xl bg-[#F6F8FB] p-4 text-sm leading-6 text-[#5A6380]">
                No verified mentors are currently available.
              </p>
            )}
            {mentors.map((mentor) => (
              <Mentor key={mentor.id} mentor={mentor} />
            ))}
          </div>
        </section>

        <aside className="rounded-[24px] bg-[#0A175A] p-5 text-white shadow-[0_14px_34px_rgba(10,23,90,.16)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#01C3AD] text-[#060F3D]">
              <MessageCircleQuestion className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">Ask the mentor pool</p>
              <p className="text-[10px] text-white/45">Stored before moderation</p>
            </div>
          </div>
          <label className="mt-6 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
            Choose a prompt
          </label>
          <select
            value={selectedPrompt}
            onChange={(event) => setSelectedPrompt(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 text-sm outline-none"
          >
            {prompts.map((prompt) => (
              <option key={prompt} className="text-[#0A175A]">
                {prompt}
              </option>
            ))}
          </select>
          <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
            Your question
          </label>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="mt-2 min-h-32 w-full resize-none rounded-xl border border-white/10 bg-white/[0.07] p-3 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-[#01C3AD]"
            placeholder="Keep it about the academic transfer experience—never share phone numbers, addresses, or school IDs."
          />
          <button
            onClick={() => setAnonymous(!anonymous)}
            className="mt-3 flex items-center gap-2 text-xs text-white/65"
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded-md border ${anonymous ? "border-[#01C3AD] bg-[#01C3AD] text-[#060F3D]" : "border-white/25"}`}
            >
              {anonymous && <CheckCircle2 className="h-3.5 w-3.5" />}
            </span>
            Post anonymously
          </button>
          <button
            onClick={() => void submit()}
            disabled={!question.trim() || submitMutation.isPending}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#01C3AD] text-sm font-bold text-[#060F3D] disabled:opacity-40"
          >
            {submitMutation.isPending ? "Submitting…" : "Submit safely"}{" "}
            <Send className="h-4 w-4" />
          </button>
          <p className="mt-4 flex items-start gap-2 text-[10px] leading-4 text-white/40">
            <LockKeyhole className="mt-0.5 h-3 w-3 shrink-0" /> A moderator must approve a response
            before it appears.
          </p>
        </aside>
      </div>

      <section className="mt-5 rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9AA3B2]">
              Your submissions
            </p>
            <h2 className="mt-1.5 font-display text-xl font-bold">Pending moderation</h2>
          </div>
          <StatusPill tone="gray">{pending.length}</StatusPill>
        </div>
        <div className="mt-4 space-y-2">
          {pendingQuery.isLoading && <p className="text-sm text-[#5A6380]">Loading questions…</p>}
          {!pendingQuery.isLoading && pending.length === 0 && (
            <p className="rounded-xl bg-[#F6F8FB] p-4 text-sm text-[#5A6380]">
              You have no questions pending moderation.
            </p>
          )}
          {pending.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#E8EBF0] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{item.question_text}</p>
                <StatusPill tone="coral">Pending moderation</StatusPill>
              </div>
              <p className="mt-2 text-[10px] text-[#9AA3B2]">
                Submitted {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <Safety
          icon={<UserCheck />}
          title="Verified mentors"
          body="Only verified, available mentor records are shown."
        />
        <Safety
          icon={<ShieldCheck />}
          title="Moderated answers"
          body="No open DMs or unsupervised contact in the MVP."
        />
        <Safety
          icon={<UsersRound />}
          title="Student-owned history"
          body="Your submitted questions are isolated by Row Level Security."
        />
      </section>
    </PassportShell>
  );
}

function Mentor({ mentor }: { mentor: TwinMentor }) {
  const initials = mentor.display_name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="group flex w-full items-center gap-4 rounded-2xl border border-[#E8EBF0] p-4 text-left transition hover:border-[#01C3AD]/50 hover:bg-[#01C3AD]/[0.03]">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0A175A] text-sm font-black text-white">
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold">{mentor.display_name}</span>
          <StatusPill tone="teal">Verified</StatusPill>
        </span>
        <span className="mt-0.5 block text-xs text-[#5A6380]">
          {mentor.source_curriculum} · {mentor.origin_country} → {mentor.target_state}
        </span>
        <span className="mt-2 flex flex-wrap gap-1">
          {mentor.topics_of_expertise.map((topic) => (
            <i
              key={topic}
              className="rounded-full bg-[#F6F8FB] px-2 py-0.5 text-[9px] font-semibold not-italic text-[#5A6380]"
            >
              {topic}
            </i>
          ))}
        </span>
        <span className="mt-2 flex items-center gap-1 text-[9px] text-[#9AA3B2]">
          <Clock3 className="h-3 w-3" /> Async moderated responses
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-[#CDD3DE]" />
    </div>
  );
}

function Safety({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-[18px] border border-[#CDD3DE]/70 bg-white p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#01C3AD]/10 text-[#019A8A] [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold">{title}</p>
        <p className="mt-1 text-[10px] leading-4 text-[#5A6380]">{body}</p>
      </div>
    </div>
  );
}
