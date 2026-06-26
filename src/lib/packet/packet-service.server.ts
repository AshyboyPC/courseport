import { buildCounselorPacket } from "./packet-builder.server.ts";
import { renderPacketPdfUnavailableReason } from "./packet-pdf-renderer.server.ts";
import { PACKET_DISCLAIMER, PACKET_VERSION } from "./packet-snapshot.ts";
import { loadPacketSourceSummary } from "./packet-sources.ts";
import type { PacketAssemblyContext } from "./types.ts";

type QueryResult<T> = { data: T | null; error: { message: string } | null };
type QueryListResult<T> = { data: T[] | null; error: { message: string } | null };
type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

async function single<T>(query: PromiseLike<QueryResult<T>>) {
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function many<T>(query: PromiseLike<QueryListResult<T>>) {
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

function latestConfirmedTranscriptQuery(supabase: SupabaseLike, userId: string) {
  return supabase
    .from("transcripts")
    .select("*")
    .eq("user_id", userId)
    .eq("confirmation_status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

async function loadTranscript(input: {
  supabase: SupabaseLike;
  userId: string;
  transcriptId?: string;
}) {
  if (input.transcriptId) {
    return single<Record<string, unknown>>(
      input.supabase
        .from("transcripts")
        .select("*")
        .eq("id", input.transcriptId)
        .eq("user_id", input.userId)
        .maybeSingle(),
    );
  }
  return single<Record<string, unknown>>(
    latestConfirmedTranscriptQuery(input.supabase, input.userId),
  );
}

async function loadGapAnalysis(input: {
  supabase: SupabaseLike;
  userId: string;
  transcriptId: string;
  gapAnalysisId?: string;
}) {
  if (input.gapAnalysisId) {
    return single<Record<string, unknown>>(
      input.supabase
        .from("gap_analyses")
        .select("*")
        .eq("id", input.gapAnalysisId)
        .eq("user_id", input.userId)
        .eq("transcript_id", input.transcriptId)
        .maybeSingle(),
    );
  }
  return single<Record<string, unknown>>(
    input.supabase
      .from("gap_analyses")
      .select("*")
      .eq("user_id", input.userId)
      .eq("transcript_id", input.transcriptId)
      .in("status", ["completed", "needs_review"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

async function loadRoadmap(input: {
  supabase: SupabaseLike;
  userId: string;
  transcriptId: string;
  gapAnalysisId: string;
  roadmapId?: string;
}) {
  if (input.roadmapId) {
    return single<Record<string, unknown>>(
      input.supabase
        .from("roadmaps")
        .select("*")
        .eq("id", input.roadmapId)
        .eq("user_id", input.userId)
        .eq("transcript_id", input.transcriptId)
        .maybeSingle(),
    );
  }
  return single<Record<string, unknown>>(
    input.supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", input.userId)
      .eq("transcript_id", input.transcriptId)
      .eq("gap_analysis_id", input.gapAnalysisId)
      .in("status", ["active", "needs_review", "completed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

async function latestMappingRun(input: {
  supabase: SupabaseLike;
  userId: string;
  transcriptId: string;
}) {
  return single<Record<string, unknown>>(
    input.supabase
      .from("credit_mapping_runs")
      .select("*")
      .eq("user_id", input.userId)
      .eq("transcript_id", input.transcriptId)
      .in("status", ["completed", "needs_review"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

function requirementIds(requirements: Record<string, unknown>[]) {
  return requirements.map((requirement) => String(requirement.id ?? "")).filter(Boolean);
}

export async function generateCounselorPacket({
  supabase,
  userId,
  transcriptId,
  gapAnalysisId,
  roadmapId,
}: {
  supabase: SupabaseLike;
  userId: string;
  transcriptId?: string;
  gapAnalysisId?: string;
  roadmapId?: string;
}) {
  const profile = await single<Record<string, unknown>>(
    supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle(),
  );
  if (!profile) throw new Error("Complete onboarding before generating a counselor packet.");

  const transcript = await loadTranscript({ supabase, userId, transcriptId });
  if (!transcript) throw new Error("Upload and confirm your transcript first.");
  if (transcript.confirmation_status !== "confirmed") {
    throw new Error("Review and confirm your extracted courses first.");
  }
  const resolvedTranscriptId = String(transcript.id);

  const [transcriptCourses, creditMappings, mappingRun] = await Promise.all([
    many<Record<string, unknown>>(
      supabase
        .from("transcript_courses")
        .select("*")
        .eq("user_id", userId)
        .eq("transcript_id", resolvedTranscriptId)
        .eq("student_confirmed", true)
        .order("created_at"),
    ),
    many<Record<string, unknown>>(
      supabase
        .from("credit_mappings")
        .select("*")
        .eq("user_id", userId)
        .eq("transcript_id", resolvedTranscriptId)
        .neq("mapping_status", "replaced")
        .order("created_at"),
    ),
    latestMappingRun({ supabase, userId, transcriptId: resolvedTranscriptId }),
  ]);
  if (!transcriptCourses.length) {
    throw new Error("Review and confirm your extracted courses first.");
  }
  if (!creditMappings.length) throw new Error("Generate probable credit mapping first.");

  const gapAnalysis = await loadGapAnalysis({
    supabase,
    userId,
    transcriptId: resolvedTranscriptId,
    gapAnalysisId,
  });
  if (!gapAnalysis) throw new Error("Run graduation gap analysis first.");
  const gapRequirements = await many<Record<string, unknown>>(
    supabase
      .from("gap_requirements")
      .select("*")
      .eq("user_id", userId)
      .eq("gap_analysis_id", gapAnalysis.id)
      .order("display_order"),
  );
  if (!gapRequirements.length) throw new Error("Run graduation gap analysis first.");

  const roadmap = await loadRoadmap({
    supabase,
    userId,
    transcriptId: resolvedTranscriptId,
    gapAnalysisId: String(gapAnalysis.id),
    roadmapId,
  });
  if (!roadmap) throw new Error("Generate academic roadmap first.");
  const roadmapItems = await many<Record<string, unknown>>(
    supabase
      .from("roadmap_items")
      .select("*")
      .eq("user_id", userId)
      .eq("roadmap_id", roadmap.id)
      .order("display_order"),
  );
  if (!roadmapItems.length) throw new Error("Generate academic roadmap first.");

  const frameworkId = String(
    gapAnalysis.destination_framework_id ??
      roadmap.destination_framework_id ??
      profile.destination_framework_id ??
      "",
  );
  if (!frameworkId) throw new Error("Destination graduation framework is still being verified.");

  const [destinationFramework, graduationRequirements] = await Promise.all([
    single<Record<string, unknown>>(
      supabase
        .from("destination_graduation_frameworks")
        .select("*")
        .eq("id", frameworkId)
        .maybeSingle(),
    ),
    many<Record<string, unknown>>(
      supabase
        .from("graduation_requirements")
        .select("*")
        .eq("framework_id", frameworkId)
        .order("subject_category"),
    ),
  ]);
  if (!destinationFramework) {
    throw new Error("Destination graduation framework is still being verified.");
  }

  const sourceSummary = await loadPacketSourceSummary({
    supabase,
    frameworkId,
    requirementIds: requirementIds(graduationRequirements),
  });
  const generatedAt = new Date().toISOString();
  const context: PacketAssemblyContext = {
    userId,
    profile,
    transcript,
    transcriptCourses,
    mappingRun,
    creditMappings,
    gapAnalysis,
    gapRequirements,
    roadmap,
    roadmapItems,
    destinationFramework,
    graduationRequirements,
    sourceSummary,
    generatedAt,
  };
  const built = buildCounselorPacket(context);

  await supabase
    .from("counselor_packets")
    .update({
      status: "stale",
      stale_reason: "new packet generated",
      updated_at: generatedAt,
    })
    .eq("user_id", userId)
    .eq("transcript_id", resolvedTranscriptId)
    .in("status", ["ready", "needs_review", "html_ready", "pdf_ready"]);

  const packetInsert = await supabase
    .from("counselor_packets")
    .insert({
      user_id: userId,
      student_profile_id: profile.id,
      transcript_id: resolvedTranscriptId,
      credit_mapping_run_id: mappingRun?.id ?? null,
      gap_analysis_id: gapAnalysis.id,
      roadmap_id: roadmap.id,
      destination_country_id: profile.destination_country_id ?? null,
      destination_jurisdiction_id: profile.destination_jurisdiction_id ?? null,
      destination_framework_id: frameworkId,
      status: built.status,
      packet_type: "counselor_review_packet",
      packet_version: PACKET_VERSION,
      title: built.snapshot.title,
      summary_text: built.snapshot.summaryText,
      disclaimer_text: PACKET_DISCLAIMER,
      packet_snapshot_json: built.snapshot,
      included_sections: built.snapshot.includedSections.map((section) => section.key),
      included_sections_json: built.snapshot.includedSections,
      missing_sections_json: built.snapshot.missingSections,
      warnings_json: built.snapshot.warnings,
      counselor_questions_json: built.snapshot.counselorQuestions,
      source_summary_json: built.snapshot.sourceSummary,
      generated_file_storage_path: null,
      generated_file_mime_type: null,
      generated_file_size_bytes: null,
      generated_file_hash: null,
      printable_html_storage_path: null,
      pdf_generation_error: renderPacketPdfUnavailableReason(),
      generated_at: generatedAt,
      completed_at: generatedAt,
    })
    .select("*")
    .single();
  if (packetInsert.error) throw new Error(packetInsert.error.message);
  const packet = packetInsert.data as Record<string, unknown>;

  const sectionRows = built.sections.map((section) => ({
    packet_id: packet.id,
    user_id: userId,
    section_key: section.key,
    section_title: section.title,
    section_order: section.order,
    section_status: section.status,
    section_snapshot_json: section,
    missing_reason: section.missingReason ?? null,
    warnings_json: section.warnings,
  }));
  if (sectionRows.length) {
    const sectionInsert = await supabase.from("counselor_packet_sections").insert(sectionRows);
    if (sectionInsert.error) throw new Error(sectionInsert.error.message);
  }
  return {
    packet,
    sections: sectionRows,
    snapshot: built.snapshot,
    printableHtml: built.printableHtml,
  };
}

export async function getPacketDownloadUrl({
  supabase,
  userId,
  packetId,
}: {
  supabase: SupabaseLike;
  userId: string;
  packetId: string;
}) {
  const packet = await single<Record<string, unknown>>(
    supabase
      .from("counselor_packets")
      .select("id,user_id,generated_file_storage_path")
      .eq("id", packetId)
      .eq("user_id", userId)
      .maybeSingle(),
  );
  if (!packet) throw new Error("Packet was not found for this user.");
  if (!packet.generated_file_storage_path) {
    throw new Error("No generated packet file is stored yet. Use the printable preview.");
  }
  throw new Error("Signed packet download URLs are not configured in this runtime.");
}
