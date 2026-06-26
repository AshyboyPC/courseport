import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { generateGapAnalysisForTranscript } from "@/lib/gaps/gap-service.server";
import { generateCreditMappingsForTranscript } from "@/lib/mapping/mapping-service.server";
import { processTranscriptOcrAndTranslation } from "@/lib/ocr/ocr-service.server";
import {
  addManualRoadmapItem,
  generateAcademicRoadmap,
  updateRoadmapItem,
} from "@/lib/roadmap/roadmap-service.server";
import {
  GenerateAcademicRoadmapSchema,
  ManualRoadmapItemSchema,
  RoadmapItemPatchSchema,
} from "@/lib/roadmap/roadmap-validators";
import { requireAuthenticatedServerUser } from "@/lib/supabase-server";

const uuid = z.string().uuid();

const candidatePatchSchema = z.object({
  id: uuid,
  course_name_original: z.string().trim().min(1).optional(),
  course_name_translated: z.string().trim().nullable().optional(),
  course_name_normalized: z.string().trim().nullable().optional(),
  original_language_code: z.string().trim().nullable().optional(),
  translated_language_code: z.string().trim().nullable().optional(),
  subject_category: z.string().trim().nullable().optional(),
  grade_original: z.string().trim().nullable().optional(),
  grade_normalized: z.number().nullable().optional(),
  grade_scale_original: z.string().trim().nullable().optional(),
  max_marks: z.string().trim().nullable().optional(),
  credits_or_units: z.string().trim().nullable().optional(),
  term_label_original: z.string().trim().nullable().optional(),
  term_label_translated: z.string().trim().nullable().optional(),
  academic_year: z.string().trim().nullable().optional(),
  grade_level: z.number().int().nullable().optional(),
  needs_review: z.boolean().optional(),
  review_reason: z.string().trim().nullable().optional(),
});

const manualCourseSchema = candidatePatchSchema.omit({ id: true }).extend({ transcript_id: uuid });
const mappingPatchSchema = z.object({
  id: uuid,
  mapped_subject_category: z.string().trim().min(1).optional(),
  probable_destination_equivalent: z.string().trim().min(1).optional(),
  requirement_bucket: z.string().trim().nullable().optional(),
  possible_credit_value: z.number().nullable().optional(),
  credit_unit: z.enum(["credit", "unit", "carnegie_unit", "local_unit", "unknown"]).optional(),
  mapping_confidence: z.enum(["high", "medium", "low", "unclear"]).optional(),
  counselor_review_required: z.boolean().optional(),
  review_reason: z.string().trim().nullable().optional(),
  student_note: z.string().trim().nullable().optional(),
});

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

function publicError(error: unknown) {
  const message = error instanceof Error ? error.message : "Transcript operation failed.";
  const status = /authenticated|required/i.test(message) ? 401 : 400;
  return json({ success: false, error: { message } }, { status });
}

