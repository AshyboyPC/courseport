import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Check, CircleHelp, Flag, ShieldAlert } from "lucide-react";
import { PassportShell, StatusPill } from "@/components/PassportShell";
import { getGapAnalysis } from "@/lib/scholaport-api";

export const Route = createFileRoute("/gaps")({ component: GapAnalysis });

function GapAnalysis() {
  const query = useQuery({ queryKey: ["gap-analysis"], queryFn: getGapAnalysis });
  const analysis = query.data?.analysis;
  const requirements = query.data?.requirements ?? [];
  const gaps = requirements.filter((item) => item.credits_remaining > 0);
  return (
    <PassportShell
      eyebrow="Graduation requirements"
      title={analysis ? `${gaps.length} gaps. One clear plan.` : "Your gap analysis"}
      description="Scholaport shows only the graduation analysis stored in your Academic Passport. Your school makes the final credit decision."
      action={
        <Link
          to="/roadmap"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#01C3AD] px-4 text-sm font-bold text-[#060F3D]"
        >
          Open roadmap <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      {query.isLoading ? (
        <State text="Loading your gap analysis…" />
      ) : query.error ? (
        <State
          text={query.error instanceof Error ? query.error.message : "Unable to load gap analysis."}
          error
        />
      ) : !analysis ? (
        <State text="No gap analysis exists for your account yet. Uploading a transcript does not fabricate one; it will appear after the analysis service is implemented." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]">
          <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-[#E8EBF0] pb-5">
              <div>
                <StatusPill tone={gaps.length ? "coral" : "teal"}>
                  <ShieldAlert className="mr-1 h-3 w-3" />
                  {gaps.length ? "Attention needed" : "On track"}
                </StatusPill>
                <h2 className="mt-3 font-display text-xl font-bold">Credit coverage by subject</h2>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">
                  {analysis.total_credits_mapped}
                  <span className="text-base text-[#9AA3B2]">
                    {" "}
                    / {analysis.total_credits_required}
                  </span>
                </p>
                <p className="text-xs text-[#5A6380]">mapped credits</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {requirements.map((item) => {
                const percent = item.credits_required
                  ? Math.min(100, Math.round((item.credits_mapped / item.credits_required) * 100))
                  : 100;
                return (
                  <div key={item.id} className="rounded-2xl border border-[#E8EBF0] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-full ${item.credits_remaining <= 0 ? "bg-[#01C3AD]/10 text-[#019A8A]" : "bg-[#F86746]/10 text-[#E65234]"}`}
                        >
                          {item.credits_remaining <= 0 ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-bold">{item.subject_category}</p>
                          <p className="text-[11px] text-[#9AA3B2]">
                            {item.credits_mapped} of {item.credits_required} credits mapped
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black">{percent}%</span>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#E8EBF0]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percent}%`,
                          background: item.credits_remaining <= 0 ? "#01C3AD" : "#F86746",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <aside className="space-y-5">
            <section className="rounded-[24px] bg-[#0A175A] p-6 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#01C3AD]">
                Analysis summary
              </p>
              <h2 className="mt-3 font-display text-xl font-bold">
                {analysis.analysis_summary ??
                  "Review the remaining requirements with your counselor."}
              </h2>
              <div className="mt-5 space-y-2.5">
                {gaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="flex items-center gap-3 rounded-xl bg-white/[.07] p-3"
                  >
                    <Flag className="h-4 w-4 text-[#F86746]" />
                    <div>
                      <p className="text-sm font-bold">{gap.subject_category}</p>
                      <p className="text-[10px] text-white/45">
                        {gap.credits_remaining} credits remaining
                      </p>
                    </div>
                    <span className="ml-auto text-[10px] font-bold uppercase text-[#FA8A70]">
                      {gap.priority}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                to="/advisor"
                className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-[#0A175A]"
              >
                <CircleHelp className="h-4 w-4" /> Ask the advisor
              </Link>
            </section>
          </aside>
        </div>
      )}
    </PassportShell>
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
