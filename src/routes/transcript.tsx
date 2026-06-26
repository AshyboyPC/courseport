import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  Languages,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { PassportShell } from "@/components/PassportShell";
import {
  addManualTranscriptCourse,
  confirmCreditMapping,
  confirmTranscriptCourses,
  createTranscriptUpload,
  deleteTranscriptCandidate,
  getCreditMappings,
  getPassportSummary,
  getTranscriptCourses,
  getTranscriptReview,
  markTranscriptForCounselorReview,
  markCreditMappingForCounselorReview,
  regenerateCreditMappings,
  rejectCreditMapping,
  retryTranscriptProcessing,
  saveEditedTranscriptCandidate,
  startCreditMapping,
  startTranscriptProcessing,
  switchSelectedSourceFramework,
  TranscriptApiError,
  updateCreditMapping,
  type CreditMapping,
  type Transcript,
  type TranscriptCourseCandidate,
  type TranscriptCandidatePatch,
} from "@/lib/scholaport-api";

export const Route = createFileRoute("/transcript")({ component: TranscriptPage });

const processingMessages = [
  "Uploading transcript securely…",
  "Running Google Document AI…",
  "Detecting language and layout…",
  "Translating academic text when needed…",
  "Understanding transcript rows…",
  "Preparing editable review…",
];

function TranscriptPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const courses = useQuery({ queryKey: ["transcript-courses"], queryFn: getTranscriptCourses });
  const mappings = useQuery({ queryKey: ["credit-mappings"], queryFn: getCreditMappings });
  const passport = useQuery({ queryKey: ["passport-summary"], queryFn: getPassportSummary });
  const review = useQuery({
    queryKey: ["transcript-review"],
    queryFn: () => getTranscriptReview(),
  });
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmingCourses, setConfirmingCourses] = useState(false);
  const [mappingProcessing, setMappingProcessing] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!processing) return;
    const interval = window.setInterval(
      () => setMessageIndex((current) => (current + 1) % processingMessages.length),
      1400,
    );
    return () => window.clearInterval(interval);
  }, [processing]);

  async function refreshTranscriptData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transcript-review"] }),
      queryClient.invalidateQueries({ queryKey: ["transcript-courses"] }),
      queryClient.invalidateQueries({ queryKey: ["credit-mappings"] }),
      queryClient.invalidateQueries({ queryKey: ["passport-summary"] }),
    ]);
  }

  async function processFile(file: File) {
    if (file.size > 50 * 1024 * 1024) return toast.error("Please keep the file under 50 MB.");
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return toast.error("Upload a PDF, JPG, PNG, or WEBP transcript.");
    }
    setUploading(true);
    setProcessing(true);
    setMessageIndex(0);
    try {
      const { transcript, storageUploaded } = await createTranscriptUpload(file);
      if (!storageUploaded) {
        toast.error("Private storage upload failed. Manual entry is available.");
      } else {
        const processed = await startTranscriptProcessing(transcript.id);
        if (processed.transcript?.requires_manual_entry) {
          toast.error("Live processing needs setup. Manual entry is available.");
        } else {
          toast.success("Transcript is ready for review.");
        }
      }
      await refreshTranscriptData();
    } catch (error) {
      toast.error(formatTranscriptError(error, "Upload failed."));
      await refreshTranscriptData();
    } finally {
      setUploading(false);
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function retry(transcriptId: string) {
    setProcessing(true);
    try {
      await retryTranscriptProcessing(transcriptId);
      toast.success("Transcript processing finished. Review is required.");
      await refreshTranscriptData();
    } catch (error) {
      toast.error(formatTranscriptError(error, "Retry failed."));
    } finally {
      setProcessing(false);
    }
  }

  async function confirm(transcriptId: string) {
    setConfirmingCourses(true);
    try {
      await confirmTranscriptCourses(transcriptId);
      toast.success("Confirmed courses saved for future mapping.");
      await refreshTranscriptData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to confirm courses.");
    } finally {
      setConfirmingCourses(false);
    }
  }

  async function generateMappings(transcriptId: string) {
    setMappingProcessing(true);
    try {
      const summary = await startCreditMapping(transcriptId);
      toast.success(
        summary.status === "needs_review"
          ? "Probable mappings created. Review is needed."
          : "Probable mappings created.",
      );
      await refreshTranscriptData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate mappings.");
    } finally {
      setMappingProcessing(false);
    }
  }

  async function regenerateMappings(transcriptId: string) {
    setMappingProcessing(true);
    try {
      await regenerateCreditMappings(transcriptId);
      toast.success("Probable mappings regenerated.");
      await refreshTranscriptData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to regenerate mappings.");
    } finally {
      setMappingProcessing(false);
    }
  }

  const transcript = review.data?.transcript ?? passport.data?.transcript ?? null;
  const candidates = review.data?.candidates ?? [];
  const profile = review.data?.profile ?? passport.data?.profile ?? null;
  const confirmedCourses = courses.data ?? [];
  const creditMappings = mappings.data ?? [];
  const loading = review.isLoading || passport.isLoading || courses.isLoading || mappings.isLoading;
  const error = review.error || passport.error || courses.error || mappings.error;
  const isProcessing =
    processing ||
    transcript?.ocr_status === "processing" ||
    transcript?.translation_status === "processing" ||
    transcript?.ai_extraction_status === "processing" ||
    transcript?.processing_status === "ai_extraction";
  const isConfirmed = transcript?.confirmation_status === "confirmed";
  const failedOrManual =
    transcript?.ocr_status === "manual_entry" ||
    transcript?.ocr_status === "failed" ||
    transcript?.translation_status === "manual_entry" ||
    transcript?.translation_status === "failed" ||
    transcript?.ai_extraction_status === "failed" ||
    transcript?.ai_extraction_status === "skipped" ||
    transcript?.requires_manual_entry === true;

  return (
    <PassportShell
      eyebrow="Transcript intelligence"
      title="Review every extracted course before Scholaport uses it."
      description="Upload a transcript privately, review the original text beside the English academic translation, then confirm the final course list."
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void processFile(file);
        }}
      />

      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <main className="space-y-5">
          <section className="rounded-[20px] border border-[#CDD3DE]/70 bg-white shadow-card">
            <div className="flex flex-col gap-4 border-b border-[#E8EBF0] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#0A175A]/8 text-[#0A175A]">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold">Academic transcript</h2>
                  <p className="mt-0.5 text-xs text-[#5A6380]">
                    {transcript?.original_filename ?? "PDF, JPG, PNG, or WEBP"}
                  </p>
                </div>
              </div>
              <button
                disabled={uploading || isProcessing}
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#01C3AD] px-4 text-xs font-bold text-[#060F3D] disabled:opacity-60"
              >
                {uploading || isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
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
            ) : isProcessing ? (
              <ProcessingState text={processingMessages[messageIndex]} />
            ) : !transcript ? (
              <UploadState onChoose={() => inputRef.current?.click()} />
            ) : failedOrManual && candidates.length === 0 ? (
              <FailureState transcript={transcript} onRetry={() => void retry(transcript.id)} />
            ) : (
              <ReviewState
                transcript={transcript}
                candidates={candidates}
                profileName={
                  profile
                    ? `${profile.source_curriculum} · ${profile.origin_country}`
                    : "Profile framework"
                }
                onRefresh={refreshTranscriptData}
                onConfirm={() => void confirm(transcript.id)}
                confirming={confirmingCourses}
              />
            )}
          </section>

          {transcript && (
            <ManualCourseForm transcriptId={transcript.id} onSaved={refreshTranscriptData} />
          )}

          {isConfirmed && confirmedCourses.length > 0 && (
            <ConfirmedCourses courses={confirmedCourses} />
          )}

          {isConfirmed && transcript && confirmedCourses.length > 0 && (
            <CreditMappingReview
              transcript={transcript}
              mappings={creditMappings}
              processing={mappingProcessing}
              destinationFramework={
                profile?.destination_framework_label ??
                profile?.target_state ??
                "Destination framework"
              }
              onGenerate={() => void generateMappings(transcript.id)}
              onRegenerate={() => void regenerateMappings(transcript.id)}
              onRefresh={refreshTranscriptData}
            />
          )}
        </main>

        <aside className="space-y-5">
          <section className="rounded-[20px] bg-[#0A175A] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#01C3AD]">
              Review status
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Metric value={String(candidates.length)} label="review rows" />
              <Metric value={String(confirmedCourses.length)} label="confirmed" />
              <Metric value={String(creditMappings.length)} label="mappings" />
            </div>
            <p className="mt-5 text-xs leading-5 text-white/65">
              Confirmed rows become available for future mapping only after review.
            </p>
            <Link
              to="/gaps"
              className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#01C3AD] text-sm font-bold text-[#060F3D]"
            >
              View gap analysis <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
          <InfoPanel
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Private storage"
            body="Files stay in the private transcript bucket scoped to your user ID."
          />
          <InfoPanel
            icon={<Languages className="h-5 w-5" />}
            title="Multilingual review"
            body="Tamil, Hindi, Spanish, Arabic, Urdu, Mandarin, Filipino, Bengali, Russian, Ukrainian, English, and mixed-script transcripts are routed through language detection."
          />
          {transcript?.translation_status === "needs_review" && (
            <InfoPanel
              warning
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Translation needs review"
              body="Edit the English translation before confirming. The original transcript text is preserved."
            />
          )}
        </aside>
      </div>
    </PassportShell>
  );
}

