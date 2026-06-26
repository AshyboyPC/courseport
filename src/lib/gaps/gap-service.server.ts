import { summarizeGapAnalysisSafely } from "./ai-gap-summary.server.ts";
import { calculateGapAnalysis } from "./gap-calculator.server.ts";
import { safeSnapshot } from "./gap-safe-copy.ts";

type QueryResult<T> = { data: T | null; error: { message: string } | null };
type QueryListResult<T> = { data: T[] | null; error: { message: string } | null };
type SupabaseLike = {
  // Broad on purpose: this accepts the real Supabase server client and small test doubles.
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

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function latestMappingRun(
  supabase: SupabaseLike,
  userId: string,
  transcriptId: string,
  explicitRunId?: string,
) {
  if (explicitRunId) {
    return single<Record<string, unknown>>(
      supabase
        .from("credit_mapping_runs")
        .select("*")
        .eq("id", explicitRunId)
        .eq("user_id", userId)
        .eq("transcript_id", transcriptId)
        .maybeSingle(),
    );
  }
  return single<Record<string, unknown>>(
    supabase
      .from("credit_mapping_runs")
      .select("*")
      .eq("user_id", userId)
      .eq("transcript_id", transcriptId)
      .in("status", ["completed", "needs_review"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

export async function generateGapAnalysisForTranscript({
  supabase,
  userId,
  transcriptId,
  creditMappingRunId,
  destinationFrameworkId,
}: {
  supabase: SupabaseLike;
  userId: string;
  transcriptId: string;
  creditMappingRunId?: string;
  destinationFrameworkId?: string;
}) {
  const transcript = await single<Record<string, unknown>>(
    supabase
      .from("transcripts")
      .select("*, student_profiles(*)")
      .eq("id", transcriptId)
      .eq("user_id", userId)
      .maybeSingle(),
  );
  if (!transcript) throw new Error("Upload and confirm your transcript first.");
  if (transcript.confirmation_status !== "confirmed") {
    throw new Error("Review and confirm your extracted courses first.");
  }
  const profile = (transcript.student_profiles ?? {}) as Record<string, unknown>;
  const confirmedCourses = await many<Record<string, unknown>>(
    supabase
      .from("transcript_courses")
      .select("id")
      .eq("user_id", userId)
      .eq("transcript_id", transcriptId)
      .eq("student_confirmed", true),
  );
  if (!confirmedCourses.length) throw new Error("Review and confirm your extracted courses first.");

  const mappings = await many<Record<string, unknown>>(
    supabase
      .from("credit_mappings")
      .select("*")
      .eq("user_id", userId)
      .eq("transcript_id", transcriptId)
      .neq("mapping_status", "replaced")
      .order("created_at"),
  );
  if (!mappings.length) throw new Error("Generate probable credit mapping first.");

  const mappingRun = await latestMappingRun(supabase, userId, transcriptId, creditMappingRunId);
  const frameworkId =
    destinationFrameworkId ||
    String(mappingRun?.destination_framework_id ?? profile.destination_framework_id ?? "");
  if (!frameworkId) throw new Error("Destination graduation framework is still being verified.");

  const [framework, requirements] = await Promise.all([
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
  if (!requirements.length) throw new Error("Requirements for this state are not ready yet.");

  const calculated = calculateGapAnalysis({
    requirements: requirements.map((requirement) => ({
      ...requirement,
      credits_required: numberOrNull(requirement.credits_required),
    })) as never,
    mappings: mappings as never,
    frameworkTotalCredits: numberOrNull(framework.total_credits_required),
    gradeAtTransfer: numberOrNull(profile.grade_at_transfer),
    expectedGraduationYear: numberOrNull(profile.expected_graduation_year),
  });
  const summaryText = await summarizeGapAnalysisSafely(calculated);

  await supabase
    .from("gap_analyses")
    .update({ status: "stale", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("transcript_id", transcriptId)
    .in("status", ["completed", "needs_review"]);

  const analysisInsert = await supabase
    .from("gap_analyses")
    .insert({
      user_id: userId,
      student_profile_id: profile.id,
      transcript_id: transcriptId,
      credit_mapping_run_id: mappingRun?.id ?? null,
      destination_country_id: profile.destination_country_id ?? null,
      destination_jurisdiction_id: profile.destination_jurisdiction_id ?? null,
      destination_framework_id: frameworkId,
      destination_program_id: profile.destination_program_id ?? null,
      expected_graduation_year: profile.expected_graduation_year ?? null,
      grade_at_transfer: profile.grade_at_transfer ?? null,
      status: calculated.status,
      overall_status: calculated.overallRiskLevel === "red" ? "at_risk" : "preview",
      overall_risk_level: calculated.overallRiskLevel,
      total_credits_required: calculated.totalRequiredCredits,
      total_credits_mapped: calculated.totalLikelyEarnedCredits,
      total_likely_earned_credits: calculated.totalLikelyEarnedCredits,
      total_possible_earned_credits: calculated.totalPossibleEarnedCredits,
      total_missing_credits: calculated.totalMissingCredits,
      high_confidence_credits: calculated.highConfidenceCredits,
      medium_confidence_credits: calculated.mediumConfidenceCredits,
      low_confidence_credits: calculated.lowConfidenceCredits,
      unclear_credits: calculated.unclearCredits,
      satisfied_requirement_count: calculated.satisfiedRequirementCount,
      partial_requirement_count: calculated.partialRequirementCount,
      missing_requirement_count: calculated.missingRequirementCount,
      counselor_review_requirement_count: calculated.counselorReviewRequirementCount,
      assessment_gap_count: calculated.assessmentGapCount,
      local_review_required: calculated.localReviewRequired,
      analysis_summary: summaryText,
      summary_text: summaryText,
      student_next_steps_json: calculated.studentNextSteps,
      counselor_questions_json: calculated.counselorQuestions,
      warnings_json: calculated.warnings,
      source_snapshot_json: {
        profile: safeSnapshot(profile),
        transcript: safeSnapshot(transcript),
        framework: safeSnapshot(framework),
        mapping_run_id: mappingRun?.id ?? null,
      },
      completed_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (analysisInsert.error) throw new Error(analysisInsert.error.message);
  const analysis = analysisInsert.data as Record<string, unknown>;

  const rows = calculated.requirements.map((requirement) => ({
    gap_analysis_id: analysis.id,
    user_id: userId,
    student_profile_id: profile.id,
    transcript_id: transcriptId,
    destination_requirement_id: requirement.destinationRequirementId ?? null,
    subject_category: requirement.requirementCategory,
    requirement_category: requirement.requirementCategory,
    requirement_type: requirement.requirementType,
    requirement_name: requirement.requirementName,
    credits_required: requirement.requiredAmount,
    required_amount: requirement.requiredAmount,
    credits_mapped: requirement.earnedLikelyAmount,
    earned_likely_amount: requirement.earnedLikelyAmount,
    earned_possible_amount: requirement.earnedPossibleAmount,
    earned_review_amount: requirement.earnedReviewAmount,
    credits_remaining: requirement.missingAmount,
    missing_amount: requirement.missingAmount,
    unit_type: requirement.unitType,
    status: requirement.status,
    risk_level: requirement.riskLevel,
    priority: requirement.priority,
    matched_credit_mapping_ids: requirement.matchedCreditMappingIds,
    supporting_course_names: requirement.supportingCourseNames,
    unclear_course_names: requirement.unclearCourseNames,
    counselor_review_required: requirement.counselorReviewRequired,
    review_reason: requirement.reviewReason,
    requirement_notes: requirement.requirementNotes,
    notes: requirement.studentExplanation,
    student_explanation: requirement.studentExplanation,
    counselor_question: requirement.counselorQuestion,
    suggested_actions: [requirement.counselorQuestion],
    display_order: requirement.displayOrder,
  }));
  const requirementInsert = await supabase.from("gap_requirements").insert(rows);
  if (requirementInsert.error) throw new Error(requirementInsert.error.message);
  return { analysis, requirements: rows, result: calculated };
}