async function getOwnedTranscript(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  transcriptId?: string | null,
) {
  let query = supabase
    .from("transcripts")
    .select("*, student_profiles(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (transcriptId) query = query.eq("id", transcriptId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function getFrameworkLabels(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  transcript: Record<string, unknown>,
) {
  const countryIds = [
    transcript.detected_source_country_id,
    transcript.selected_source_country_id,
  ].filter(Boolean) as string[];
  const jurisdictionIds = [
    transcript.detected_source_jurisdiction_id,
    transcript.selected_source_jurisdiction_id,
  ].filter(Boolean) as string[];
  const curriculumIds = [
    transcript.detected_source_curriculum_id,
    transcript.selected_source_curriculum_id,
  ].filter(Boolean) as string[];
  const [countries, jurisdictions, curricula] = await Promise.all([
    countryIds.length
      ? supabase.from("countries").select("id,name").in("id", countryIds)
      : Promise.resolve({ data: [], error: null }),
    jurisdictionIds.length
      ? supabase.from("jurisdictions").select("id,name").in("id", jurisdictionIds)
      : Promise.resolve({ data: [], error: null }),
    curriculumIds.length
      ? supabase.from("curricula").select("id,name").in("id", curriculumIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (countries.error) throw countries.error;
  if (jurisdictions.error) throw jurisdictions.error;
  if (curricula.error) throw curricula.error;
  const byId = (rows: Array<{ id: string; name: string }> | null) =>
    new Map((rows ?? []).map((row) => [row.id, row.name]));
  return {
    countries: byId(countries.data),
    jurisdictions: byId(jurisdictions.data),
    curricula: byId(curricula.data),
  };
}

async function buildReviewData(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  transcriptId?: string | null,
) {
  const transcript = await getOwnedTranscript(supabase, userId, transcriptId);
  if (!transcript) return { transcript: null, candidates: [], profile: null };
  const candidates = await supabase
    .from("transcript_course_candidates")
    .select("*")
    .eq("user_id", userId)
    .eq("transcript_id", transcript.id)
    .order("created_at");
  if (candidates.error) throw candidates.error;
  const labels = await getFrameworkLabels(supabase, transcript);
  const profile = transcript.student_profiles ?? null;
  return {
    transcript: {
      ...transcript,
      ocr_raw_json: undefined,
      ocr_raw: undefined,
      detected_source_country_label: transcript.detected_source_country_id
        ? labels.countries.get(transcript.detected_source_country_id)
        : null,
      detected_source_jurisdiction_label: transcript.detected_source_jurisdiction_id
        ? labels.jurisdictions.get(transcript.detected_source_jurisdiction_id)
        : null,
      detected_source_curriculum_label: transcript.detected_source_curriculum_id
        ? labels.curricula.get(transcript.detected_source_curriculum_id)
        : null,
      selected_source_country_label: transcript.selected_source_country_id
        ? labels.countries.get(transcript.selected_source_country_id)
        : null,
      selected_source_jurisdiction_label: transcript.selected_source_jurisdiction_id
        ? labels.jurisdictions.get(transcript.selected_source_jurisdiction_id)
        : null,
      selected_source_curriculum_label: transcript.selected_source_curriculum_id
        ? labels.curricula.get(transcript.selected_source_curriculum_id)
        : null,
    },
    candidates: candidates.data ?? [],
    profile,
  };
}

async function updateCandidate(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
) {
  const parsed = candidatePatchSchema.parse(body);
  const { id, ...patch } = parsed;
  const { data, error } = await supabase
    .from("transcript_course_candidates")
    .update({
      ...patch,
      entry_method: "student_edited",
      student_confirmed: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function addManualCourse(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
) {
  const parsed = manualCourseSchema.parse(body);
  const transcript = await getOwnedTranscript(supabase, userId, parsed.transcript_id);
  if (!transcript) throw new Error("Transcript was not found for this user.");
  const { data, error } = await supabase
    .from("transcript_course_candidates")
    .insert({
      ...parsed,
      user_id: userId,
      entry_method: "manual_entry",
      student_confirmed: false,
      needs_review: true,
      review_reason: parsed.review_reason ?? "Manual entry requires confirmation.",
    })
    .select("*")
    .single();
  if (error) throw error;
  await supabase
    .from("transcripts")
    .update({
      ocr_status: transcript.ocr_status === "failed" ? "manual_entry" : transcript.ocr_status,
      translation_status:
        transcript.translation_status === "failed" ? "manual_entry" : transcript.translation_status,
      confirmation_status: "needs_review",
      requires_user_confirmation: true,
    })
    .eq("id", parsed.transcript_id)
    .eq("user_id", userId);
  return data;
}

async function deleteCandidate(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
) {
  const parsed = z.object({ id: uuid }).parse(body);
  const { error } = await supabase
    .from("transcript_course_candidates")
    .delete()
    .eq("id", parsed.id)
    .eq("user_id", userId);
  if (error) throw error;
}

function numericOrZero(value: unknown) {
  const parsed =
    typeof value === "string" ? Number(value.match(/\d+(?:\.\d+)?/)?.[0]) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function integerOrNull(value: unknown) {
  const parsed = typeof value === "string" ? Number(value.match(/\d{4}/)?.[0]) : Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

async function confirmTranscript(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
) {
  const parsed = z.object({ transcript_id: uuid }).parse(body);
  const transcript = await getOwnedTranscript(supabase, userId, parsed.transcript_id);
  if (!transcript) throw new Error("Transcript was not found for this user.");
  const { data: candidates, error: candidateError } = await supabase
    .from("transcript_course_candidates")
    .select("*")
    .eq("user_id", userId)
    .eq("transcript_id", parsed.transcript_id)
    .order("created_at");
  if (candidateError) throw candidateError;
  if (!candidates?.length)
    throw new Error("Add at least one course before confirming this transcript.");

  const deleteExisting = await supabase
    .from("transcript_courses")
    .delete()
    .eq("user_id", userId)
    .eq("transcript_id", parsed.transcript_id);
  if (deleteExisting.error) throw deleteExisting.error;

  const { error: insertError } = await supabase.from("transcript_courses").insert(
    candidates.map((candidate) => ({
      user_id: userId,
      transcript_id: parsed.transcript_id,
      course_name_original: candidate.course_name_original,
      course_name_translated: candidate.course_name_translated,
      course_name_normalized: candidate.course_name_normalized,
      original_language_code: candidate.original_language_code,
      translated_language_code: candidate.translated_language_code,
      subject_category: candidate.subject_category,
      credits: numericOrZero(candidate.credits_or_units),
      grade_original: candidate.grade_original,
      grade_normalized: candidate.grade_normalized,
      grade_scale_original: candidate.grade_scale_original,
      max_marks: candidate.max_marks,
      credits_or_units: candidate.credits_or_units,
      term_label_original: candidate.term_label_original,
      term_label_translated: candidate.term_label_translated,
      grade_level: candidate.grade_level,
      academic_year: integerOrNull(candidate.academic_year),
      academic_year_label: candidate.academic_year,
      semester: candidate.term_label_translated ?? candidate.term_label_original,
      page_number: candidate.page_number,
      source_text: candidate.source_text,
      translated_source_text: candidate.translated_source_text,
      bounding_box_json: candidate.bounding_box_json,
      extraction_confidence: candidate.extraction_confidence,
      translation_confidence: candidate.translation_confidence,
      entry_method:
        candidate.entry_method === "ocr_extracted" ? "student_edited" : candidate.entry_method,
      student_confirmed: true,
      needs_review: false,
      review_reason: null,
      mapping_status: "confirmed_unmapped",
    })),
  );
  if (insertError) throw insertError;

  await supabase
    .from("transcript_course_candidates")
    .update({ student_confirmed: true, needs_review: false, review_reason: null })
    .eq("user_id", userId)
    .eq("transcript_id", parsed.transcript_id);
  await supabase
    .from("transcripts")
    .update({
      confirmation_status: "confirmed",
      confirmed_at: new Date().toISOString(),
      requires_user_confirmation: false,
      status: "completed",
    })
    .eq("id", parsed.transcript_id)
    .eq("user_id", userId);
}

async function switchFramework(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
) {
  const parsed = z
    .object({
      transcript_id: uuid,
      method: z.enum([
        "profile_default",
        "ocr_detected",
        "student_override",
        "manual_selection",
        "counselor_review",
      ]),
      selected_source_country_id: uuid.nullable().optional(),
      selected_source_jurisdiction_id: uuid.nullable().optional(),
      selected_source_curriculum_id: uuid.nullable().optional(),
    })
    .parse(body);
  const transcript = await getOwnedTranscript(supabase, userId, parsed.transcript_id);
  if (!transcript) throw new Error("Transcript was not found for this user.");
  const profile = transcript.student_profiles ?? {};
  const patch =
    parsed.method === "profile_default"
      ? {
          selected_source_country_id: profile.source_country_id ?? null,
          selected_source_jurisdiction_id: profile.source_jurisdiction_id ?? null,
          selected_source_curriculum_id: profile.source_curriculum_id ?? null,
        }
      : parsed.method === "ocr_detected"
        ? {
            selected_source_country_id: transcript.detected_source_country_id,
            selected_source_jurisdiction_id: transcript.detected_source_jurisdiction_id,
            selected_source_curriculum_id: transcript.detected_source_curriculum_id,
          }
        : {
            selected_source_country_id: parsed.selected_source_country_id ?? null,
            selected_source_jurisdiction_id: parsed.selected_source_jurisdiction_id ?? null,
            selected_source_curriculum_id: parsed.selected_source_curriculum_id ?? null,
          };
  const { error } = await supabase
    .from("transcripts")
    .update({
      ...patch,
      source_selection_method: parsed.method,
      confirmation_status:
        parsed.method === "counselor_review" ? "counselor_review" : "needs_review",
      requires_user_confirmation: true,
    })
    .eq("id", parsed.transcript_id)
    .eq("user_id", userId);
  if (error) throw error;
}

async function startCreditMapping(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
) {
  const parsed = z
    .object({ transcript_id: uuid, destination_framework_id: uuid.optional() })
    .parse(body);
  return generateCreditMappingsForTranscript({
    supabase,
    userId,
    transcriptId: parsed.transcript_id,
    destinationFrameworkId: parsed.destination_framework_id,
  });
}

async function updateCreditMapping(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
) {
  const parsed = mappingPatchSchema.parse(body);
  const { id, ...patch } = parsed;
  const { data, error } = await supabase
    .from("credit_mappings")
    .update({
      ...patch,
      mapping_method: "manual_student",
      mapping_status: patch.counselor_review_required ? "counselor_review_required" : "candidate",
      status: patch.counselor_review_required ? "counselor_review_required" : "candidate",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function setCreditMappingStatus(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
  status: "student_confirmed" | "rejected" | "counselor_review_required",
) {
  const parsed = z.object({ id: uuid, note: z.string().trim().nullable().optional() }).parse(body);
  const patch =
    status === "student_confirmed"
      ? {
          mapping_status: status,
          status,
          confirmed_at: new Date().toISOString(),
          student_note: parsed.note ?? null,
          updated_at: new Date().toISOString(),
        }
      : {
          mapping_status: status,
          status,
          counselor_review_required: status === "counselor_review_required",
          review_reason:
            status === "counselor_review_required"
              ? (parsed.note ?? "Student marked this probable mapping for counselor review.")
              : (parsed.note ?? "Student rejected this probable mapping."),
          updated_at: new Date().toISOString(),
        };
  const { data, error } = await supabase
    .from("credit_mappings")
    .update(patch)
    .eq("id", parsed.id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function startGapAnalysis(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
) {
  const parsed = z
    .object({
      transcript_id: uuid,
      credit_mapping_run_id: uuid.optional(),
      destination_framework_id: uuid.optional(),
    })
    .parse(body);
  return generateGapAnalysisForTranscript({
    supabase,
    userId,
    transcriptId: parsed.transcript_id,
    creditMappingRunId: parsed.credit_mapping_run_id,
    destinationFrameworkId: parsed.destination_framework_id,
  });
}

async function startAcademicRoadmap(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
) {
  const parsed = GenerateAcademicRoadmapSchema.parse(body);
  return generateAcademicRoadmap({
    supabase,
    userId,
    gapAnalysisId: parsed.gap_analysis_id,
    transcriptId: parsed.transcript_id,
  });
}

async function patchRoadmapItem(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
) {
  const parsed = RoadmapItemPatchSchema.parse(body);
  return updateRoadmapItem({
    supabase,
    userId,
    itemId: parsed.id,
    status: parsed.status,
    completionNote: parsed.completion_note,
  });
}

async function createManualRoadmapItem(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  body: unknown,
) {
  const parsed = ManualRoadmapItemSchema.parse(body);
  return addManualRoadmapItem({ supabase, userId, input: parsed });
}

export const Route = createFileRoute("/api/v1/transcripts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { supabase, user } = await requireAuthenticatedServerUser(
            request.headers.get("authorization"),
          );
          const url = new URL(request.url);
          return json({
            success: true,
            data: await buildReviewData(supabase, user.id, url.searchParams.get("transcriptId")),
          });
        } catch (error) {
          return publicError(error);
        }
      },
      POST: async ({ request }) => {
        try {
          const { supabase, user } = await requireAuthenticatedServerUser(
            request.headers.get("authorization"),
          );
          const body = (await request.json()) as { action?: string; payload?: unknown };
          const action = body.action;
          const payload = body.payload;

          if (action === "start_ocr_translation" || action === "retry_ocr_translation") {
            const parsed = z.object({ transcript_id: uuid }).parse(payload);
            const result = await processTranscriptOcrAndTranslation(parsed.transcript_id, user.id, {
              supabase,
              allowMockFallback: false,
            });
            return json({
              success: true,
              data: {
                result,
                review: await buildReviewData(supabase, user.id, parsed.transcript_id),
              },
            });
          }

          if (action === "save_edited_candidate") {
            return json({ success: true, data: await updateCandidate(supabase, user.id, payload) });
          }

          if (action === "add_manual_course") {
            return json({ success: true, data: await addManualCourse(supabase, user.id, payload) });
          }

          if (action === "delete_candidate_course") {
            await deleteCandidate(supabase, user.id, payload);
            return json({ success: true });
          }

          if (action === "confirm_transcript_courses") {
            await confirmTranscript(supabase, user.id, payload);
            const parsed = z.object({ transcript_id: uuid }).parse(payload);
            return json({
              success: true,
              data: await buildReviewData(supabase, user.id, parsed.transcript_id),
            });
          }

          if (action === "switch_selected_source_framework") {
            await switchFramework(supabase, user.id, payload);
            const parsed = z.object({ transcript_id: uuid }).parse(payload);
            return json({
              success: true,
              data: await buildReviewData(supabase, user.id, parsed.transcript_id),
            });
          }

          if (action === "mark_for_counselor_review") {
            const parsed = z.object({ transcript_id: uuid }).parse(payload);
            await switchFramework(supabase, user.id, {
              transcript_id: parsed.transcript_id,
              method: "counselor_review",
            });
            return json({
              success: true,
              data: await buildReviewData(supabase, user.id, parsed.transcript_id),
            });
          }

          if (action === "start_credit_mapping" || action === "regenerate_credit_mappings") {
            const summary = await startCreditMapping(supabase, user.id, payload);
            return json({ success: true, data: summary });
          }

          if (action === "regenerate_course_mapping") {
            const parsed = z.object({ transcript_id: uuid }).parse(payload);
            const summary = await startCreditMapping(supabase, user.id, parsed);
            return json({ success: true, data: summary });
          }

          if (action === "update_credit_mapping") {
            return json({
              success: true,
              data: await updateCreditMapping(supabase, user.id, payload),
            });
          }

          if (action === "confirm_credit_mapping") {
            return json({
              success: true,
              data: await setCreditMappingStatus(supabase, user.id, payload, "student_confirmed"),
            });
          }

          if (action === "reject_credit_mapping") {
            return json({
              success: true,
              data: await setCreditMappingStatus(supabase, user.id, payload, "rejected"),
            });
          }

          if (action === "mark_mapping_for_counselor_review") {
            return json({
              success: true,
              data: await setCreditMappingStatus(
                supabase,
                user.id,
                payload,
                "counselor_review_required",
              ),
            });
          }

          if (action === "start_gap_analysis" || action === "regenerate_gap_analysis") {
            return json({
              success: true,
              data: await startGapAnalysis(supabase, user.id, payload),
            });
          }

          if (action === "generate_academic_roadmap" || action === "regenerate_academic_roadmap") {
            return json({
              success: true,
              data: await startAcademicRoadmap(supabase, user.id, payload),
            });
          }

          if (action === "update_roadmap_item") {
            return json({
              success: true,
              data: await patchRoadmapItem(supabase, user.id, payload),
            });
          }

          if (action === "add_manual_roadmap_item") {
            return json({
              success: true,
              data: await createManualRoadmapItem(supabase, user.id, payload),
            });
          }

          return json(
            { success: false, error: { message: "Unsupported transcript action." } },
            { status: 400 },
          );
        } catch (error) {
          return publicError(error);
        }
      },
    },
  },
});
