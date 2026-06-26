import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleHelp,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PassportShell } from "@/components/PassportShell";
import {
  getGapAnalysis,
  regenerateGapAnalysis,
  startGapAnalysis,
  type GapAnalysis as GapAnalysisRecord,
  type GapRequirement,
} from "@/lib/scholaport-api";

export const Route = createFileRoute("/gaps")({ component: GapAnalysis });

function GapAnalysis() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["gap-analysis"], queryFn: getGapAnalysis });
  const [processing, setProcessing] = useState(false);
  const analysis = query.data?.analysis ?? null;
  const requirements = query.data?.requirements ?? [];
  const transcript = query.data?.transcript ?? null;
  const courses = query.data?.transcriptCourses ?? [];
  const mappings = query.data?.creditMappings ?? [];
  const profile = query.data?.profile ?? null;

  async function runGapAnalysis(regenerate = false) {
    if (!transcript) return;
    setProcessing(true);
    try {
      if (regenerate) await regenerateGapAnalysis(transcript.id);
      else await startGapAnalysis(transcript.id);
      await queryClient.invalidateQueries({ queryKey: ["gap-analysis"] });
      toast.success("Graduation gap preview updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to run gap analysis.");
    } finally {
      setProcessing(false);
    }
  }

  const blocked = getBlockedState({
    transcript,
    courses,
    mappings,
    profile,
  });

  return (
    <PassportShell
      eyebrow="Graduation gap detector"
      title="Scholaport preview of what looks satisfied, missing, or unclear."
      description="This is a counselor-ready preview. Final graduation and transfer-credit decisions are made by your school."
    >
      {query.isLoading ? (
        <State text="Loading your graduation gap preview…" />
      ) : query.error ? (
        <State
          text={query.error instanceof Error ? query.error.message : "Unable to load gap analysis."}
          error
        />
      ) : blocked ? (
        <PrerequisiteState state={blocked} />
      ) : !analysis ? (
        <ActionState
          title="Run graduation gap analysis"
          body="Your confirmed courses and probable credit mappings are ready. Scholaport can now compare them with the selected destination framework."
          button="Run graduation gap analysis"
          processing={processing}
          onClick={() => void runGapAnalysis(false)}
        />
      ) : (
        <Dashboard
          analysis={analysis}
          requirements={requirements}
          processing={processing}
          destinationFramework={
            profile?.destination_framework_label ?? profile?.target_state ?? "Destination framework"
          }
          onRegenerate={() => void runGapAnalysis(true)}
        />
      )}
    </PassportShell>
  );
}

function getBlockedState({
  transcript,
  courses,
  mappings,
  profile,
}: {
  transcript: { confirmation_status?: string; id: string } | null;
  courses: unknown[];
  mappings: unknown[];
  profile: { destination_framework_id?: string | null } | null;
}) {
  if (!transcript) {
    return {
      title: "Upload and confirm your transcript first.",
      body: "Gap analysis starts after Scholaport has confirmed transcript courses to compare.",
      action: "Go to transcript",
      to: "/transcript" as const,
    };
  }
  if (transcript.confirmation_status !== "confirmed" || !courses.length) {
    return {
      title: "Review and confirm your extracted courses first.",
      body: "OCR and translation results are not used for gaps until you confirm the course list.",
      action: "Review transcript",
      to: "/transcript" as const,
    };
  }
  if (!mappings.length) {
    return {
      title: "Generate probable credit mapping first.",
      body: "Gap analysis compares destination requirements against probable credit mappings.",
      action: "Open mapping review",
      to: "/transcript" as const,
    };
  }
  if (!profile?.destination_framework_id) {
    return {
      title: "Destination graduation framework is still being verified.",
      body: "Choose a destination state/framework in onboarding before running gap analysis.",
      action: "Open profile",
      to: "/profile" as const,
    };
  }
  return null;
}

