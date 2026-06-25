import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Download,
  Eye,
  FileCheck2,
  FileText,
  LockKeyhole,
  Printer,
  RefreshCw,
  Share2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScholaportLogo } from "@/components/ScholaportLogo";
import { PassportShell, StatusPill } from "@/components/PassportShell";
import {
  getCreditMappings,
  getGapAnalysis,
  getPassportSummary,
  getTranscriptCourses,
} from "@/lib/scholaport-api";

const sections = [
  "Student summary",
  "Original transcript",
  "Translated course list",
  "Probable credit map",
  "Graduation gap checklist",
  "Counselor questions",
  "Academic roadmap",
  "PathMatch insight",
];

export const Route = createFileRoute("/packet")({
  head: () => ({ meta: [{ title: "Counselor Packet · Scholaport" }] }),
  component: PacketPage,
});

function PacketPage() {
  const passport = useQuery({ queryKey: ["passport-summary"], queryFn: getPassportSummary });
  const courses = useQuery({ queryKey: ["transcript-courses"], queryFn: getTranscriptCourses });
  const mappings = useQuery({ queryKey: ["credit-mappings"], queryFn: getCreditMappings });
  const gaps = useQuery({ queryKey: ["gap-analysis"], queryFn: getGapAnalysis });
  const student = passport.data?.profile;
  const [included, setIncluded] = useState(sections);
  const toggle = (section: string) =>
    setIncluded((items) =>
      items.includes(section) ? items.filter((item) => item !== section) : [...items, section],
    );
  const download = () => {
    toast.success("Opening a print-ready counselor packet.");
    window.setTimeout(() => window.print(), 350);
  };
  return (
    <PassportShell
      eyebrow="Counselor-ready packet"
      title="Walk into the meeting prepared."
      description="A clear, professional preview of your transcript translation, probable credits, gaps, and questions—built to start a productive official review."
      action={
        <button
          onClick={download}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#01C3AD] px-4 text-sm font-bold text-[#060F3D]"
        >
          <Download className="h-4 w-4" /> Print packet
        </button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Packet contents</h2>
              <span className="text-xs font-black text-[#019A8A]">{included.length}/8</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#5A6380]">
              Choose what your counselor needs. Original documents remain unchanged.
            </p>
            <div className="mt-5 space-y-1">
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => toggle(section)}
                  className="flex h-10 w-full items-center gap-3 rounded-xl px-2 text-left text-xs font-semibold transition hover:bg-[#F6F8FB]"
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-md border ${included.includes(section) ? "border-[#01C3AD] bg-[#01C3AD] text-[#060F3D]" : "border-[#CDD3DE]"}`}
                  >
                    {included.includes(section) && <Check className="h-3.5 w-3.5" />}
                  </span>
                  {section}
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-[20px] bg-[#0A175A] p-5 text-white">
            <div className="flex gap-3">
              <LockKeyhole className="h-5 w-5 shrink-0 text-[#01C3AD]" />
              <div>
                <h3 className="text-sm font-bold">You control this file</h3>
                <p className="mt-1 text-[10px] leading-4 text-white/50">
                  Scholaport never sends your packet to a school automatically. Download or share it
                  only when you choose.
                </p>
              </div>
            </div>
          </section>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={download}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0A175A] text-xs font-bold text-white"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              disabled
              title="Secure sharing is not implemented yet"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CDD3DE] bg-white text-xs font-bold opacity-50"
            >
              <Share2 className="h-4 w-4" /> Share link
            </button>
          </div>
        </aside>

        <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-[#E8EBF0] p-3 shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#5A6380]" />
              <span className="text-xs font-bold text-[#5A6380]">Live preview</span>
            </div>
            <StatusPill tone="teal">
              <Sparkles className="mr-1 h-3 w-3" /> Ready
            </StatusPill>
          </div>
          <div className="mx-auto min-h-[900px] max-w-[760px] bg-white p-7 shadow-[0_14px_40px_rgba(10,23,90,.14)] sm:p-10 print:max-w-none print:shadow-none">
            <header className="flex items-start justify-between gap-6 border-b-4 border-[#0A175A] pb-7">
              <div>
                <ScholaportLogo className="h-12" showWordmark />
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#019A8A]">
                  Academic transfer review packet
                </p>
                <h1 className="mt-2 font-display text-3xl font-black tracking-[-0.05em]">
                  {student
                    ? `${student.first_name} ${student.last_name ?? ""}`.trim()
                    : "Loading student"}
                </h1>
                <p className="mt-2 text-sm text-[#5A6380]">
                  {student
                    ? `${student.source_curriculum}, ${student.origin_country} → ${student.target_state}`
                    : ""}
                </p>
              </div>
              <div className="rounded-2xl border-2 border-dashed border-[#01C3AD]/40 p-4 text-center text-[#019A8A]">
                <FileCheck2 className="mx-auto h-6 w-6" />
                <p className="mt-2 text-[8px] font-black uppercase tracking-widest">
                  Counselor preview
                </p>
                <p className="mt-1 text-xs font-black">19 JUN 2026</p>
              </div>
            </header>
            {included.includes("Student summary") && (
              <PacketSection number="01" title="Student summary">
                <div className="grid gap-3 sm:grid-cols-3">
                  <PacketDetail
                    label="Current grade"
                    value={student ? `Grade ${student.grade_at_transfer}` : "Not recorded"}
                  />
                  <PacketDetail
                    label="Target school"
                    value={student?.target_school ?? "Not recorded"}
                  />
                  <PacketDetail
                    label="Graduation goal"
                    value={
                      student?.expected_graduation_year
                        ? String(student.expected_graduation_year)
                        : "Not recorded"
                    }
                  />
                </div>
                <p className="mt-4 rounded-xl bg-[#01C3AD]/[0.07] p-4 text-xs leading-5 text-[#5A6380]">
                  This packet includes only authenticated records currently stored in this student’s
                  Academic Passport. Official decisions must be made by the receiving school.
                </p>
              </PacketSection>
            )}
            {included.includes("Probable credit map") && (
              <PacketSection number="02" title="Probable credit map">
                <div className="overflow-hidden rounded-xl border border-[#CDD3DE]">
                  <div className="grid grid-cols-[1.3fr_1.2fr_auto] bg-[#0A175A] px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-white">
                    <span>Source course</span>
                    <span>Probable equivalent</span>
                    <span>Credit</span>
                  </div>
                  {(courses.data ?? []).slice(0, 6).map((course) => {
                    const mapping = (mappings.data ?? []).find(
                      (item) => item.transcript_course_id === course.id,
                    );
                    return (
                      <div
                        key={course.id}
                        className="grid grid-cols-[1.3fr_1.2fr_auto] gap-2 border-t border-[#E8EBF0] px-3 py-2.5 text-[10px]"
                      >
                        <span className="font-semibold">{course.course_name_original}</span>
                        <span>{mapping?.probable_us_equivalent ?? "Not mapped"}</span>
                        <span className="font-black">{mapping?.credits_mapped ?? "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </PacketSection>
            )}
            {included.includes("Graduation gap checklist") && (
              <PacketSection number="03" title="Graduation gap checklist">
                <div className="grid gap-2 sm:grid-cols-2">
                  {(gaps.data?.requirements ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-[#E8EBF0] p-2.5 text-[10px]"
                    >
                      <span className="font-semibold">{item.subject_category}</span>
                      <span
                        className={
                          item.credits_remaining <= 0
                            ? "font-black text-[#019A8A]"
                            : "font-black text-[#F86746]"
                        }
                      >
                        {item.credits_mapped}/{item.credits_required}
                      </span>
                    </div>
                  ))}
                </div>
              </PacketSection>
            )}
            {included.includes("Counselor questions") && (
              <PacketSection number="04" title="Questions for the counselor">
                <ol className="space-y-2 text-xs leading-5 text-[#5A6380]">
                  <li>1. Which mapped credits can be confirmed today?</li>
                  <li>2. Which courses still require syllabi or supporting documents?</li>
                  <li>3. Which remaining requirements should be scheduled first?</li>
                </ol>
              </PacketSection>
            )}
            <footer className="mt-10 flex items-center justify-between border-t border-[#CDD3DE] pt-4 text-[8px] text-[#9AA3B2]">
              <span>{student ? `CP-${student.id.slice(0, 8).toUpperCase()}` : ""}</span>
              <span>Educational preview · Not an official credential evaluation</span>
            </footer>
          </div>
        </section>
      </div>
    </PassportShell>
  );
}

function PacketSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#0A175A] text-[9px] font-black text-white">
          {number}
        </span>
        <h2 className="font-display text-base font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
function PacketDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] font-bold uppercase tracking-widest text-[#9AA3B2]">{label}</p>
      <p className="mt-1 text-[10px] font-bold">{value}</p>
    </div>
  );
}
