import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileText,
  ListChecks,
  Loader2,
  LockKeyhole,
  NotebookPen,
  Plus,
  RefreshCw,
  ShieldAlert,
  Square,
  XCircle,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PassportShell, StatusPill } from "@/components/PassportShell";
import {
  addManualRoadmapItem,
  generateAcademicRoadmap,
  getRoadmap,
  regenerateAcademicRoadmap,
  updateRoadmapItemStatus,
  type RoadmapItem,
} from "@/lib/scholaport-api";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Academic Roadmap · Scholaport" },
      {
        name: "description",
        content: "A saved planning preview generated from Scholaport gap analysis results.",
      },
    ],
  }),
  component: RoadmapPage,
});

type BlockedState = {
  title: string;
  body: string;
  action: string;
  to: "/transcript" | "/gaps" | "/profile" | "/onboarding";
};

function RoadmapPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["roadmap"], queryFn: getRoadmap });
  const [processing, setProcessing] = useState(false);

  const generateMutation = useMutation({
    mutationFn: (regenerate: boolean) => {
      const gapAnalysisId = query.data?.gapAnalysis?.id;
      const transcriptId = query.data?.transcript?.id;
      return regenerate
        ? regenerateAcademicRoadmap({ gapAnalysisId, transcriptId })
        : generateAcademicRoadmap({ gapAnalysisId, transcriptId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      await queryClient.invalidateQueries({ queryKey: ["passport-summary"] });
    },
  });

  async function runRoadmap(regenerate = false) {
    setProcessing(true);
    try {
      await generateMutation.mutateAsync(regenerate);
      toast.success(regenerate ? "Roadmap regenerated." : "Academic roadmap generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate roadmap.");
    } finally {
      setProcessing(false);
    }
  }

  const blocked = query.data ? getBlockedState(query.data) : null;

  return (
    <PassportShell
      eyebrow="Academic roadmap"
      title="A planning preview built from your saved gap analysis."
      description="Roadmap items are saved to your Scholaport account. Your school or counselor makes final scheduling and credit decisions."
    >
      {query.isLoading ? (
        <State text="Loading your saved roadmap…" />
      ) : query.error ? (
        <State
          text={query.error instanceof Error ? query.error.message : "Unable to load roadmap."}
          error
        />
      ) : blocked ? (
        <PrerequisiteState state={blocked} />
      ) : !query.data?.roadmap ? (
        <ActionState
          title="Generate academic roadmap"
          body="Your saved gap analysis is ready. Scholaport can convert those gap rows into a prioritized planning preview."
          button="Generate academic roadmap"
          processing={processing}
          onClick={() => void runRoadmap(false)}
        />
      ) : (
        <RoadmapDashboard
          data={query.data}
          processing={processing}
          onRegenerate={() => void runRoadmap(true)}
        />
      )}
    </PassportShell>
  );
}

function getBlockedState(data: Awaited<ReturnType<typeof getRoadmap>>): BlockedState | null {
  if (!data.profile) {
    return {
      title: "Complete onboarding first.",
      body: "Scholaport needs your destination framework and timeline before it can build a roadmap.",
      action: "Start onboarding",
      to: "/onboarding",
    };
  }
  if (!data.transcript) {
    return {
      title: "Upload and confirm your transcript first.",
      body: "The roadmap starts after transcript courses have been reviewed and confirmed.",
      action: "Go to transcript",
      to: "/transcript",
    };
  }
  if (data.transcript.confirmation_status !== "confirmed" || !data.transcriptCourses.length) {
    return {
      title: "Review and confirm your extracted courses first.",
      body: "OCR and translation rows are not used for planning until you confirm the course list.",
      action: "Review transcript",
      to: "/transcript",
    };
  }
  if (!data.creditMappings.length) {
    return {
      title: "Generate probable credit mapping first.",
      body: "The roadmap depends on saved credit-mapping rows, not transcript text alone.",
      action: "Open mapping review",
      to: "/transcript",
    };
  }
  if (!data.profile.destination_framework_id) {
    return {
      title: "Destination graduation framework is still being verified.",
      body: "Choose or verify a destination framework before generating a roadmap.",
      action: "Open profile",
      to: "/profile",
    };
  }
  if (!data.gapAnalysis) {
    return {
      title: "Run graduation gap analysis first.",
      body: "The roadmap is generated from saved gap analysis results and saved gap requirements.",
      action: "Open gap analysis",
      to: "/gaps",
    };
  }
  if (!data.gapRequirements.length) {
    return {
      title: "Requirements for this state are not ready yet.",
      body: "Scholaport did not find saved gap requirement rows for this analysis.",
      action: "Open gap analysis",
      to: "/gaps",
    };
  }
  return null;
}

function RoadmapDashboard({
  data,
  processing,
  onRegenerate,
}: {
  data: Awaited<ReturnType<typeof getRoadmap>>;
  processing: boolean;
  onRegenerate: () => void;
}) {
  const queryClient = useQueryClient();
  const [showManual, setShowManual] = useState(false);
  const roadmap = data.roadmap;
  const items = data.items;
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: "todo" | "in_progress" | "done" | "blocked" | "skipped" | "needs_counselor";
      note?: string | null;
    }) => updateRoadmapItemStatus(id, status, note),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      await queryClient.invalidateQueries({ queryKey: ["passport-summary"] });
    },
  });

  const grouped = useMemo(() => groupRoadmapItems(items), [items]);
  const completed = items.filter((item) => isDone(item)).length;
  const stale = roadmap?.status === "stale";
  const counselorQuestions = [
    ...(roadmap?.counselor_questions_json ?? []),
    ...items.map((item) => item.counselor_question ?? "").filter(Boolean),
  ].filter((value, index, array) => array.indexOf(value) === index);

  async function setStatus(
    item: RoadmapItem,
    status: "todo" | "in_progress" | "done" | "blocked" | "skipped" | "needs_counselor",
    note?: string | null,
  ) {
    try {
      await updateMutation.mutateAsync({ id: item.id, status, note });
      toast.success("Roadmap item updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update roadmap item.");
    }
  }

  return (
    <div className="space-y-5">
      {stale && (
        <section className="rounded-[18px] border border-[#F0A33A] bg-[#FFF8ED] p-4 text-sm leading-6 text-[#8A4D00]">
          This roadmap may be outdated because your transcript, credit map, gap analysis, or profile
          changed. Regenerate it before using it for planning.
          {roadmap?.stale_reason ? ` Reason: ${roadmap.stale_reason}.` : ""}
        </section>
      )}

      <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge risk={roadmap?.overall_risk_level ?? "gray"} />
              <StatusPill tone={roadmap?.timeline_urgency === "urgent" ? "coral" : "navy"}>
                {labelize(roadmap?.timeline_urgency ?? "unknown")} timeline
              </StatusPill>
              {roadmap?.status === "needs_review" && (
                <StatusPill tone="coral">Needs review</StatusPill>
              )}
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold">Academic roadmap preview</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5A6380]">
              {roadmap?.summary_text || "Review these planning items with your counselor."}
            </p>
            <p className="mt-2 text-xs text-[#5A6380]">
              {roadmap?.planning_horizon ?? "Timeline needs profile details"} · Last generated{" "}
              {roadmap?.generated_at ? new Date(roadmap.generated_at).toLocaleString() : "recently"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={processing}
              onClick={onRegenerate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#CDD3DE] bg-white px-4 text-xs font-bold text-[#0A175A] disabled:opacity-60"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerate
            </button>
            <button
              onClick={() => setShowManual((value) => !value)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#01C3AD] px-4 text-xs font-bold text-[#060F3D]"
            >
              <Plus className="h-4 w-4" />
              Add task
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="saved items" value={String(items.length)} />
          <Metric label="completed" value={String(completed)} />
          <Metric label="critical" value={String(roadmap?.critical_items ?? 0)} />
          <Metric label="counselor review" value={String(roadmap?.counselor_review_items ?? 0)} />
        </div>
      </section>

      {showManual && roadmap && <ManualItemForm roadmapId={roadmap.id} />}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <main className="space-y-4">
          <ItemGroup
            title="Immediate next steps"
            items={grouped.immediate}
            icon={<AlertTriangle />}
            onStatus={setStatus}
            pending={updateMutation.isPending}
          />
          <ItemGroup
            title="Before course registration"
            items={grouped.registration}
            icon={<ListChecks />}
            onStatus={setStatus}
            pending={updateMutation.isPending}
          />
          <ItemGroup
            title="Current or next semester"
            items={grouped.term}
            icon={<Clock3 />}
            onStatus={setStatus}
            pending={updateMutation.isPending}
          />
          <ItemGroup
            title="Summer or alternative options"
            items={grouped.alternates}
            icon={<ShieldAlert />}
            onStatus={setStatus}
            pending={updateMutation.isPending}
          />
          <ItemGroup
            title="Counselor review items"
            items={grouped.counselor}
            icon={<CircleHelp />}
            onStatus={setStatus}
            pending={updateMutation.isPending}
          />
          <ItemGroup
            title="Completed or lower priority"
            items={grouped.lower}
            icon={<CheckCircle2 />}
            onStatus={setStatus}
            pending={updateMutation.isPending}
          />
        </main>

        <aside className="space-y-5">
          <section className="rounded-[24px] bg-[#0A175A] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#01C3AD]">
              Counselor meeting checklist
            </p>
            <div className="mt-4 space-y-3">
              {counselorQuestions.length ? (
                counselorQuestions.slice(0, 10).map((question) => (
                  <p key={question} className="rounded-xl bg-white/[.07] p-3 text-xs leading-5">
                    {question}
                  </p>
                ))
              ) : (
                <p className="rounded-xl bg-white/[.07] p-3 text-xs leading-5">
                  No counselor-specific questions were saved for this roadmap.
                </p>
              )}
            </div>
          </section>
          <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5">
            <div className="flex gap-3">
              <LockKeyhole className="h-5 w-5 shrink-0 text-[#0A175A]" />
              <div>
                <p className="text-sm font-bold">Planning preview only</p>
                <p className="mt-1 text-xs leading-5 text-[#5A6380]">
                  Marking tasks complete tracks your work in Scholaport. It does not approve school
                  credits, change requirement amounts, or create an official schedule.
                </p>
              </div>
            </div>
          </section>
          <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5">
            <p className="text-sm font-bold">Saved warnings</p>
            <div className="mt-3 space-y-2">
              {(roadmap?.warnings_json ?? []).map((warning) => (
                <p key={warning} className="text-xs leading-5 text-[#5A6380]">
                  {warning}
                </p>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function groupRoadmapItems(items: RoadmapItem[]) {
  const active = items.filter((item) => !isDone(item) && item.status !== "skipped");
  const used = new Set<string>();
  const pick = (predicate: (item: RoadmapItem) => boolean) => {
    const selected = active.filter((item) => !used.has(item.id) && predicate(item));
    selected.forEach((item) => used.add(item.id));
    return selected;
  };
  return {
    immediate: pick((item) => item.timing_bucket === "immediately" || item.priority === "critical"),
    registration: pick((item) => item.timing_bucket === "before_course_registration"),
    term: pick((item) =>
      ["current_semester", "next_semester", "senior_year", "before_graduation"].includes(
        item.timing_bucket ?? "",
      ),
    ),
    alternates: pick((item) =>
      ["summer_option", "online_option", "credit_recovery_option"].includes(item.action_type ?? ""),
    ),
    counselor: pick(
      (item) =>
        item.counselor_review_required ||
        item.status === "needs_counselor" ||
        item.action_type === "counselor_question",
    ),
    lower: [
      ...active.filter((item) => !used.has(item.id)),
      ...items.filter((item) => isDone(item) || item.status === "skipped"),
    ],
  };
}

function ItemGroup({
  title,
  icon,
  items,
  onStatus,
  pending,
}: {
  title: string;
  icon: ReactNode;
  items: RoadmapItem[];
  onStatus: (
    item: RoadmapItem,
    status: "todo" | "in_progress" | "done" | "blocked" | "skipped" | "needs_counselor",
    note?: string | null,
  ) => Promise<void>;
  pending: boolean;
}) {
  if (!items.length) return null;
  return (
    <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0A175A]/8 text-[#0A175A]">
          {icon}
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#9AA3B2]">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
          <h3 className="font-display text-lg font-bold">{title}</h3>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <RoadmapItemCard key={item.id} item={item} onStatus={onStatus} pending={pending} />
        ))}
      </div>
    </section>
  );
}

function RoadmapItemCard({
  item,
  onStatus,
  pending,
}: {
  item: RoadmapItem;
  onStatus: (
    item: RoadmapItem,
    status: "todo" | "in_progress" | "done" | "blocked" | "skipped" | "needs_counselor",
    note?: string | null,
  ) => Promise<void>;
  pending: boolean;
}) {
  const [note, setNote] = useState(item.completion_note ?? "");
  const done = isDone(item);
  return (
    <article
      className={`rounded-2xl border p-4 ${done ? "border-[#01C3AD]/30 bg-[#01C3AD]/[0.05]" : "border-[#E8EBF0] bg-white"}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityPill priority={item.priority} />
            <StatusPill tone={item.counselor_review_required ? "coral" : "gray"}>
              {item.counselor_review_required ? "Counselor review" : labelize(item.status)}
            </StatusPill>
            <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9AA3B2]">
              {labelize(item.timing_bucket ?? "unknown")}
            </span>
          </div>
          <h4 className={`mt-2 text-sm font-bold ${done ? "line-through opacity-60" : ""}`}>
            {item.title}
          </h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <IconButton
            label="In progress"
            disabled={pending}
            onClick={() => void onStatus(item, "in_progress", note || null)}
          >
            <NotebookPen className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Done"
            disabled={pending}
            onClick={() => void onStatus(item, "done", note || null)}
          >
            <CheckCircle2 className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Blocked"
            disabled={pending}
            onClick={() => void onStatus(item, "blocked", note || null)}
          >
            <XCircle className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Skip"
            disabled={pending}
            onClick={() => void onStatus(item, "skipped", note || null)}
          >
            <Square className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      {item.description && (
        <p className="mt-3 text-xs leading-5 text-[#5A6380]">{item.description}</p>
      )}
      {item.student_instructions && (
        <p className="mt-2 text-xs leading-5 text-[#0A175A]">{item.student_instructions}</p>
      )}
      {item.evidence_note && (
        <p className="mt-2 rounded-xl bg-[#F6F8FB] p-3 text-xs leading-5 text-[#5A6380]">
          {item.evidence_note}
        </p>
      )}
      {item.counselor_question && (
        <p className="mt-2 rounded-xl bg-[#FFF8ED] p-3 text-xs leading-5 text-[#8A4D00]">
          {item.counselor_question}
        </p>
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Completion note"
          className="h-10 min-w-0 flex-1 rounded-xl border border-[#CDD3DE] px-3 text-xs outline-none focus:border-[#01C3AD]"
        />
        <button
          disabled={pending}
          onClick={() => void onStatus(item, normalizedStatus(item.status), note || null)}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[#CDD3DE] px-4 text-xs font-bold text-[#0A175A] disabled:opacity-60"
        >
          Save note
        </button>
      </div>
    </article>
  );
}

function ManualItemForm({ roadmapId }: { roadmapId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      addManualRoadmapItem({
        roadmapId,
        title,
        description: description || null,
        actionType: "manual_task",
        priority: "medium",
        timingBucket: "unknown",
      }),
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      await queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success("Manual roadmap item added.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to add roadmap item.");
    },
  });
  return (
    <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card">
      <h3 className="font-display text-lg font-bold">Add personal task</h3>
      <p className="mt-1 text-xs leading-5 text-[#5A6380]">
        This adds a personal planning task only. It does not change official requirements.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task title"
          className="h-11 rounded-xl border border-[#CDD3DE] px-3 text-sm outline-none focus:border-[#01C3AD]"
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional note"
          className="h-11 rounded-xl border border-[#CDD3DE] px-3 text-sm outline-none focus:border-[#01C3AD]"
        />
        <button
          disabled={!title.trim() || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0A175A] px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add
        </button>
      </div>
    </section>
  );
}

function PrerequisiteState({ state }: { state: BlockedState }) {
  return (
    <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-8 text-center shadow-card">
      <FileText className="mx-auto h-10 w-10 text-[#01C3AD]" />
      <h2 className="mt-4 font-display text-xl font-bold">{state.title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#5A6380]">{state.body}</p>
      <Link
        to={state.to}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0A175A] px-5 text-sm font-bold text-white"
      >
        {state.action} <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function ActionState({
  title,
  body,
  button,
  processing,
  onClick,
}: {
  title: string;
  body: string;
  button: string;
  processing: boolean;
  onClick: () => void;
}) {
  return (
    <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-8 text-center shadow-card">
      <ShieldAlert className="mx-auto h-10 w-10 text-[#0A175A]" />
      <h2 className="mt-4 font-display text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#5A6380]">{body}</p>
      <button
        disabled={processing}
        onClick={onClick}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#01C3AD] px-5 text-sm font-bold text-[#060F3D] disabled:opacity-60"
      >
        {processing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {button}
      </button>
    </section>
  );
}

function State({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <section
      className={`rounded-[24px] border p-8 text-center shadow-card ${error ? "border-[#F86746]/40 bg-[#F86746]/10 text-[#E65234]" : "border-[#CDD3DE]/70 bg-white text-[#5A6380]"}`}
    >
      <p className="text-sm font-bold">{text}</p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E8EBF0] bg-[#F6F8FB] p-3">
      <p className="text-xl font-black text-[#0A175A]">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#5A6380]">
        {label}
      </p>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const tone =
    risk === "red" ? "coral" : risk === "yellow" ? "navy" : risk === "green" ? "teal" : "gray";
  return <StatusPill tone={tone}>{labelize(risk)} risk</StatusPill>;
}

function PriorityPill({ priority }: { priority: string }) {
  const tone =
    priority === "critical" || priority === "high"
      ? "coral"
      : priority === "medium"
        ? "navy"
        : "gray";
  return <StatusPill tone={tone}>{labelize(priority)}</StatusPill>;
}

function IconButton({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-xl border border-[#CDD3DE] text-[#0A175A] transition hover:border-[#01C3AD] hover:text-[#019A8A] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function isDone(item: RoadmapItem) {
  return item.status === "done" || item.status === "completed";
}

function normalizedStatus(status: string) {
  if (status === "pending") return "todo";
  if (status === "completed") return "done";
  if (
    status === "todo" ||
    status === "in_progress" ||
    status === "done" ||
    status === "blocked" ||
    status === "skipped" ||
    status === "needs_counselor"
  ) {
    return status;
  }
  return "todo";
}