function PrerequisiteState({
  state,
}: {
  state: { title: string; body: string; action: string; to: "/transcript" | "/profile" };
}) {
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

function Dashboard({
  analysis,
  requirements,
  processing,
  destinationFramework,
  onRegenerate,
}: {
  analysis: GapAnalysisRecord;
  requirements: GapRequirement[];
  processing: boolean;
  destinationFramework: string;
  onRegenerate: () => void;
}) {
  const red = requirements.filter((item) => item.risk_level === "red");
  const yellow = requirements.filter((item) => item.risk_level === "yellow");
  const green = requirements.filter((item) => item.risk_level === "green");
  const gray = requirements.filter((item) => item.risk_level === "gray");
  return (
    <div className="space-y-5">
      {analysis.status === "stale" && (
        <section className="rounded-[18px] border border-[#F0A33A] bg-[#FFF8ED] p-4 text-sm text-[#8A4D00]">
          This analysis may be outdated. Regenerate after transcript, mapping, or framework changes.
        </section>
      )}

      <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RiskBadge risk={analysis.overall_risk_level ?? "gray"} />
            <h2 className="mt-3 font-display text-2xl font-bold">Graduation gap preview</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5A6380]">
              {analysis.summary_text || analysis.analysis_summary || "Review with your counselor."}
            </p>
            <p className="mt-2 text-xs text-[#5A6380]">
              Destination: {destinationFramework} · Last updated{" "}
              {analysis.completed_at
                ? new Date(analysis.completed_at).toLocaleString()
                : "recently"}
            </p>
          </div>
          <button
            disabled={processing}
            onClick={onRegenerate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#CDD3DE] bg-white px-4 text-xs font-bold text-[#0A175A]"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Regenerate
          </button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="likely earned"
            value={`${analysis.total_likely_earned_credits ?? analysis.total_credits_mapped}`}
          />
          <Metric
            label="possible with review"
            value={`${analysis.total_possible_earned_credits ?? analysis.total_credits_mapped}`}
          />
          <Metric label="missing credits" value={`${analysis.total_missing_credits ?? 0}`} />
          <Metric
            label="review items"
            value={`${analysis.counselor_review_requirement_count ?? yellow.length}`}
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <main className="space-y-4">
          <RequirementGroup title="Still missing" icon={<AlertTriangle />} items={red} />
          <RequirementGroup title="Needs counselor review" icon={<CircleHelp />} items={yellow} />
          <RequirementGroup title="Likely satisfied" icon={<Check />} items={green} />
          <RequirementGroup title="Not enough verified data" icon={<Clock />} items={gray} />
        </main>
        <aside className="space-y-5">
          <section className="rounded-[24px] bg-[#0A175A] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#01C3AD]">
              Ask your counselor
            </p>
            <div className="mt-4 space-y-3">
              {(analysis.counselor_questions_json ?? [])
                .concat(requirements.map((item) => item.counselor_question ?? "").filter(Boolean))
                .slice(0, 8)
                .map((question, index) => (
                  <p
                    key={`${question}-${index}`}
                    className="rounded-xl bg-white/[.07] p-3 text-xs leading-5"
                  >
                    {question}
                  </p>
                ))}
            </div>
          </section>
          <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5">
            <p className="text-sm font-bold">Preview rules</p>
            <p className="mt-2 text-xs leading-5 text-[#5A6380]">
              High-confidence clean mappings can count as likely satisfied. Medium mappings count as
              possible. Low, unclear, rejected, or counselor-review mappings do not fully satisfy
              requirements in this preview.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function RequirementGroup({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: GapRequirement[];
}) {
  if (!items.length) return null;
  return (
    <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span className="text-[#0A175A] [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        <h3 className="font-display text-lg font-bold">{title}</h3>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <RequirementCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function RequirementCard({ item }: { item: GapRequirement }) {
  const required = item.required_amount ?? item.credits_required;
  const likely = item.earned_likely_amount ?? item.credits_mapped;
  const possible = item.earned_possible_amount ?? 0;
  const missing = item.missing_amount ?? item.credits_remaining;
  const percent = required ? Math.min(100, Math.round((likely / required) * 100)) : 0;
  return (
    <article className="rounded-[16px] border border-[#E8EBF0] bg-[#F8FAFC] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold">
            {item.requirement_name ?? item.requirement_category ?? item.subject_category}
          </p>
          <p className="mt-1 text-xs text-[#5A6380]">
            Required {required} {item.unit_type ?? "credits"} · likely {likely} · possible{" "}
            {possible} · missing {missing}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SmallBadge>{item.status.replaceAll("_", " ")}</SmallBadge>
          <SmallBadge>{item.priority}</SmallBadge>
        </div>
      </div>
      {required > 0 && (
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#E8EBF0]">
          <div className="h-full rounded-full bg-[#01C3AD]" style={{ width: `${percent}%` }} />
        </div>
      )}
      <p className="mt-3 text-xs leading-5 text-[#5A6380]">
        {item.student_explanation ?? item.notes ?? "Review this requirement with your counselor."}
      </p>
      {!!item.supporting_course_names?.length && (
        <p className="mt-2 text-xs text-[#162040]">
          Supporting courses: {item.supporting_course_names.join(", ")}
        </p>
      )}
      {!!item.unclear_course_names?.length && (
        <p className="mt-2 text-xs text-[#B45B00]">
          Review-needed courses: {item.unclear_course_names.join(", ")}
        </p>
      )}
      {item.counselor_question && (
        <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-[#0A175A]">
          {item.counselor_question}
        </p>
      )}
    </article>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[16px] border border-[#E8EBF0] bg-[#F8FAFC] p-4">
      <p className="font-display text-2xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#5A6380]">
        {label}
      </p>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const tone =
    risk === "green"
      ? "bg-[#E5FAF6] text-[#017F72]"
      : risk === "yellow"
        ? "bg-[#FFF5E5] text-[#9A5A00]"
        : risk === "red"
          ? "bg-[#FDEDEA] text-[#B8432E]"
          : "bg-[#EEF2F7] text-[#5A6380]";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase ${tone}`}>
      {risk} risk · Scholaport preview
    </span>
  );
}

function SmallBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full bg-white px-3 text-[10px] font-bold text-[#5A6380]">
      {children}
    </span>
  );
}

function State({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <div
      className={`rounded-[24px] border border-[#CDD3DE]/70 bg-white p-10 text-center text-sm shadow-card ${error ? "text-[#E65234]" : "text-[#5A6380]"}`}
    >
      {text}
    </div>
  );
}