function UploadState({ onChoose }: { onChoose: () => void }) {
  return (
    <div className="grid min-h-[380px] place-items-center p-8 text-center">
      <div className="max-w-lg">
        <UploadCloud className="mx-auto h-10 w-10 text-[#01C3AD]" />
        <h3 className="mt-4 font-display text-xl font-bold">Upload your transcript</h3>
        <p className="mt-2 text-sm leading-6 text-[#5A6380]">
          Scholaport stores the original file, extracts possible course rows, translates academic
          text into English when needed, and waits for your confirmation.
        </p>
        <button
          onClick={onChoose}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0A175A] px-5 text-sm font-bold text-white"
        >
          <UploadCloud className="h-4 w-4" /> Select transcript
        </button>
      </div>
    </div>
  );
}

function ProcessingState({ text }: { text: string }) {
  return (
    <div className="grid min-h-[380px] place-items-center p-8 text-center">
      <div>
        <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#01C3AD]" />
        <h3 className="mt-4 font-display text-xl font-bold">{text}</h3>
        <p className="mt-2 text-sm text-[#5A6380]">Confirm before Scholaport uses this.</p>
      </div>
    </div>
  );
}

function friendlyStageTitle(stage?: string | null, code?: string | null) {
  if (code === "provider_not_configured") return "Provider setup missing";
  if (code === "provider_billing_unavailable") return "Provider billing or credits unavailable";
  if (code === "provider_quota_unavailable") return "Provider quota unavailable";
  if (stage === "auth") return "Authentication failed";
  if (stage === "ownership") return "Access denied";
  if (stage === "storage_download" || stage === "storage_upload") return "File retrieval failed";
  if (stage === "mime_detection") return "File type validation failed";
  if (stage === "google_request" || stage === "google_response") return "Google OCR failed";
  if (stage === "ocr_empty_response") return "OCR returned no readable text";
  if (stage === "ai_extraction" && code === "provider_not_configured") {
    return "AI extraction skipped";
  }
  if (stage === "ai_extraction") return "AI extraction failed";
  if (stage === "parser") return "Transcript parsing failed";
  if (stage === "candidate_save") return "Review row save failed";
  if (stage === "frontend_fetch") return "Frontend fetch failed";
  if (stage === "backend_request_received") return "Backend route failed";
  return "Manual entry required";
}

