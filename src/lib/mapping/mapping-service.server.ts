import { mapCourseDeterministically } from "@/lib/mapping/deterministic-mapper.server";
import { tryStructuredAiMapping } from "@/lib/mapping/ai-mapper.server";
import { tryVectorMapping } from "@/lib/mapping/vector-mapper.server";
import type {
  CourseMappingCandidate,
  MappingContext,
  MappingRunSummary,
  TranscriptCourseForMapping,
} from "@/lib/mapping/types";

type SupabaseLike = {
  // Supabase's fluent query builder type is intentionally broad here because this service accepts
  // both the real server client and lightweight test doubles.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

function publicErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Credit mapping failed.";
}

function countBy(candidates: CourseMappingCandidate[], confidence: string) {
  return candidates.filter((candidate) => candidate.mapping_confidence === confidence).length;
}

async function single<T>(
  query: PromiseLike<{ data: T | null; error: { message: string } | null }>,
) {
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function many<T>(
  query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
) {
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

async function buildContext(
  supabase: SupabaseLike,
  userId: string,
  transcriptId: string,
  destinationFrameworkId?: string,
): Promise<{ context: MappingContext; courses: TranscriptCourseForMapping[] }> {
  const transcript = await single<Record<string, unknown>>(
    supabase
      .from("transcripts")
      .select("*, student_profiles(*)")
      .eq("id", transcriptId)
      .eq("user_id", userId)
      .maybeSingle(),
  );
  if (!transcript) throw new Error("Transcript was not found for this user.");
  if (transcript.confirmation_status !== "confirmed")
    throw new Error("Confirm transcript courses before generating credit mappings.");
  const profile = (transcript.student_profiles ?? {}) as Record<string, unknown>;
  const frameworkId =
    destinationFrameworkId ||
    String(profile.destination_framework_id ?? transcript.destination_framework_id ?? "");
  if (!frameworkId) throw new Error("Destination framework still being verified.");
  const courses = await many<TranscriptCourseForMapping>(
    supabase
      .from("transcript_courses")
      .select("*")
      .eq("user_id", userId)
      .eq("transcript_id", transcriptId)
      .eq("student_confirmed", true)
      .order("created_at"),
  );
  if (!courses.length) throw new Error("No confirmed transcript courses are available to map.");
  const [destinationFramework, destinationRequirements, sourceCourses, mappingRules] =
    await Promise.all([
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
      profile.source_curriculum_id || transcript.selected_source_curriculum_id
        ? many<Record<string, unknown>>(
            supabase
              .from("curriculum_courses")
              .select("*")
              .eq(
                "curriculum_id",
                String(transcript.selected_source_curriculum_id ?? profile.source_curriculum_id),
              ),
          )
        : Promise.resolve([]),
      many<Record<string, unknown>>(
        supabase
          .from("mapping_rules")
          .select("*")
          .eq(
            "source_country_id",
            String(transcript.selected_source_country_id ?? profile.source_country_id),
          )
          .eq("destination_country_id", String(profile.destination_country_id ?? ""))
          .in("coverage_status", ["partial", "verified", "official"]),
      ),
    ]);
  return {
    courses,
    context: {
      userId,
      transcript,
      profile,
      sourceCountryId:
        String(transcript.selected_source_country_id ?? profile.source_country_id ?? "") || null,
      sourceJurisdictionId:
        String(
          transcript.selected_source_jurisdiction_id ?? profile.source_jurisdiction_id ?? "",
        ) || null,
      sourceCurriculumId:
        String(transcript.selected_source_curriculum_id ?? profile.source_curriculum_id ?? "") ||
        null,
      destinationCountryId: String(profile.destination_country_id ?? "") || null,
      destinationJurisdictionId: String(profile.destination_jurisdiction_id ?? "") || null,
      destinationFrameworkId: frameworkId,
      destinationFramework,
      destinationRequirements,
      sourceCurriculumCourses: sourceCourses,
      mappingRules,
    },
  };
}

async function mapOne(context: MappingContext, course: TranscriptCourseForMapping) {
  let candidate = mapCourseDeterministically(context, course);
  const vector = await tryVectorMapping(context, course);
  if (vector) candidate = { ...candidate, ...vector, mapping_method: "vector_similarity" };
  if (
    candidate.mapping_confidence === "unclear" ||
    (candidate.mapping_confidence === "low" && candidate.mapped_subject_category === "unclear")
  ) {
    try {
      const ai = await tryStructuredAiMapping(context, course);
      if (ai) candidate = { ...candidate, ...ai };
    } catch (error) {
      candidate = {
        ...candidate,
        mapping_confidence: "unclear",
        mapping_status: "counselor_review_required",
        counselor_review_required: true,
        review_reason: publicErrorMessage(error),
        source_evidence_json: {
          ...candidate.source_evidence_json,
          ai_error: "Structured AI output was unavailable or invalid.",
        },
      };
    }
  }
  return candidate;
}

export async function generateCreditMappingsForTranscript({
  supabase,
  userId,
  transcriptId,
  destinationFrameworkId,
}: {
  supabase: SupabaseLike;
  userId: string;
  transcriptId: string;
  destinationFrameworkId?: string;
}): Promise<MappingRunSummary> {
  const { context, courses } = await buildContext(
    supabase,
    userId,
    transcriptId,
    destinationFrameworkId,
  );
  const runInsert = await supabase
    .from("credit_mapping_runs")
    .insert({
      user_id: userId,
      student_profile_id: context.profile.id,
      transcript_id: transcriptId,
      destination_framework_id: context.destinationFrameworkId,
      status: "processing",
      started_at: new Date().toISOString(),
      total_courses: courses.length,
    })
    .select("*")
    .single();
  if (runInsert.error) throw new Error(runInsert.error.message);
  const runId = runInsert.data.id as string;
  try {
    const candidates: CourseMappingCandidate[] = [];
    for (const course of courses) candidates.push(await mapOne(context, course));
    const replaceExisting = await supabase
      .from("credit_mappings")
      .update({ mapping_status: "replaced", status: "replaced" })
      .eq("user_id", userId)
      .eq("transcript_id", transcriptId)
      .in("mapping_status", ["candidate", "counselor_review_required"]);
    if (replaceExisting.error) throw new Error(replaceExisting.error.message);
    const insert = await supabase.from("credit_mappings").insert(
      candidates.map((candidate) => ({
        ...candidate,
        target_subject_category: candidate.mapped_subject_category,
        probable_us_equivalent: candidate.probable_destination_equivalent,
        credits_mapped: candidate.possible_credit_value,
        confidence: candidate.mapping_confidence,
        mapping_reason: candidate.evidence_summary,
        needs_counselor_review: candidate.counselor_review_required,
        status: candidate.mapping_status,
      })),
    );
    if (insert.error) throw new Error(insert.error.message);
    const summary = {
      runId,
      totalCourses: candidates.length,
      highConfidenceCount: countBy(candidates, "high"),
      mediumConfidenceCount: countBy(candidates, "medium"),
      lowConfidenceCount: countBy(candidates, "low"),
      unclearCount: countBy(candidates, "unclear"),
      counselorReviewCount: candidates.filter((candidate) => candidate.counselor_review_required)
        .length,
      status: candidates.some((candidate) => candidate.counselor_review_required)
        ? ("needs_review" as const)
        : ("completed" as const),
    };
    const updateRun = await supabase
      .from("credit_mapping_runs")
      .update({
        status: summary.status,
        completed_at: new Date().toISOString(),
        high_confidence_count: summary.highConfidenceCount,
        medium_confidence_count: summary.mediumConfidenceCount,
        low_confidence_count: summary.lowConfidenceCount,
        unclear_count: summary.unclearCount,
        counselor_review_count: summary.counselorReviewCount,
      })
      .eq("id", runId)
      .eq("user_id", userId);
    if (updateRun.error) throw new Error(updateRun.error.message);
    return summary;
  } catch (error) {
    await supabase
      .from("credit_mapping_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error: publicErrorMessage(error),
      })
      .eq("id", runId)
      .eq("user_id", userId);
    throw error;
  }
}
