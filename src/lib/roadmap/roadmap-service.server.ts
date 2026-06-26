import { generateRoadmapFromGapAnalysis } from "./roadmap-generator.server.ts";
import { roadmapSafeSnapshot } from "./roadmap-safe-copy.ts";
import type { GeneratedRoadmapItem } from "./types.ts";

type QueryResult<T> = { data: T | null; error: { message: string } | null };
type QueryListResult<T> = { data: T[] | null; error: { message: string } | null };
type SupabaseLike = {
  // Broad enough for the real Supabase client and small test doubles.
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

function latestCompletedGapQuery(
  supabase: SupabaseLike,
  userId: string,
  transcriptId?: string | null,
) {
  let query = supabase
    .from("gap_analyses")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["completed", "needs_review"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (transcriptId) query = query.eq("transcript_id", transcriptId);
  return query.maybeSingle();
}

async function loadGapAnalysis(input: {
  supabase: SupabaseLike;
  userId: string;
  gapAnalysisId?: string;
  transcriptId?: string;
}) {
  if (input.gapAnalysisId) {
    return single<Record<string, unknown>>(
      input.supabase
        .from("gap_analyses")
        .select("*")
        .eq("id", input.gapAnalysisId)
        .eq("user_id", input.userId)
        .maybeSingle(),
    );
  }
  return single<Record<string, unknown>>(
    latestCompletedGapQuery(input.supabase, input.userId, input.transcriptId),
  );
}

function completedItemStatus(status: string | null | undefined) {
  return status === "done" || status === "completed";
}

function roadmapItemRow(input: {
  userId: string;
  roadmapId: string;
  studentProfileId: unknown;
  item: GeneratedRoadmapItem;
}) {
  return {
    roadmap_id: input.roadmapId,
    user_id: input.userId,
    student_profile_id: input.studentProfileId,
    gap_requirement_id: input.item.gapRequirementId ?? null,
    destination_requirement_id: input.item.destinationRequirementId ?? null,
    credit_mapping_id: input.item.creditMappingId ?? null,
    title: input.item.title,
    description: input.item.description,
    action_type: input.item.actionType,
    priority: input.item.priority,
    status: input.item.status,
    timing_bucket: input.item.timingBucket,
    suggested_term: input.item.suggestedTerm ?? null,
    suggested_grade_level: input.item.suggestedGradeLevel ?? null,
    due_window_label: input.item.dueWindowLabel ?? null,
    required_before: input.item.requiredBefore ?? null,
    requirement_category: input.item.requirementCategory ?? null,
    risk_level: input.item.riskLevel,
    counselor_review_required: input.item.counselorReviewRequired,
    counselor_question: input.item.counselorQuestion ?? null,
    student_instructions: input.item.studentInstructions ?? null,
    evidence_note: input.item.evidenceNote ?? null,
    completion_note: input.item.completionNote ?? null,
    display_order: input.item.displayOrder,
    subject_category: input.item.requirementCategory ?? null,
    credits_needed: input.item.legacyCreditsNeeded ?? null,
    semester_target: input.item.dueWindowLabel ?? input.item.timingBucket,
    completion_method: input.item.legacyCompletionMethod ?? input.item.actionType,
    suggested_courses: [],
    order_index: input.item.displayOrder,
  };
}

async function refreshRoadmapCounts(supabase: SupabaseLike, userId: string, roadmapId: string) {
  const items = await many<Record<string, unknown>>(
    supabase
      .from("roadmap_items")
      .select("status,priority,counselor_review_required")
      .eq("user_id", userId)
      .eq("roadmap_id", roadmapId),
  );
  const completed = items.filter((item) => completedItemStatus(String(item.status))).length;
  const patch: Record<string, unknown> = {
    total_items: items.length,
    completed_items: completed,
    critical_items: items.filter((item) => item.priority === "critical").length,
    high_priority_items: items.filter((item) => item.priority === "high").length,
    medium_priority_items: items.filter((item) => item.priority === "medium").length,
    low_priority_items: items.filter((item) => item.priority === "low").length,
    counselor_review_items: items.filter((item) => item.counselor_review_required).length,
    updated_at: new Date().toISOString(),
  };
  if (items.length && completed === items.length) {
    patch.status = "completed";
    patch.completed_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from("roadmaps")
    .update(patch)
    .eq("id", roadmapId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function generateAcademicRoadmap({
  supabase,
  userId,
  gapAnalysisId,
  transcriptId,
}: {
  supabase: SupabaseLike;
  userId: string;
  gapAnalysisId?: string;
  transcriptId?: string;
}) {
  const gapAnalysis = await loadGapAnalysis({ supabase, userId, gapAnalysisId, transcriptId });
  if (!gapAnalysis) throw new Error("Run graduation gap analysis first.");
  if (gapAnalysis.status === "stale") {
    throw new Error("Run graduation gap analysis again before generating a roadmap.");
  }

  const resolvedTranscriptId = String(gapAnalysis.transcript_id ?? transcriptId ?? "");
  if (!resolvedTranscriptId) throw new Error("Upload and confirm your transcript first.");
  const transcript = await single<Record<string, unknown>>(
    supabase
      .from("transcripts")
      .select("*, student_profiles(*)")
      .eq("id", resolvedTranscriptId)
      .eq("user_id", userId)
      .maybeSingle(),
  );
  if (!transcript) throw new Error("Upload and confirm your transcript first.");
  if (transcript.confirmation_status !== "confirmed") {
    throw new Error("Review and confirm your extracted courses first.");
  }
  const profile = (transcript.student_profiles ?? {}) as Record<string, unknown>;

  const [courses, mappings, gapRequirements] = await Promise.all([
    many<Record<string, unknown>>(
      supabase
        .from("transcript_courses")
        .select("id")
        .eq("user_id", userId)
        .eq("transcript_id", resolvedTranscriptId)
        .eq("student_confirmed", true),
    ),
    many<Record<string, unknown>>(
      supabase
        .from("credit_mappings")
        .select("id")
        .eq("user_id", userId)
        .eq("transcript_id", resolvedTranscriptId)
        .neq("mapping_status", "replaced"),
    ),
    many<Record<string, unknown>>(
      supabase
        .from("gap_requirements")
        .select("*")
        .eq("user_id", userId)
        .eq("gap_analysis_id", gapAnalysis.id)
        .order("display_order"),
    ),
  ]);
  if (!courses.length) throw new Error("Review and confirm your extracted courses first.");
  if (!mappings.length) throw new Error("Generate probable credit mapping first.");
  if (!gapRequirements.length) throw new Error("Run graduation gap analysis first.");

  const frameworkId = String(
    gapAnalysis.destination_framework_id ?? profile.destination_framework_id ?? "",
  );
  if (!frameworkId) throw new Error("Destination graduation framework is still being verified.");

  const [framework, graduationRequirements] = await Promise.all([
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
  if (!framework) throw new Error("Destination graduation framework is still being verified.");

  const generated = generateRoadmapFromGapAnalysis({
    userId,
    profile,
    transcript,
    gapAnalysis,
    gapRequirements: gapRequirements as never,
    destinationFramework: framework,
    graduationRequirements,
  });

  await supabase
    .from("roadmaps")
    .update({
      status: "stale",
      stale_reason: "new roadmap generated",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("transcript_id", resolvedTranscriptId)
    .in("status", ["active", "needs_review", "completed"]);

  const now = new Date().toISOString();
  const roadmapInsert = await supabase
    .from("roadmaps")
    .insert({
      user_id: userId,
      student_profile_id: profile.id,
      transcript_id: resolvedTranscriptId,
      gap_analysis_id: gapAnalysis.id,
      destination_country_id: profile.destination_country_id ?? null,
      destination_jurisdiction_id: profile.destination_jurisdiction_id ?? null,
      destination_framework_id: frameworkId,
      destination_program_id: profile.destination_program_id ?? null,
      expected_graduation_year: profile.expected_graduation_year ?? null,
      grade_at_transfer: profile.grade_at_transfer ?? null,
      title: "Academic roadmap",
      estimated_graduation_date: profile.expected_graduation_year
        ? `${profile.expected_graduation_year}-05-31`
        : null,
      is_on_track: generated.overallRiskLevel === "green",
      status: generated.status,
      roadmap_type: generated.roadmapType,
      overall_risk_level: generated.overallRiskLevel,
      timeline_urgency: generated.timelineUrgency,
      planning_horizon: generated.planningHorizon,
      total_items: generated.counts.total,
      completed_items: generated.counts.completed,
      critical_items: generated.counts.critical,
      high_priority_items: generated.counts.high,
      medium_priority_items: generated.counts.medium,
      low_priority_items: generated.counts.low,
      counselor_review_items: generated.counts.counselorReview,
      summary_text: generated.summaryText,
      timeline_summary: generated.timelineSummary,
      student_next_steps_json: generated.studentNextSteps,
      counselor_questions_json: generated.counselorQuestions,
      assumptions_json: generated.assumptions,
      warnings_json: generated.warnings,
      source_snapshot_json: {
        gap_analysis: roadmapSafeSnapshot(gapAnalysis),
        transcript: roadmapSafeSnapshot(transcript),
        profile: roadmapSafeSnapshot(profile),
        destination_framework: roadmapSafeSnapshot(framework),
      },
      items: generated.items,
      completed_at: now,
      generated_at: now,
    })
    .select("*")
    .single();
  if (roadmapInsert.error) throw new Error(roadmapInsert.error.message);
  const roadmap = roadmapInsert.data as Record<string, unknown>;

  const itemRows = generated.items.map((item) =>
    roadmapItemRow({
      userId,
      roadmapId: String(roadmap.id),
      studentProfileId: profile.id,
      item,
    }),
  );
  if (itemRows.length) {
    const insertItems = await supabase.from("roadmap_items").insert(itemRows);
    if (insertItems.error) throw new Error(insertItems.error.message);
  }
  return { roadmap, items: itemRows, result: generated };
}

export async function updateRoadmapItem({
  supabase,
  userId,
  itemId,
  status,
  completionNote,
}: {
  supabase: SupabaseLike;
  userId: string;
  itemId: string;
  status?: string;
  completionNote?: string | null;
}) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) {
    patch.status = status;
    patch.completed_at =
      status === "done" || status === "completed" ? new Date().toISOString() : null;
  }
  if (completionNote !== undefined) patch.completion_note = completionNote;
  const { data, error } = await supabase
    .from("roadmap_items")
    .update(patch)
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await refreshRoadmapCounts(supabase, userId, String(data.roadmap_id));
  return data;
}

export async function addManualRoadmapItem({
  supabase,
  userId,
  input,
}: {
  supabase: SupabaseLike;
  userId: string;
  input: {
    roadmap_id: string;
    title: string;
    description?: string | null;
    action_type: string;
    priority: string;
    timing_bucket: string;
    counselor_question?: string | null;
  };
}) {
  const roadmap = await single<Record<string, unknown>>(
    supabase
      .from("roadmaps")
      .select("*")
      .eq("id", input.roadmap_id)
      .eq("user_id", userId)
      .maybeSingle(),
  );
  if (!roadmap) throw new Error("Roadmap was not found for this user.");
  const existing = await many<Record<string, unknown>>(
    supabase
      .from("roadmap_items")
      .select("display_order")
      .eq("user_id", userId)
      .eq("roadmap_id", input.roadmap_id)
      .order("display_order", { ascending: false })
      .limit(1),
  );
  const displayOrder = Number(existing[0]?.display_order ?? 0) + 1;
  const { data, error } = await supabase
    .from("roadmap_items")
    .insert({
      roadmap_id: input.roadmap_id,
      user_id: userId,
      student_profile_id: roadmap.student_profile_id,
      title: input.title,
      description: input.description ?? null,
      action_type: input.action_type,
      priority: input.priority,
      status: "todo",
      timing_bucket: input.timing_bucket,
      counselor_question: input.counselor_question ?? null,
      counselor_review_required: Boolean(input.counselor_question),
      display_order: displayOrder,
      order_index: displayOrder,
      subject_category: null,
      credits_needed: null,
      semester_target: input.timing_bucket,
      completion_method: "manual_task",
      suggested_courses: [],
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await refreshRoadmapCounts(supabase, userId, input.roadmap_id);
  return data;
}
