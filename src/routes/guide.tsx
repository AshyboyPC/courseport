import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesColumn,
  Compass,
  Flag,
  GraduationCap,
  Search,
  Stamp,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PassportShell, StatusPill } from "@/components/PassportShell";
import { getGuideArticle, getGuideTopics } from "@/lib/scholaport-api";

const icons = {
  Stamp,
  Chart: ChartNoAxesColumn,
  People: UsersRound,
  Book: BookOpen,
  Calendar: CalendarDays,
  Flag,
};

export const Route = createFileRoute("/guide")({
  head: () => ({ meta: [{ title: "School Survival Guide · Scholaport" }] }),
  component: GuidePage,
});

function GuidePage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const guideTopics = useQuery({ queryKey: ["guide-topics"], queryFn: getGuideTopics });
  const selected = (guideTopics.data ?? []).find((topic) => topic.slug === active);
  const article = useQuery({
    queryKey: ["guide-article", selected?.id],
    queryFn: () => getGuideArticle(selected!.id),
    enabled: Boolean(selected),
  });
  const topics = useMemo(
    () =>
      (guideTopics.data ?? []).filter((topic) =>
        `${topic.title} ${topic.description} ${topic.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [guideTopics.data, query],
  );
  return (
    <PassportShell
      eyebrow="School survival guide"
      title="The things everyone assumes you already know."
      description="Friendly, practical explanations of U.S. school systems—built for students arriving from somewhere else."
    >
      <section className="relative overflow-hidden rounded-[24px] bg-[#01C3AD] p-6 text-[#060F3D] sm:p-8">
        <Compass className="absolute -bottom-10 -right-4 h-44 w-44 rotate-12 text-white/20" />
        <div className="relative max-w-2xl">
          <StatusPill tone="navy">Start here · 12 minutes</StatusPill>
          <h2 className="mt-4 font-display text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            Your first week, decoded.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#060F3D]/65">
            From bell schedules to talking with teachers: the calm orientation we wish every
            transfer student received.
          </p>
          <button className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0A175A] px-4 text-sm font-bold text-white">
            Open starter guide <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
      <div className="relative mt-5">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA3B2]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[#CDD3DE] bg-white pl-11 pr-4 text-sm shadow-soft outline-none focus:border-[#01C3AD] focus:ring-4 focus:ring-[#01C3AD]/10"
          placeholder="Search GPA, credits, counselors, AP, activities…"
        />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic) => {
          const Icon = icons[topic.icon_name as keyof typeof icons] ?? BookOpen;
          return (
            <button
              key={topic.slug}
              onClick={() => setActive(topic.slug)}
              className="group rounded-[22px] border border-[#CDD3DE]/70 bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-[#01C3AD]/50"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#0A175A]/8 text-[#0A175A]">
                  <Icon className="h-5 w-5" />
                </span>
                <StatusPill tone="gray">{topic.reading_time_minutes} min</StatusPill>
              </div>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#019A8A]">
                {topic.category}
              </p>
              <h2 className="mt-1.5 font-display text-lg font-bold">{topic.title}</h2>
              <p className="mt-2 text-xs leading-5 text-[#5A6380]">{topic.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-black text-[#0A175A]">
                Read guide{" "}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </span>
            </button>
          );
        })}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#060F3D]/55 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <article
            className="max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-[0_22px_70px_rgba(6,15,61,.28)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <StatusPill tone="teal">
                  {selected.category} · {selected.reading_time_minutes} min
                </StatusPill>
                <h2 className="mt-4 font-display text-2xl font-black tracking-[-0.04em]">
                  {selected.title}
                </h2>
              </div>
              <button
                onClick={() => setActive(null)}
                className="h-10 rounded-xl border border-[#CDD3DE] px-3 text-xs font-bold"
              >
                Close
              </button>
            </div>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#5A6380]">
              {article.isLoading
                ? "Loading article…"
                : (article.data?.content ??
                  "This article is not available in your preferred language yet.")}
            </p>
            {!!article.data?.key_takeaways.length && (
              <>
                <h3 className="mt-6 text-sm font-bold">Key takeaways</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5A6380]">
                  {article.data.key_takeaways.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-6 rounded-2xl bg-[#01C3AD]/[0.07] p-4">
              <p className="text-xs font-bold text-[#019A8A]">Passport tip</p>
              <p className="mt-1 text-xs leading-5 text-[#5A6380]">
                Bring syllabi for medium- or low-confidence mappings. They often answer the question
                faster than a translated course title alone.
              </p>
            </div>
          </article>
        </div>
      )}
    </PassportShell>
  );
}
