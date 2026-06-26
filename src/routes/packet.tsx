import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { PassportShell, StatusPill } from "@/components/PassportShell";
import {
  generateCounselorPacket,
  getCounselorPacketDownloadUrl,
  getLatestCounselorPacket,
  regenerateCounselorPacket,
  type CounselorPacketPayload,
} from "@/lib/scholaport-api";

type PacketSectionSnapshot = {
  key: string;
  title: string;
  order: number;
  status: string;
  data: unknown;
  missingReason?: string | null;
  warnings?: string[];
};

type PacketSnapshot = {
  title?: string;
  generatedAt?: string;
  disclaimerText?: string;
  summaryText?: string;
  sections?: PacketSectionSnapshot[];
  warnings?: string[];
  counselorQuestions?: string[];
};

export const Route = createFileRoute("/packet")({
  head: () => ({ meta: [{ title: "Counselor Packet · Scholaport" }] }),
  component: PacketPage,
});

function PacketPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["counselor-packet"], queryFn: getLatestCounselorPacket });
  const generateMutation = useMutation({
    mutationFn: (regenerate: boolean) => {
      const transcriptId = query.data?.transcript?.id;
      const gapAnalysisId = query.data?.gapAnalysis?.id;
      const roadmapId = query.data?.roadmap?.id;
      return regenerate
        ? regenerateCounselorPacket({ transcriptId, gapAnalysisId, roadmapId })
        : generateCounselorPacket({ transcriptId, gapAnalysisId, roadmapId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["counselor-packet"] });
      await queryClient.invalidateQueries({ queryKey: ["passport-summary"] });
    },
  });

  async function runPacket(regenerate = false) {
    try {
      await generateMutation.mutateAsync(regenerate);
      toast.success(regenerate ? "Counselor packet regenerated." : "Counselor packet generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate packet.");
    }
  }

  const blocked = query.data ? getBlockedState(query.data) : null;

  return (
    <PassportShell
      eyebrow="Counselor-ready packet"
      title="A printable counselor preview from your saved Scholaport workflow."
      description="This packet summarizes saved profile, transcript, mapping, gap, and roadmap records. Final decisions are made by the school or counselor."
    >
      {query.isLoading ? (
        <State text="Loading saved packet data…" />
      ) : query.error ? (
        <State
          error
          text={query.error instanceof Error ? query.error.message : "Unable to load packet."}
        />
      ) : blocked ? (
        <PrerequisiteState state={blocked} />
      ) : !query.data?.packet ? (
        <ActionState
          title="Generate counselor packet"
          body="Your saved transcript, mappings, gap analysis, and roadmap are ready to assemble into a packet preview."
          button="Generate counselor packet"
          processing={generateMutation.isPending}
          onClick={() => void runPacket(false)}
        />
      ) : (
        <PacketPreview
          data={query.data}
          processing={generateMutation.isPending}
          onRegenerate={() => void runPacket(true)}
        />
      )}
    </PassportShell>
  );
}

function getBlockedState(data: CounselorPacketPayload) {
  if (!data.profile) {
    return {
      title: "Complete onboarding first.",
      body: "The packet needs a saved student profile and destination framework.",
      action: "Start onboarding",
      to: "/onboarding" as const,
    };
  }
  if (!data.transcript) {
    return {
      title: "Upload and confirm your transcript first.",
      body: "Counselor packets start with a confirmed transcript course list.",
      action: "Go to transcript",
      to: "/transcript" as const,
    };
  }
  if (data.transcript.confirmation_status !== "confirmed" || !data.transcriptCourses.length) {
    return {
      title: "Review and confirm your extracted courses first.",
      body: "Unconfirmed OCR or translation rows are not included as main packet courses.",
      action: "Review transcript",
      to: "/transcript" as const,
    };
  }
  if (!data.creditMappings.length) {
    return {
      title: "Generate probable credit mapping first.",
      body: "The packet needs saved probable mapping rows with confidence and review flags.",
      action: "Open mapping review",
      to: "/transcript" as const,
    };
  }
  if (!data.gapAnalysis || !data.gapRequirements.length) {
    return {
      title: "Run graduation gap analysis first.",
      body: "The packet needs saved gap summary and requirement checklist rows.",
      action: "Open gap analysis",
      to: "/gaps" as const,
    };
  }
  if (!data.roadmap || !data.roadmapItems.length) {
    return {
      title: "Generate academic roadmap first.",
      body: "The packet includes saved roadmap tasks and counselor meeting questions.",
      action: "Open roadmap",
      to: "/roadmap" as const,
    };
  }
  return null;
}