function formatTranscriptError(error: unknown, fallback: string) {
  if (error instanceof TranscriptApiError) {
    return `${friendlyStageTitle(error.stage, error.code)}: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function FailureState({ transcript, onRetry }: { transcript: Transcript; onRetry: () => void }) {
  const stage = transcript.processing_stage ?? transcript.ocr_error_stage;
  const stageLabel = stage ? stage.replaceAll("_", " ") : "processing";
  const code =
    transcript.processing_error_code ??
    transcript.ocr_error_code ??
    transcript.ai_extraction_error_code;
  const codeLabel = code ? ` (${code})` : "";
  const errorMessage =
    transcript.processing_error_message ||
    transcript.ocr_error_message ||
    transcript.ai_extraction_error_message ||
    transcript.ai_extraction_error ||
    transcript.ocr_error ||
    transcript.translation_error ||
    "OCR or AI extraction could not complete.";
  const title = friendlyStageTitle(transcript.ocr_error_stage ?? stage, code);
  const guidance =
    code === "provider_not_configured"
      ? "Provider setup is missing. Add the server-side API configuration, then retry live processing."
      : code === "provider_billing_unavailable"
        ? "Provider billing or credits may not be enabled. Enable billing or credits in the provider console, then retry."
        : code === "provider_quota_unavailable"
          ? "Provider quota or rate limit is blocking this request. Retry after quota is available."
          : "Retry live processing after fixing the setup, or add course rows manually.";
  return (
    <div className="grid min-h-[360px] place-items-center p-8 text-center">
      <div className="max-w-lg">
        <AlertTriangle className="mx-auto h-10 w-10 text-[#E65234]" />
        <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
        <p className="mt-2 text-xs font-bold uppercase tracking-[.14em] text-[#B45B00]">
          Failed at {stageLabel}
          {codeLabel}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#5A6380]">{errorMessage}</p>
        {transcript.ocr_raw_text && (
          <p className="mt-2 text-xs leading-5 text-[#5A6380]">
            Google OCR text was saved. You can retry extraction or enter course rows manually from
            the preserved transcript text.
          </p>
        )}
        <p className="mt-2 text-xs leading-5 text-[#5A6380]">
          Your uploaded file is still attached. {guidance}
        </p>
        <button
          onClick={onRetry}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#CDD3DE] px-4 text-xs font-bold text-[#0A175A]"
        >
          <RefreshCw className="h-4 w-4" /> Retry live processing
        </button>
      </div>
    </div>
  );
}

function ReviewState({
  transcript,
  candidates,
  profileName,
  onRefresh,
  onConfirm,
  confirming,
}: {
  transcript: Transcript;
  candidates: TranscriptCourseCandidate[];
  profileName: string;
  onRefresh: () => Promise<void>;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const mismatch = transcript.framework_match_status !== "matched_profile";
  return (
    <div className="space-y-5 p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <TextPanel
          title={`Original${transcript.primary_language_code ? ` · ${transcript.primary_language_code}` : ""}`}
          text={transcript.ocr_raw_text || "No OCR text is available. Use manual entry below."}
        />
        <TextPanel
          title="English academic translation"
          text={
            transcript.translated_text_en ||
            transcript.ocr_raw_text ||
            "Translation is not available."
          }
        />
      </div>

      <FrameworkReview
        transcript={transcript}
        profileName={profileName}
        mismatch={mismatch}
        onRefresh={onRefresh}
      />

      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Course candidates</h3>
            <p className="text-xs text-[#5A6380]">Review required before future mapping.</p>
          </div>
          <button
            disabled={!candidates.length || confirming}
            aria-busy={confirming}
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#01C3AD] px-4 text-xs font-bold text-[#060F3D] disabled:opacity-50"
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {confirming ? "Confirming…" : "Confirm final course list"}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {candidates.length ? (
            candidates.map((candidate) => (
              <CandidateEditor key={candidate.id} candidate={candidate} onRefresh={onRefresh} />
            ))
          ) : (
            <div className="rounded-[16px] border border-dashed border-[#CDD3DE] p-5 text-sm text-[#5A6380]">
              No course rows were extracted. Add courses manually below.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TextPanel({ title, text }: { title: string; text: string }) {
  return (
    <section className="min-h-[220px] rounded-[16px] border border-[#E1E5EC] bg-[#F8FAFC] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#5A6380]">{title}</p>
      <pre className="mt-3 max-h-[340px] overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[#162040]">
        {text}
      </pre>
    </section>
  );
}

function FrameworkReview({
  transcript,
  profileName,
  mismatch,
  onRefresh,
}: {
  transcript: Transcript;
  profileName: string;
  mismatch: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [choosing, setChoosing] = useState<string | null>(null);
  const detected =
    transcript.detected_source_curriculum_label ||
    transcript.detected_source_jurisdiction_label ||
    transcript.detected_source_country_label ||
    "Not detected";
  async function choose(method: "profile_default" | "ocr_detected" | "counselor_review") {
    setChoosing(method);
    try {
      if (method === "counselor_review") {
        await markTranscriptForCounselorReview(transcript.id);
      } else {
        await switchSelectedSourceFramework({ transcript_id: transcript.id, method });
      }
      await onRefresh();
      toast.success("Framework choice saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save framework choice.");
    } finally {
      setChoosing(null);
    }
  }

  return (
    <section
      className={`rounded-[16px] border p-4 ${
        mismatch ? "border-[#F0A33A] bg-[#FFF8ED]" : "border-[#CFEDE9] bg-[#F2FFFC]"
      }`}
    >
      <div className="flex items-start gap-3">
        {mismatch ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 text-[#B45B00]" />
        ) : (
          <Check className="mt-0.5 h-5 w-5 text-[#019A8A]" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {mismatch
              ? `Your profile says ${profileName}. This transcript appears to be ${detected}.`
              : "Transcript source matches your profile framework."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ChoiceButton
              onClick={() => void choose("profile_default")}
              label="Use my profile framework"
              busy={choosing === "profile_default"}
              disabled={Boolean(choosing)}
            />
            <ChoiceButton
              onClick={() => void choose("ocr_detected")}
              label="Use detected transcript framework"
              busy={choosing === "ocr_detected"}
              disabled={Boolean(choosing)}
            />
            <ChoiceButton
              onClick={() => void choose("counselor_review")}
              label="Mark for counselor review"
              busy={choosing === "counselor_review"}
              disabled={Boolean(choosing)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CandidateEditor({
  candidate,
  onRefresh,
}: {
  candidate: TranscriptCourseCandidate;
  onRefresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<TranscriptCandidatePatch>({
    id: candidate.id,
    course_name_original: candidate.course_name_original,
    course_name_translated: candidate.course_name_translated,
    subject_category: candidate.subject_category,
    grade_original: candidate.grade_original,
    max_marks: candidate.max_marks,
    credits_or_units: candidate.credits_or_units,
    term_label_original: candidate.term_label_original,
    term_label_translated: candidate.term_label_translated,
    academic_year: candidate.academic_year,
    review_reason: candidate.review_reason,
    needs_review: candidate.needs_review,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await saveEditedTranscriptCandidate(draft);
      await onRefresh();
      toast.success("Candidate saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save row.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await deleteTranscriptCandidate(candidate.id);
      await onRefresh();
      toast.success("Candidate removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete row.");
    } finally {
      setDeleting(false);
    }
  }

  const update = (key: keyof TranscriptCandidatePatch, value: string | boolean | null) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <article className="rounded-[16px] border border-[#E1E5EC] bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field
          label="Original course"
          value={draft.course_name_original ?? ""}
          onChange={(value) => update("course_name_original", value)}
        />
        <Field
          label="English translation"
          value={draft.course_name_translated ?? ""}
          onChange={(value) => update("course_name_translated", value || null)}
        />
        <Field
          label="Subject category"
          value={draft.subject_category ?? ""}
          onChange={(value) => update("subject_category", value || null)}
        />
        <Field
          label="Grade or marks"
          value={draft.grade_original ?? ""}
          onChange={(value) => update("grade_original", value || null)}
        />
        <Field
          label="Max marks or scale"
          value={draft.max_marks ?? ""}
          onChange={(value) => update("max_marks", value || null)}
        />
        <Field
          label="Credits or units"
          value={draft.credits_or_units ?? ""}
          onChange={(value) => update("credits_or_units", value || null)}
        />
        <Field
          label="Term or year"
          value={draft.term_label_original ?? draft.academic_year ?? ""}
          onChange={(value) => update("term_label_original", value || null)}
        />
        <Field
          label="Review reason"
          value={draft.review_reason ?? ""}
          onChange={(value) => update("review_reason", value || null)}
        />
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#5A6380]">
          OCR {confidence(candidate.extraction_confidence)} · Translation{" "}
          {confidence(candidate.translation_confidence)} · {candidate.entry_method}
        </p>
        <div className="flex gap-2">
          <button
            disabled={deleting || saving}
            aria-busy={deleting}
            onClick={() => void remove()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#F2CAC1] px-3 text-xs font-bold text-[#B8432E] disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button
            disabled={saving}
            aria-busy={saving}
            onClick={() => void save()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#0A175A] px-3 text-xs font-bold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save row
          </button>
        </div>
      </div>
    </article>
  );
}

function ManualCourseForm({
  transcriptId,
  onSaved,
}: {
  transcriptId: string;
  onSaved: () => Promise<void>;
}) {
  const [course, setCourse] = useState("");
  const [translation, setTranslation] = useState("");
  const [grade, setGrade] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!course.trim()) return toast.error("Enter the course name exactly as shown.");
    setSaving(true);
    try {
      await addManualTranscriptCourse({
        transcript_id: transcriptId,
        course_name_original: course.trim(),
        course_name_translated: translation.trim() || null,
        subject_category: category.trim() || null,
        grade_original: grade.trim() || null,
      });
      setCourse("");
      setTranslation("");
      setGrade("");
      setCategory("");
      await onSaved();
      toast.success("Manual course added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add course.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[20px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Plus className="h-5 w-5 text-[#019A8A]" />
        <h3 className="font-display text-lg font-bold">Manual fallback</h3>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Field label="Original course name" value={course} onChange={setCourse} />
        <Field label="English translation" value={translation} onChange={setTranslation} />
        <Field label="Subject category" value={category} onChange={setCategory} />
        <Field label="Grade or marks" value={grade} onChange={setGrade} />
      </div>
      <button
        disabled={saving}
        onClick={() => void add()}
        className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0A175A] px-4 text-xs font-bold text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add manual row
      </button>
    </section>
  );
}

function ConfirmedCourses({
  courses,
}: {
  courses: Array<{
    id: string;
    course_name_original: string;
    course_name_translated?: string | null;
    grade_original?: string | null;
  }>;
}) {
  return (
    <section className="rounded-[20px] border border-[#CFEDE9] bg-[#F2FFFC] p-5">
      <h3 className="font-display text-lg font-bold">Confirmed transcript courses</h3>
      <div className="mt-3 divide-y divide-[#D9F2EE]">
        {courses.map((course) => (
          <div key={course.id} className="py-3 text-sm">
            <p className="font-bold">
              {course.course_name_translated || course.course_name_original}
            </p>
            <p className="mt-1 text-xs text-[#5A6380]">
              {course.course_name_original} · {course.grade_original ?? "Grade not recorded"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CreditMappingReview({
  transcript,
  mappings,
  processing,
  destinationFramework,
  onGenerate,
  onRegenerate,
  onRefresh,
}: {
  transcript: Transcript;
  mappings: CreditMapping[];
  processing: boolean;
  destinationFramework: string;
  onGenerate: () => void;
  onRegenerate: () => void;
  onRefresh: () => Promise<void>;
}) {
  return (
    <section className="rounded-[20px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#5A6380]">
            Scholaport preview
          </p>
          <h3 className="mt-1 font-display text-lg font-bold">Probable credit map</h3>
          <p className="mt-1 text-xs leading-5 text-[#5A6380]">
            Destination: {destinationFramework}. Final credit decisions are made by your school.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={processing}
            onClick={mappings.length ? onRegenerate : onGenerate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0A175A] px-4 text-xs font-bold text-white disabled:opacity-60"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {mappings.length ? "Regenerate" : "Generate probable credit map"}
          </button>
        </div>
      </div>

      {!mappings.length ? (
        <div className="mt-4 rounded-[16px] border border-dashed border-[#CDD3DE] p-5 text-sm leading-6 text-[#5A6380]">
          Confirmed courses are ready. Generate probable mappings after the destination framework is
          selected and reviewed.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {mappings.map((mapping) => (
            <CreditMappingEditor
              key={mapping.id}
              mapping={mapping}
              transcriptId={transcript.id}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CreditMappingEditor({
  mapping,
  onRefresh,
}: {
  mapping: CreditMapping;
  transcriptId: string;
  onRefresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    mapped_subject_category:
      mapping.mapped_subject_category ?? mapping.target_subject_category ?? "",
    probable_destination_equivalent:
      mapping.probable_destination_equivalent ?? mapping.probable_us_equivalent ?? "",
    requirement_bucket: mapping.requirement_bucket ?? "",
    possible_credit_value: String(mapping.possible_credit_value ?? mapping.credits_mapped ?? ""),
    mapping_confidence: mapping.mapping_confidence ?? mapping.confidence ?? "unclear",
    review_reason: mapping.review_reason ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateCreditMapping({
        id: mapping.id,
        mapped_subject_category: draft.mapped_subject_category,
        probable_destination_equivalent: draft.probable_destination_equivalent,
        requirement_bucket: draft.requirement_bucket || null,
        possible_credit_value: draft.possible_credit_value
          ? Number(draft.possible_credit_value)
          : null,
        mapping_confidence: draft.mapping_confidence,
        review_reason: draft.review_reason || null,
        counselor_review_required: ["low", "unclear"].includes(draft.mapping_confidence),
      });
      await onRefresh();
      toast.success("Probable mapping saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save mapping.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(action: "confirm" | "reject" | "review") {
    try {
      if (action === "confirm") await confirmCreditMapping(mapping.id);
      if (action === "reject") await rejectCreditMapping(mapping.id);
      if (action === "review") await markCreditMappingForCounselorReview(mapping.id);
      await onRefresh();
      toast.success("Mapping review updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update mapping.");
    }
  }

  const confidenceValue = mapping.mapping_confidence ?? mapping.confidence ?? "unclear";
  const reviewNeeded = mapping.counselor_review_required ?? mapping.needs_counselor_review ?? true;

  return (
    <article className="rounded-[16px] border border-[#E1E5EC] bg-[#F8FAFC] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold">
            {mapping.translated_course_name ||
              mapping.original_course_name ||
              mapping.probable_destination_equivalent ||
              "Transcript course"}
          </p>
          <p className="mt-1 text-xs text-[#5A6380]">
            {mapping.original_course_name ?? "Original course preserved"} ·{" "}
            {mapping.mapping_method ?? "mapping method pending"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            tone={
              confidenceValue === "high" ? "good" : confidenceValue === "medium" ? "warn" : "bad"
            }
          >
            {confidenceValue} confidence
          </Badge>
          {reviewNeeded && <Badge tone="bad">Needs counselor review</Badge>}
          <Badge
            tone={
              (mapping.mapping_status ?? mapping.status) === "student_confirmed"
                ? "good"
                : "neutral"
            }
          >
            {mapping.mapping_status ?? mapping.status ?? "candidate"}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Field
          label="Likely category"
          value={draft.mapped_subject_category}
          onChange={(value) =>
            setDraft((current) => ({ ...current, mapped_subject_category: value }))
          }
        />
        <Field
          label="Probable U.S. equivalent"
          value={draft.probable_destination_equivalent}
          onChange={(value) =>
            setDraft((current) => ({ ...current, probable_destination_equivalent: value }))
          }
        />
        <Field
          label="Requirement bucket"
          value={draft.requirement_bucket}
          onChange={(value) => setDraft((current) => ({ ...current, requirement_bucket: value }))}
        />
        <Field
          label="Possible credit"
          value={draft.possible_credit_value}
          onChange={(value) =>
            setDraft((current) => ({ ...current, possible_credit_value: value }))
          }
        />
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#6A7288]">
            Confidence
          </span>
          <select
            value={draft.mapping_confidence}
            onChange={(event) =>
              setDraft((current) => ({ ...current, mapping_confidence: event.target.value }))
            }
            className="mt-1 h-10 w-full rounded-xl border border-[#CDD3DE] bg-white px-3 text-sm outline-none focus:border-[#01C3AD]"
          >
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
            <option value="unclear">unclear</option>
          </select>
        </label>
      </div>

      <div className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-[#5A6380]">
        <p>{mapping.evidence_summary ?? mapping.mapping_reason ?? "Evidence summary pending."}</p>
        {(mapping.review_reason || draft.review_reason) && (
          <p className="mt-1 font-bold text-[#B45B00]">
            {draft.review_reason || mapping.review_reason}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          disabled={saving}
          onClick={() => void save()}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#CDD3DE] bg-white px-3 text-xs font-bold text-[#0A175A]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save edit
        </button>
        <button
          onClick={() => void setStatus("review")}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-[#F0A33A] bg-white px-3 text-xs font-bold text-[#B45B00]"
        >
          Counselor review
        </button>
        <button
          onClick={() => void setStatus("reject")}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-[#F2CAC1] bg-white px-3 text-xs font-bold text-[#B8432E]"
        >
          Reject
        </button>
        <button
          onClick={() => void setStatus("confirm")}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#01C3AD] px-3 text-xs font-bold text-[#060F3D]"
        >
          <Check className="h-4 w-4" /> Confirm preview
        </button>
      </div>
    </article>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "good" | "warn" | "bad" | "neutral";
}) {
  const className =
    tone === "good"
      ? "bg-[#E5FAF6] text-[#017F72]"
      : tone === "warn"
        ? "bg-[#FFF5E5] text-[#9A5A00]"
        : tone === "bad"
          ? "bg-[#FDEDEA] text-[#B8432E]"
          : "bg-[#EEF2F7] text-[#5A6380]";
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-[10px] font-bold ${className}`}
    >
      {children}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#6A7288]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-xl border border-[#CDD3DE] bg-white px-3 text-sm outline-none focus:border-[#01C3AD]"
      />
    </label>
  );
}

function ChoiceButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-9 items-center justify-center rounded-xl border border-[#CDD3DE] bg-white px-3 text-xs font-bold text-[#0A175A]"
    >
      {label}
    </button>
  );
}

function InfoPanel({
  icon,
  title,
  body,
  warning = false,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  warning?: boolean;
}) {
  return (
    <section
      className={`rounded-[20px] border p-5 ${
        warning ? "border-[#F0A33A] bg-[#FFF8ED]" : "border-[#CDD3DE]/70 bg-white"
      }`}
    >
      <div className="flex gap-3">
        <span className={warning ? "text-[#B45B00]" : "text-[#019A8A]"}>{icon}</span>
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#5A6380]">{body}</p>
        </div>
      </div>
    </section>
  );
}

function Status({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <div className={`p-10 text-center text-sm ${error ? "text-[#E65234]" : "text-[#5A6380]"}`}>
      {text}
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

function confidence(value?: number | null) {
  if (value == null) return "unknown";
  if (value >= 0.9) return "high";
  if (value >= 0.75) return "medium";
  return "low";
}
