import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  FileCheck2,
  Flag,
  MessageCircleQuestion,
  Plane,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PassportShell, PassportStamp, StatusPill } from "@/components/PassportShell";
import { getPassportSummary, getPathMatches } from "@/lib/scholaport-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Academic Passport · Scholaport" },
      {
        name: "description",
        content:
          "See your translated credits, graduation gaps, and next steps in one student-owned academic passport.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const passportQuery = useQuery({ queryKey: ["passport-summary"], queryFn: getPassportSummary });
  const pathsQuery = useQuery({ queryKey: ["path-matches"], queryFn: getPathMatches });

  if (passportQuery.isLoading) {
    return (
      <PassportShell eyebrow="Academic passport" title="Loading your passport…">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]">
          <div className="h-[420px] animate-pulse rounded-[24px] bg-[#0A175A]/10" />
          <div className="h-[420px] animate-pulse rounded-[24px] bg-white shadow-card" />
        </div>
      </PassportShell>
    );
  }

  if (passportQuery.error || !passportQuery.data) {
    return (
      <PassportShell eyebrow="Academic passport" title="Your passport could not be loaded">
        <ErrorCard
          message={
            passportQuery.error instanceof Error
              ? passportQuery.error.message
              : "Unknown data error."
          }
        />
      </PassportShell>
    );
  }

  const { profile, transcript, gapAnalysis, gapRequirements, roadmapItems } = passportQuery.data;
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  const initials =
    `${profile.first_name.charAt(0)}${profile.last_name?.charAt(0) ?? ""}`.toUpperCase();
  const earned = gapAnalysis?.total_credits_mapped ?? 0;
  const required = gapAnalysis?.total_credits_required ?? 0;
  const percent = required > 0 ? Math.min(100, Math.round((earned / required) * 100)) : 0;
  const firstPath = pathsQuery.data?.[0] ?? null;
  const missingCount = gapRequirements.filter((item) => item.status !== "satisfied").length;

  return (
    <PassportShell
      eyebrow="Academic passport"
      title={`Good afternoon, ${profile.first_name}.`}
      description="Your journey is moving. Here’s what has been recorded, what still needs attention, and the clearest next step."
      action={
        <Link
          to="/packet"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0A175A] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(10,23,90,.18)] transition hover:bg-[#1A2B7A]"
        >
          <FileCheck2 className="h-4 w-4" /> Build counselor packet
        </Link>
      }
    >
      <div className="passport-enter grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]">
        <section className="relative overflow-hidden rounded-[24px] bg-[#0A175A] p-5 text-white shadow-[0_16px_40px_rgba(10,23,90,.16)] sm:p-7">
          <div className="passport-grid absolute inset-0 opacity-20" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[52px] border-[#01C3AD]/10" />
          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="teal">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Authenticated profile
                </StatusPill>
                <span className="text-xs text-white/45">
                  Updated {new Date(profile.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#01C3AD] text-lg font-black text-[#060F3D]">
                  {initials}
                </span>
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-[-0.04em]">{name}</h2>
                  <p className="mt-1 text-sm text-white/55">
                    Grade {profile.grade_at_transfer} · Class of{" "}
                    {profile.expected_graduation_year ?? "—"}
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/[0.07] px-3 py-2.5">
                  {profile.source_curriculum} · {profile.origin_country}
                </span>
                <Plane className="h-4 w-4 rotate-12 text-[#01C3AD]" />
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/[0.07] px-3 py-2.5">
                  {profile.target_state}, {profile.destination_country}
                </span>
              </div>
              <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 text-xs sm:grid-cols-3">
                <div>
                  <p className="text-white/40">TARGET SCHOOL</p>
                  <p className="mt-1.5 font-semibold text-white/85">
                    {profile.target_school || "Not added"}
                  </p>
                </div>
                <div>
                  <p className="text-white/40">EXPECTED GRADUATION</p>
                  <p className="mt-1.5 font-semibold text-white/85">
                    {profile.expected_graduation_year ?? "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-white/40">PASSPORT ID</p>
                  <p className="mt-1.5 font-mono text-[11px] font-semibold text-white/85">
                    CP-{profile.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden items-center justify-center gap-2 lg:flex lg:flex-col">
              <PassportStamp label="Origin" value={profile.source_curriculum.slice(0, 8)} />
              <PassportStamp label="Destination" value={profile.target_state.slice(0, 8)} coral />
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9AA3B2]">
                Graduation progress
              </p>
              <h2 className="mt-2 font-display text-xl font-bold tracking-[-0.03em]">
                {gapAnalysis ? "Recorded analysis" : "No analysis yet"}
              </h2>
            </div>
            {missingCount > 0 && <StatusPill tone="coral">{missingCount} gaps</StatusPill>}
          </div>
          <div className="mt-6 flex items-center gap-6">
            <ProgressRing percent={percent} />
            <div>
              <p className="text-3xl font-black tracking-[-0.04em] text-[#0A175A]">
                {earned}
                <span className="text-base font-semibold text-[#9AA3B2]"> / {required || "—"}</span>
              </p>
              <p className="mt-1 text-sm text-[#5A6380]">mapped credits</p>
            </div>
          </div>
          <div className="mt-6 space-y-3 border-t border-[#E8EBF0] pt-5">
            {gapRequirements.length === 0 ? (
              <p className="text-sm leading-6 text-[#5A6380]">
                Upload a transcript and create a gap analysis to see verified progress.
              </p>
            ) : (
              gapRequirements.slice(0, 4).map((item) => {
                const itemPercent =
                  item.credits_required > 0
                    ? Math.min(100, (item.credits_mapped / item.credits_required) * 100)
                    : 0;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[92px_1fr_auto] items-center gap-3 text-xs"
                  >
                    <span className="truncate font-semibold">{item.subject_category}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#E8EBF0]">
                      <div
                        className="h-full rounded-full bg-[#01C3AD]"
                        style={{ width: `${itemPercent}%` }}
                      />
                    </div>
                    <span className="font-bold text-[#5A6380]">
                      {item.credits_mapped}/{item.credits_required}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <Link
            to="/gaps"
            className="mt-5 flex items-center justify-between rounded-xl bg-[#F86746]/8 px-3.5 py-3 text-sm font-semibold text-[#E65234] transition hover:bg-[#F86746]/12"
          >
            Open gap analysis <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        <QuickAction
          to="/transcript"
          icon={<ScanLine />}
          eyebrow="Transcript"
          title={
            transcript
              ? transcript.original_filename || "Transcript uploaded"
              : "Upload your transcript"
          }
          body={
            transcript
              ? `Status: ${transcript.upload_status}`
              : "No transcript is stored for this passport yet."
          }
          tone="teal"
        />
        <QuickAction
          to="/roadmap"
          icon={<Flag />}
          eyebrow="Next checkpoint"
          title={roadmapItems[0]?.title ?? "No roadmap yet"}
          body={
            roadmapItems[0]?.description ??
            "Your roadmap will appear after a gap analysis is created."
          }
          tone="coral"
        />
        <QuickAction
          to="/advisor"
          icon={<MessageCircleQuestion />}
          eyebrow="Advisor"
          title="Open your conversation"
          body="Advisor messages are stored securely with your account."
          tone="navy"
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
        <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9AA3B2]">
                Your route forward
              </p>
              <h2 className="mt-1.5 font-display text-xl font-bold tracking-[-0.03em]">
                Next checkpoints
              </h2>
            </div>
            <Link to="/roadmap" className="text-sm font-bold text-[#019A8A]">
              Open roadmap
            </Link>
          </div>
          <div className="mt-6 space-y-1">
            {roadmapItems.length === 0 ? (
              <p className="rounded-xl bg-[#F6F8FB] p-4 text-sm text-[#5A6380]">
                No roadmap items have been created for this passport.
              </p>
            ) : (
              roadmapItems.slice(0, 3).map((item, index) => (
                <div
                  key={item.id}
                  className="relative grid grid-cols-[36px_1fr_auto] gap-3 pb-5 last:pb-0"
                >
                  {index < Math.min(roadmapItems.length, 3) - 1 && (
                    <span className="absolute left-[17px] top-8 h-[calc(100%-18px)] w-px bg-[#CDD3DE]" />
                  )}
                  <span
                    className={`relative z-10 grid h-9 w-9 place-items-center rounded-full ${item.status === "completed" ? "bg-[#01C3AD] text-[#060F3D]" : "border border-[#CDD3DE] bg-white text-[#9AA3B2]"}`}
                  >
                    {index === 0 ? <Clock3 className="h-4 w-4" /> : index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#5A6380]">{item.description}</p>
                  </div>
                  <span className="hidden text-[11px] font-semibold text-[#9AA3B2] sm:block">
                    {item.semester_target}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[24px] border border-[#01C3AD]/30 bg-[#01C3AD]/[0.07] p-5 sm:p-6">
          <Sparkles className="absolute right-5 top-5 h-6 w-6 text-[#01C3AD]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#019A8A]">
            PathMatch
          </p>
          <h2 className="mt-2 max-w-xs font-display text-xl font-bold leading-7 tracking-[-0.03em]">
            {firstPath
              ? `${firstPath.source_curriculum} → ${firstPath.target_state}`
              : "No verified path available"}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#5A6380]">
            {firstPath?.advice_for_future ??
              "Verified reference paths will appear here when available."}
          </p>
          <Link
            to="/pathmatch"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0A175A] px-4 text-sm font-semibold text-white"
          >
            Explore paths <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </PassportShell>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#E8EBF0" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#01C3AD"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xl font-black">
        {percent}%
      </span>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  eyebrow,
  title,
  body,
  tone,
}: {
  to: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  tone: "teal" | "coral" | "navy";
}) {
  const colors = {
    teal: "bg-[#01C3AD]/10 text-[#019A8A]",
    coral: "bg-[#F86746]/10 text-[#E65234]",
    navy: "bg-[#0A175A]/8 text-[#0A175A]",
  };
  return (
    <Link
      to={to}
      className="group flex min-h-36 items-start gap-4 rounded-[20px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-[#01C3AD]/40 hover:shadow-[0_10px_30px_rgba(10,23,90,.1)]"
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-[14px] [&>svg]:h-5 [&>svg]:w-5 ${colors[tone]}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9AA3B2]">
          {eyebrow}
        </span>
        <span className="mt-1 block text-base font-bold">{title}</span>
        <span className="mt-1.5 block text-xs leading-5 text-[#5A6380]">{body}</span>
      </span>
      <ChevronRight className="ml-auto mt-2 h-4 w-4 shrink-0 text-[#CDD3DE] transition group-hover:translate-x-0.5 group-hover:text-[#01C3AD]" />
    </Link>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] border border-[#F86746]/30 bg-white p-6 text-sm leading-6 text-[#5A6380] shadow-card">
      {message}
    </div>
  );
}
