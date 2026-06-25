import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpenCheck,
  Check,
  ChevronRight,
  Laptop,
  MapPinned,
  MessageSquareText,
  School,
} from "lucide-react";
import { toast } from "sonner";
import { PassportShell, StatusPill } from "@/components/PassportShell";
import { getRoadmap, updateRoadmapItemStatus } from "@/lib/scholaport-api";
import { useAuth } from "@/components/AuthProvider";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Academic Roadmap · Scholaport" },
      {
        name: "description",
        content: "A semester-by-semester plan for closing graduation gaps on time.",
      },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const roadmapQuery = useQuery({ queryKey: ["roadmap"], queryFn: getRoadmap });
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "pending" | "completed" }) =>
      updateRoadmapItemStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      void queryClient.invalidateQueries({ queryKey: ["passport-summary"] });
    },
  });

  const toggle = async (id: string, complete: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, status: complete ? "pending" : "completed" });
      toast.success(complete ? "Checkpoint reopened." : "Checkpoint saved as complete.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to update the checkpoint.");
    }
  };

  const items = roadmapQuery.data?.items ?? [];
  const roadmap = roadmapQuery.data?.roadmap ?? null;
  const completed = items.filter((item) => item.status === "completed").length;
  const remainingCredits = items.reduce(
    (sum, item) => sum + (item.status === "completed" ? 0 : (item.credits_needed ?? 0)),
    0,
  );

  return (
    <PassportShell
      eyebrow="Academic roadmap"
      title="Your route to graduation."
      description="A persisted semester-by-semester plan based on the roadmap records saved to your Scholaport account."
    >
      <section className="relative overflow-hidden rounded-[24px] bg-[#0A175A] p-5 text-white shadow-[0_16px_40px_rgba(10,23,90,.16)] sm:p-7">
        <div className="passport-grid absolute inset-0 opacity-15" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <StatusPill tone="teal">
              {roadmap?.is_on_track ? "On track" : roadmap ? "Review needed" : "Not generated"}
            </StatusPill>
            <h2 className="mt-4 max-w-2xl font-display text-2xl font-bold leading-8 tracking-[-0.04em] sm:text-3xl">
              {roadmap?.title ?? "No academic roadmap has been created yet."}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
              Completed checkpoint changes are stored in Supabase and remain after refresh.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric value={String(items.length)} label="checkpoints" />
            <Metric value={String(completed)} label="completed" />
            <Metric value={remainingCredits.toFixed(1)} label="credits left" />
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9AA3B2]">
                Timeline
              </p>
              <h2 className="mt-1.5 font-display text-xl font-bold">Your checkpoints</h2>
            </div>
            <StatusPill tone="navy">Class of {profile?.expected_graduation_year ?? "—"}</StatusPill>
          </div>
          <div className="mt-7">
            {roadmapQuery.isLoading && (
              <p className="rounded-xl bg-[#F6F8FB] p-4 text-sm text-[#5A6380]">Loading roadmap…</p>
            )}
            {roadmapQuery.error && (
              <p className="rounded-xl bg-[#F86746]/10 p-4 text-sm text-[#E65234]">
                {roadmapQuery.error instanceof Error
                  ? roadmapQuery.error.message
                  : "Unable to load roadmap."}
              </p>
            )}
            {!roadmapQuery.isLoading && !roadmapQuery.error && items.length === 0 && (
              <p className="rounded-xl bg-[#F6F8FB] p-4 text-sm leading-6 text-[#5A6380]">
                No roadmap items exist for this passport. They will appear after a gap analysis
                generates a roadmap.
              </p>
            )}
            {items.map((item, index) => {
              const complete = item.status === "completed";
              const Icon =
                item.completion_method === "online"
                  ? Laptop
                  : item.completion_method === "counselor_meeting"
                    ? MessageSquareText
                    : School;
              return (
                <article
                  key={item.id}
                  className="relative grid grid-cols-[44px_1fr] gap-4 pb-7 last:pb-0"
                >
                  {index < items.length - 1 && (
                    <span className="absolute left-[21px] top-11 h-[calc(100%-10px)] w-px bg-[#CDD3DE]" />
                  )}
                  <button
                    disabled={updateMutation.isPending}
                    onClick={() => void toggle(item.id, complete)}
                    className={`relative z-10 grid h-11 w-11 place-items-center rounded-[14px] transition ${complete ? "bg-[#01C3AD] text-[#060F3D]" : index === 0 ? "bg-[#0A175A] text-white" : "border border-[#CDD3DE] bg-white text-[#9AA3B2]"}`}
                  >
                    {complete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </button>
                  <div
                    className={`rounded-2xl border p-4 transition ${complete ? "border-[#01C3AD]/30 bg-[#01C3AD]/[0.05]" : "border-[#E8EBF0]"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#019A8A]">
                            {item.semester_target || "Unscheduled"}
                          </span>
                          <span className="text-[10px] text-[#9AA3B2]">
                            {item.credits_needed != null ? `${item.credits_needed} credit` : ""}
                          </span>
                        </div>
                        <h3
                          className={`mt-1.5 text-sm font-bold ${complete ? "line-through opacity-60" : ""}`}
                        >
                          {item.title}
                        </h3>
                      </div>
                      {index === 0 && !complete && (
                        <StatusPill tone="coral">Do this first</StatusPill>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#5A6380]">{item.description}</p>
                    <button
                      disabled={updateMutation.isPending}
                      onClick={() => void toggle(item.id, complete)}
                      className="mt-3 text-xs font-bold text-[#019A8A]"
                    >
                      {complete ? "Mark not complete" : "Mark complete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5">
          <Link
            to="/packet"
            className="group block rounded-[24px] bg-[#01C3AD] p-5 text-[#060F3D] shadow-[0_10px_28px_rgba(1,195,173,.2)]"
          >
            <MapPinned className="h-6 w-6" />
            <h3 className="mt-4 font-display text-lg font-bold">
              Take this plan to your counselor
            </h3>
            <p className="mt-2 text-xs leading-5 text-[#060F3D]/65">
              The packet reads the same persisted roadmap records.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-black">
              Build packet <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
          <section className="rounded-[20px] border border-[#CDD3DE]/70 bg-white p-5">
            <div className="flex gap-3">
              <BookOpenCheck className="h-5 w-5 shrink-0 text-[#0A175A]" />
              <div>
                <p className="text-sm font-bold">Official decisions remain separate</p>
                <p className="mt-1 text-xs leading-5 text-[#5A6380]">
                  Roadmap completion tracks your work; it does not mark school credits as officially
                  awarded.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </PassportShell>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-24 rounded-2xl border border-white/10 bg-white/[0.07] p-3">
      <p className="text-lg font-black">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-wide text-white/45">{label}</p>
    </div>
  );
}
