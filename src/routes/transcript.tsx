import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  Languages,
  Loader2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { PassportShell } from "@/components/PassportShell";
import {
  createTranscriptUpload,
  getCreditMappings,
  getPassportSummary,
  getTranscriptCourses,
} from "@/lib/scholaport-api";

export const Route = createFileRoute("/transcript")({ component: TranscriptPage });

function TranscriptPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const courses = useQuery({ queryKey: ["transcript-courses"], queryFn: getTranscriptCourses });
  const mappings = useQuery({ queryKey: ["credit-mappings"], queryFn: getCreditMappings });
  const passport = useQuery({ queryKey: ["passport-summary"], queryFn: getPassportSummary });
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function processFile(file: File) {
    if (file.size > 50 * 1024 * 1024) return toast.error("Please keep the file under 50 MB.");
    setUploading(true);
    try {
      const transcript = await createTranscriptUpload(file);
      await queryClient.invalidateQueries({ queryKey: ["passport-summary"] });
      toast.success(
        transcript.storageUploaded
          ? "Transcript uploaded securely."
          : "Transcript record saved. Storage is not available yet.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const rows = (courses.data ?? []).map((course) => ({
    course,
    mapping: (mappings.data ?? []).find((item) => item.transcript_course_id === course.id),
  }));
  const transcript = passport.data?.transcript;
  const loading = courses.isLoading || mappings.isLoading || passport.isLoading;
  const error = courses.error || mappings.error || passport.error;

  return (
    <PassportShell
      eyebrow="Transcript intelligence"
      title="Bring your learning with you."
      description="Upload a transcript securely. Scholaport stores the original record now; extraction and automated academic mapping are intentionally reserved for the next implementation stage."
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void processFile(file);
        }}
      />
      <div className="mx-auto max-w-6xl grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white shadow-card">
          <div className="flex flex-col gap-4 border-b border-[#E8EBF0] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#0A175A]/8 text-[#0A175A]">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold">Academic transcript</h2>
                <p className="mt-0.5 text-xs text-[#5A6380]">
                  {transcript?.original_filename ?? "No transcript uploaded"}
                </p>
              </div>
            </div>
            <button
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#01C3AD] px-4 text-xs font-bold text-[#060F3D] disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}{" "}
              {transcript ? "Replace file" : "Choose a file"}
            </button>
          </div>
          {loading ? (
            <Status text="Loading your transcript…" />
          ) : error ? (
            <Status
              text={error instanceof Error ? error.message : "Unable to load transcript."}
              error
            />
          ) : rows.length === 0 ? (
            <div className="grid min-h-[340px] place-items-center p-8 text-center">
              <div className="max-w-md">
                <UploadCloud className="mx-auto h-10 w-10 text-[#01C3AD]" />
                <h3 className="mt-4 font-display text-xl font-bold">
                  {transcript
                    ? "File saved. Course extraction has not run yet."
                    : "Upload your first transcript"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#5A6380]">
                  {transcript
                    ? "The authenticated file record is live in your passport. No courses or mappings will be invented while OCR is unavailable."
                    : "PDF, JPG, or PNG up to 50 MB. Your file belongs only to your account."}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#E8EBF0]">
              {rows.map(({ course, mapping }) => {
                const open = expanded === course.id;
                return (
                  <article key={course.id}>
                    <button
                      onClick={() => setExpanded(open ? null : course.id)}
                      className="grid w-full grid-cols-[1fr_auto] gap-4 p-5 text-left hover:bg-[#F6F8FB] sm:grid-cols-[1fr_1fr_auto]"
                    >
                      <div>
                        <p className="text-sm font-bold">
                          {course.course_name_translated ?? course.course_name_original}
                        </p>
                        <p className="mt-1 text-xs text-[#5A6380]">
                          {course.course_name_original} ·{" "}
                          {course.grade_original ?? "Grade not recorded"}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9AA3B2]">
                          Probable equivalent
                        </p>
                        <p className="mt-1 text-xs font-semibold">
                          {mapping?.probable_us_equivalent ?? "Not mapped"}
                        </p>
                      </div>
                      <ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <div className="grid gap-3 bg-[#F6F8FB] px-5 py-4 sm:grid-cols-3">
                        <Detail
                          label="Subject"
                          value={
                            mapping?.target_subject_category ??
                            course.subject_category ??
                            "Uncategorized"
                          }
                        />
                        <Detail
                          label="Credit"
                          value={
                            mapping?.credits_mapped == null
                              ? "Not mapped"
                              : `${mapping.credits_mapped} credit`
                          }
                        />
                        <Detail
                          label="Review"
                          value={
                            mapping?.needs_counselor_review
                              ? "Counselor review needed"
                              : "No review flag"
                          }
                        />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <aside className="space-y-5">
          <section className="rounded-[24px] bg-[#0A175A] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#01C3AD]">
              Passport record
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Metric value={String(rows.length)} label="courses" />
              <Metric value={String((mappings.data ?? []).length)} label="mappings" />
            </div>
            <p className="mt-5 text-xs leading-5 text-white/65">
              Only records stored for your authenticated account appear here.
            </p>
            <Link
              to="/gaps"
              className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#01C3AD] text-sm font-bold text-[#060F3D]"
            >
              View gap analysis <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
          <section className="rounded-[20px] border border-[#CDD3DE]/70 bg-white p-5">
            <div className="flex gap-3">
              <Languages className="h-5 w-5 text-[#019A8A]" />
              <div>
                <p className="text-sm font-bold">Academic, not literal</p>
                <p className="mt-1 text-xs leading-5 text-[#5A6380]">
                  Automated translation and OCR are not enabled in this foundation build.
                </p>
              </div>
            </div>
          </section>
          <div className="flex items-center gap-2 text-xs text-[#5A6380]">
            <ShieldCheck className="h-4 w-4 text-[#01C3AD]" /> Private storage is scoped to your
            user ID.
          </div>
        </aside>
      </div>
    </PassportShell>
  );
}

function Status({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <div className={`p-10 text-center text-sm ${error ? "text-[#E65234]" : "text-[#5A6380]"}`}>
      {text}
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9AA3B2]">{label}</p>
      <p className="mt-1 text-xs font-semibold">{value}</p>
    </div>
  );
}
function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/[.07] p-3 text-center">
      <p className="text-lg font-black">{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-white/45">{label}</p>
    </div>
  );
}
