import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Database, ExternalLink, ShieldCheck } from "lucide-react";
import { PassportShell, StatusPill } from "@/components/PassportShell";
import { getReferenceCoverage } from "@/lib/reference-api";

export const Route = createFileRoute("/reference-coverage")({
  head: () => ({ meta: [{ title: "Reference Coverage · Scholaport" }] }),
  component: ReferenceCoveragePage,
});

function ReferenceCoveragePage() {
  const coverage = useQuery({ queryKey: ["reference-coverage"], queryFn: getReferenceCoverage });
  return (
    <PassportShell
      eyebrow="Internal data operations"
      title="Reference data coverage"
      description="A factual inventory of what exists in Supabase. Counts of zero are intentional and mean research has not been imported yet."
      action={
        <StatusPill tone="navy">
          <Database className="mr-1 h-3 w-3" /> Internal view
        </StatusPill>
      }
    >
      <section className="overflow-hidden rounded-[24px] border border-[#CDD3DE]/70 bg-white shadow-card">
        {coverage.isLoading && <State text="Loading reference coverage…" />}
        {coverage.error && (
          <State
            error
            text={
              coverage.error instanceof Error
                ? coverage.error.message
                : "Unable to load reference coverage."
            }
          />
        )}
        {coverage.data && (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left">
              <thead className="bg-[#0A175A] text-[10px] uppercase tracking-[0.12em] text-white/65">
                <tr>
                  <Header>Country</Header>
                  <Header>Priority</Header>
                  <Header>MVP visibility</Header>
                  <Header>Jurisdictions</Header>
                  <Header>Curricula</Header>
                  <Header>Courses</Header>
                  <Header>Frameworks</Header>
                  <Header>Requirements</Header>
                  <Header>Programs</Header>
                  <Header>Sources</Header>
                  <Header>Coverage</Header>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBF0]">
                {coverage.data.map((row) => (
                  <tr key={row.country.id} className="text-xs hover:bg-[#F6F8FB]">
                    <Cell>
                      <span className="font-bold">{row.country.name}</span>
                      <span className="ml-2 text-[10px] text-[#9AA3B2]">{row.country.iso3}</span>
                    </Cell>
                    <Cell>
                      <Visibility value={row.mvpVisibility} />
                    </Cell>
                    <Cell>
                      {row.country.is_source_priority && (
                        <Tag>S{row.country.priority_rank_source}</Tag>
                      )}{" "}
                      {row.country.is_destination_priority && (
                        <Tag>D{row.country.priority_rank_destination}</Tag>
                      )}
                    </Cell>
                    <NumberCell value={row.jurisdictions} />
                    <NumberCell value={row.curricula} />
                    <NumberCell value={row.curriculumCourses} />
                    <NumberCell value={row.frameworks} />
                    <NumberCell value={row.requirements} />
                    <NumberCell value={row.programs} />
                    <NumberCell value={row.dataSources} />
                    <Cell>
                      <Coverage status={row.country.coverage_status} />
                    </Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="mt-5 flex gap-3 rounded-[20px] border border-[#01C3AD]/25 bg-[#01C3AD]/[0.06] p-5">
        <ShieldCheck className="h-5 w-5 shrink-0 text-[#019A8A]" />
        <div>
          <h2 className="text-sm font-bold">Coverage labels are evidence labels</h2>
          <p className="mt-1 text-xs leading-5 text-[#5A6380]">
            Only sourced records should advance to verified or official. Country seed rows establish
            routing coverage but contain no invented education-system claims.
          </p>
        </div>
        <ExternalLink className="ml-auto h-4 w-4 text-[#9AA3B2]" />
      </section>
    </PassportShell>
  );
}

function Header({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-bold">{children}</th>;
}
function Cell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}
function NumberCell({ value }: { value: number }) {
  return (
    <Cell>
      <span className={value ? "font-black text-[#0A175A]" : "text-[#CDD3DE]"}>{value}</span>
    </Cell>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#0A175A]/8 px-2 py-1 text-[9px] font-black text-[#0A175A]">
      {children}
    </span>
  );
}
function Coverage({ status }: { status: string }) {
  const sourced = status === "official" || status === "verified";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${sourced ? "bg-[#01C3AD]/10 text-[#019A8A]" : status === "needs_research" || status === "country_seed_only" ? "bg-[#F86746]/10 text-[#E65234]" : "bg-[#0A175A]/8 text-[#5A6380]"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
function Visibility({ value }: { value: "source" | "destination" | "hidden" }) {
  const label = value === "hidden" ? "Verified/seeded, hidden" : `MVP 1 ${value}`;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${value === "hidden" ? "bg-[#0A175A]/8 text-[#5A6380]" : "bg-[#01C3AD]/10 text-[#019A8A]"}`}
    >
      {label}
    </span>
  );
}
function State({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <div className={`p-10 text-center text-sm ${error ? "text-[#E65234]" : "text-[#5A6380]"}`}>
      {text}
    </div>
  );
}