function PacketPreview({
  data,
  processing,
  onRegenerate,
}: {
  data: CounselorPacketPayload;
  processing: boolean;
  onRegenerate: () => void;
}) {
  const packet = data.packet;
  const snapshot = (packet?.packet_snapshot_json ?? {}) as PacketSnapshot;
  const sections = snapshot.sections ?? [];
  const stale = packet?.status === "stale";

  async function downloadStoredFile() {
    if (!packet) return;
    try {
      await getCounselorPacketDownloadUrl(packet.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No packet download is available.");
    }
  }

  async function copyQuestions() {
    const text = (snapshot.counselorQuestions ?? []).join("\n");
    if (!text) {
      toast.error("No counselor questions were saved for this packet.");
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("Counselor questions copied.");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-5">
        {stale && (
          <section className="rounded-[18px] border border-[#F0A33A] bg-[#FFF8ED] p-4 text-xs leading-5 text-[#8A4D00]">
            This packet may be outdated because your transcript, credit map, gap analysis, roadmap,
            or profile changed. Regenerate it before sharing it with a counselor.
            {packet?.stale_reason ? ` Reason: ${packet.stale_reason}.` : ""}
          </section>
        )}
        <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-bold">Packet status</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill tone={packet?.status === "stale" ? "coral" : "teal"}>
              {labelize(packet?.status ?? "not ready")}
            </StatusPill>
            {packet?.pdf_generation_error && <StatusPill tone="gray">Printable HTML</StatusPill>}
          </div>
          <p className="mt-3 text-xs leading-5 text-[#5A6380]">
            Generated{" "}
            {packet?.generated_at ? new Date(packet.generated_at).toLocaleString() : "recently"}.
            Raw private storage paths are not shown here.
          </p>
          {packet?.pdf_generation_error && (
            <p className="mt-3 rounded-xl bg-[#FFF8ED] p-3 text-xs leading-5 text-[#8A4D00]">
              {packet.pdf_generation_error}
            </p>
          )}
        </section>
        <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-bold">Controls</h2>
          <div className="mt-4 grid gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0A175A] text-xs font-bold text-white"
            >
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </button>
            <button
              disabled={processing}
              onClick={onRegenerate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CDD3DE] bg-white text-xs font-bold text-[#0A175A] disabled:opacity-60"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerate
            </button>
            <button
              onClick={downloadStoredFile}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CDD3DE] bg-white text-xs font-bold text-[#0A175A]"
            >
              <Download className="h-4 w-4" /> Download stored file
            </button>
            <button
              onClick={() => void copyQuestions()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CDD3DE] bg-white text-xs font-bold text-[#0A175A]"
            >
              <ClipboardList className="h-4 w-4" /> Copy questions
            </button>
          </div>
        </section>
        <section className="rounded-[20px] bg-[#0A175A] p-5 text-white">
          <div className="flex gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-[#01C3AD]" />
            <p className="text-xs leading-5 text-white/70">
              This packet is not sent to a school automatically. Share it only when you choose.
            </p>
          </div>
        </section>
      </aside>

      <section className="rounded-[24px] border border-[#CDD3DE]/70 bg-[#E8EBF0] p-3 shadow-card sm:p-6">
        <div className="mx-auto min-h-[900px] max-w-[840px] bg-white p-7 shadow-[0_14px_40px_rgba(10,23,90,.14)] sm:p-10 print:max-w-none print:shadow-none">
          <header className="border-b-4 border-[#0A175A] pb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#019A8A]">
              Scholaport preview
            </p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-[-0.04em]">
              {snapshot.title || packet?.title || "Counselor packet"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#5A6380]">
              {snapshot.summaryText || packet?.summary_text}
            </p>
            {snapshot.disclaimerText && (
              <p className="mt-4 rounded-xl bg-[#FFF8ED] p-4 text-xs leading-5 text-[#8A4D00]">
                {snapshot.disclaimerText}
              </p>
            )}
          </header>
          <div className="mt-7 space-y-7">
            {sections.length ? (
              sections.map((section) => <PacketSection key={section.key} section={section} />)
            ) : (
              <p className="rounded-xl bg-[#F6F8FB] p-4 text-sm text-[#5A6380]">
                The saved packet record does not contain preview sections. Regenerate the packet.
              </p>
            )}
          </div>
          <footer className="mt-10 border-t border-[#CDD3DE] pt-4 text-[10px] leading-5 text-[#9AA3B2]">
            Packet ID: {packet?.id}. This packet summarizes student-confirmed and system-generated
            planning information.
          </footer>
        </div>
      </section>
    </div>
  );
}

function PacketSection({ section }: { section: PacketSectionSnapshot }) {
  return (
    <section className="break-inside-avoid">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#0A175A] text-[10px] font-black text-white">
          {section.order}
        </span>
        <h2 className="font-display text-lg font-bold">{section.title}</h2>
        <StatusPill
          tone={
            section.status === "included"
              ? "teal"
              : section.status === "needs_review"
                ? "coral"
                : "gray"
          }
        >
          {labelize(section.status)}
        </StatusPill>
      </div>
      {section.missingReason ? (
        <p className="rounded-xl bg-[#FFF8ED] p-4 text-xs leading-5 text-[#8A4D00]">
          {section.missingReason}
        </p>
      ) : (
        <ValueRenderer value={section.data} />
      )}
      {!!section.warnings?.length && (
        <div className="mt-3 space-y-2">
          {section.warnings.map((warning) => (
            <p
              key={warning}
              className="rounded-xl bg-[#FFF8ED] p-3 text-xs leading-5 text-[#8A4D00]"
            >
              {warning}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

function ValueRenderer({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-xs text-[#9AA3B2]">Not recorded</span>;
  }
  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-xs text-[#9AA3B2]">None recorded</span>;
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="rounded-xl border border-[#E8EBF0] p-3">
            <ValueRenderer value={item} />
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "object") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(value as Record<string, unknown>).map(([key, entry]) => (
          <div key={key} className="rounded-xl border border-[#E8EBF0] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9AA3B2]">
              {labelize(key)}
            </p>
            <div className="mt-1 text-xs leading-5 text-[#5A6380]">
              <ValueRenderer value={entry} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

function PrerequisiteState({
  state,
}: {
  state: {
    title: string;
    body: string;
    action: string;
    to: "/onboarding" | "/transcript" | "/gaps" | "/roadmap";
  };
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

function State({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <section
      className={`rounded-[24px] border p-8 text-center shadow-card ${error ? "border-[#F86746]/40 bg-[#F86746]/10 text-[#E65234]" : "border-[#CDD3DE]/70 bg-white text-[#5A6380]"}`}
    >
      <p className="text-sm font-bold">{text}</p>
    </section>
  );
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}
