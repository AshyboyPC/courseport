import { packetSafeCopy } from "./packet-safe-copy.ts";
import { renderPacketHtml } from "./packet-html-renderer.server.ts";
import { renderPacketPdfUnavailableReason } from "./packet-pdf-renderer.server.ts";
import { packetStorageUnavailableReason } from "./packet-storage.server.ts";
import {
  buildPacketSections,
  collectCounselorQuestions,
  collectReviewWarnings,
  missingSourceWarnings,
} from "./packet-sections.server.ts";
import type {
  BuiltCounselorPacket,
  CounselorPacketSnapshot,
  PacketAssemblyContext,
} from "./types.ts";

export const PACKET_VERSION = "2026.06.mvp";

export const PACKET_DISCLAIMER =
  "This Scholaport packet is a planning preview based on student-confirmed transcript data, probable credit mappings, and available destination graduation requirements. It is not an official transcript evaluation. Final credit, placement, testing, and graduation decisions are made by the receiving school or district.";

function studentName(profile: Record<string, unknown>) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Student";
}

function summaryText(context: PacketAssemblyContext) {
  const missing = context.gapAnalysis.missing_requirement_count;
  const review = context.gapAnalysis.counselor_review_requirement_count;
  return `Scholaport assembled this packet from confirmed transcript courses, probable credit mappings, saved gap analysis, and saved roadmap items for ${studentName(context.profile)}. Missing requirement count: ${missing ?? "not recorded"}. Counselor-review count: ${review ?? "not recorded"}.`;
}

export function buildCounselorPacketSnapshot(context: PacketAssemblyContext): BuiltCounselorPacket {
  const pdfError = renderPacketPdfUnavailableReason();
  const storageWarning = packetStorageUnavailableReason();
  const sourceWarnings = missingSourceWarnings(context);
  const sections = buildPacketSections({
    context,
    missingSourceWarnings: sourceWarnings,
    pdfError,
    storageWarning,
  });
  const warnings = collectReviewWarnings({
    context,
    sourceWarnings,
    pdfError,
    storageWarning,
  });
  const snapshot: CounselorPacketSnapshot = {
    packetVersion: PACKET_VERSION,
    generatedAt: context.generatedAt,
    title: `Counselor-ready Scholaport packet for ${studentName(context.profile)}`,
    status: warnings.length ? "needs_review" : "html_ready",
    disclaimerText: PACKET_DISCLAIMER,
    summaryText: summaryText(context),
    profile: packetSafeCopy(context.profile) ?? {},
    transcript: packetSafeCopy(context.transcript) ?? {},
    sections,
    includedSections: sections
      .filter((section) => section.status !== "missing_data")
      .map((section) => ({ key: section.key, title: section.title })),
    missingSections: sections
      .filter((section) => section.status === "missing_data")
      .map((section) => ({
        key: section.key,
        title: section.title,
        reason: section.missingReason || "Required data was not available.",
      })),
    warnings,
    counselorQuestions: collectCounselorQuestions(context),
    sourceSummary: context.sourceSummary,
  };
  return {
    snapshot,
    sections,
    printableHtml: renderPacketHtml(snapshot),
    status: snapshot.status,
  };
}
