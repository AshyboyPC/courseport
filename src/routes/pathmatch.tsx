import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Check,
  Compass,
  Filter,
  Flag,
  GraduationCap,
  Heart,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PassportShell, StatusPill } from "@/components/PassportShell";
import { getPathMatches } from "@/lib/scholaport-api";

export const Route = createFileRoute("/pathmatch")({
  head: () => ({ meta: [{ title: "PathMatch · Scholaport" }] }),
  component: PathMatchPage,
});

function PathMatchPage() {
  const [saved, setSaved] = useState<string[]>([]);
  const paths = useQuery({ queryKey: ["path-matches"], queryFn: getPathMatches });
  const best = paths.data?.[0];
  return (
    <PassportShell
      eyebrow="Anonymized transfer intelligence"
      title="Someone has taken a path like yours."
      description="PathMatch surfaces verified, anonymized patterns from students with similar origins, curricula, destinations, and goals."
    >
      <section className="relative overflow-hidden rounded-[24px] bg-[#0A175A] p-5 text-white sm:p-7">
        <div className="passport-grid absolute inset-0 opacity-15" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <StatusPill tone="teal">
              <Sparkles className="mr-1 h-3 w-3" /> Verified path records
            </StatusPill>
            <h2 className="mt-4 max-w-2xl font-display text-2xl font-bold tracking-[-0.04em]">
              {best
                ? `${best.source_curriculum} · ${best.target_state} · ${best.target_program ?? "General"}`
                : "No matching paths available yet"}
            </h2>
            <p className="mt-2 text-sm text-white/55">
              Results are filtered from stored, verified reference paths.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#01C3AD] text-lg font-black text-[#060F3D]">
              {paths.data?.length ?? 0}
            </span>
            <div>
              <p className="text-sm font-bold">available paths</p>
              <p className="text-xs text-white/45">not a guarantee</p>
            </div>
          </div>
        </div>
      </section>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA3B2]" />
          <input
            className="h-11 w-full rounded-xl border border-[#CDD3DE] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#01C3AD]"
            placeholder="Search paths by country, state, or program"
          />
        </div>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CDD3DE] bg-white px-4 text-sm font-bold">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {(paths.data ?? []).map((path) => (
          <article
            key={path.id}
            className="group rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:border-[#01C3AD]/45 hover:shadow-[0_14px_34px_rgba(10,23,90,.1)]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0A175A] font-black text-white">
                {path.source_curriculum.charAt(0)}P
              </span>
              <span className="rounded-full bg-[#01C3AD]/10 px-3 py-1 text-xs font-black text-[#019A8A]">
                Verified
              </span>
            </div>
            <h2 className="mt-5 font-display text-lg font-bold">
              {path.source_curriculum} transfer path
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#5A6380]">
              <MapPin className="h-3.5 w-3.5" /> {path.origin_country} → {path.target_state}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <StatusPill tone="navy">{path.target_program ?? "General"}</StatusPill>
              <StatusPill tone="teal">
                <GraduationCap className="mr-1 h-3 w-3" />{" "}
                {path.graduated_on_time ? "On-time graduation" : "Outcome not recorded"}
              </StatusPill>
            </div>
            <div className="mt-5 border-t border-[#E8EBF0] pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F86746]">
                Biggest challenge
              </p>
              <p className="mt-1.5 text-sm font-semibold">
                {path.biggest_challenges[0] ?? "Not recorded"}
              </p>
            </div>
            <div className="mt-4 rounded-xl bg-[#F6F8FB] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA3B2]">
                What they wish they knew
              </p>
              <p className="mt-1.5 text-xs leading-5 text-[#5A6380]">
                “{path.advice_for_future ?? "No advice recorded."}”
              </p>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA3B2]">
                Transferred well
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.keys(path.credits_transferred).map((item) => (
                  <span key={item} className="inline-flex items-center gap-1 text-xs font-semibold">
                    <Check className="h-3 w-3 text-[#01C3AD]" /> {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A175A] text-xs font-bold text-white">
                View path <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <button
                aria-label="Save path"
                onClick={() =>
                  setSaved((items) =>
                    items.includes(path.id)
                      ? items.filter((item) => item !== path.id)
                      : [...items, path.id],
                  )
                }
                className={`grid h-10 w-10 place-items-center rounded-xl border ${saved.includes(path.id) ? "border-[#F86746] bg-[#F86746]/10 text-[#F86746]" : "border-[#CDD3DE] text-[#9AA3B2]"}`}
              >
                <Heart className={`h-4 w-4 ${saved.includes(path.id) ? "fill-current" : ""}`} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <section className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[20px] border border-[#01C3AD]/30 bg-[#01C3AD]/[0.06] p-5 sm:flex-row sm:items-center">
        <div className="flex gap-3">
          <Compass className="h-6 w-6 shrink-0 text-[#019A8A]" />
          <div>
            <h3 className="text-sm font-bold">Your experience can guide the next student.</h3>
            <p className="mt-1 text-xs text-[#5A6380]">
              After graduation, contribute an anonymized path—never your name, school ID, or
              documents.
            </p>
          </div>
        </div>
        <button className="h-10 rounded-xl border border-[#01C3AD]/40 bg-white px-4 text-xs font-bold text-[#019A8A]">
          How privacy works
        </button>
      </section>
    </PassportShell>
  );
}
