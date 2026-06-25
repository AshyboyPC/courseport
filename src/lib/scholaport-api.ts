import { z } from "zod";
import { requireSupabase } from "@/lib/supabase";

const nullableString = z.string().nullable();

export const StudentProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  first_name: z.string(),
  last_name: nullableString,
  origin_country: z.string(),
  source_curriculum: z.string(),
  destination_country: z.string(),
  target_state: z.string(),
  target_district: nullableString,
  target_school: nullableString,
  target_program: nullableString,
  grade_at_transfer: z.number().int().min(9).max(12),
  expected_graduation_year: z.number().int().nullable(),
  preferred_language: z.string(),
  source_country_id: z.string().uuid().nullable(),
  source_curriculum_id: z.string().uuid().nullable(),
  destination_country_id: z.string().uuid().nullable(),
  destination_jurisdiction_id: z.string().uuid().nullable(),
  destination_framework_id: z.string().uuid().nullable(),
  destination_program_id: z.string().uuid().nullable(),
  destination_country_label: nullableString,
  destination_jurisdiction_label: nullableString,
  destination_framework_label: nullableString,
  destination_program_label: nullableString,
  applicable_cohort: nullableString,
  framework_version_label: nullableString,
  created_at: z.string(),
  updated_at: z.string(),
});
export type StudentProfile = z.infer<typeof StudentProfileSchema>;

export const StudentProfileInputSchema = StudentProfileSchema.pick({
  first_name: true,
  last_name: true,
  origin_country: true,
  source_curriculum: true,
  destination_country: true,
  target_state: true,
  target_district: true,
  target_school: true,
  target_program: true,
  grade_at_transfer: true,
  expected_graduation_year: true,
  preferred_language: true,
  source_country_id: true,
  source_curriculum_id: true,
  destination_country_id: true,
  destination_jurisdiction_id: true,
  destination_framework_id: true,
  destination_program_id: true,
  destination_country_label: true,
  destination_jurisdiction_label: true,
  destination_framework_label: true,
  destination_program_label: true,
  applicable_cohort: true,
  framework_version_label: true,
});
export type StudentProfileInput = z.infer<typeof StudentProfileInputSchema>;

export const TranscriptSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  student_profile_id: z.string().uuid(),
  original_filename: nullableString,
  file_type: nullableString,
  storage_path: nullableString,
  upload_status: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Transcript = z.infer<typeof TranscriptSchema>;

export const TranscriptCourseSchema = z.object({
  id: z.string().uuid(),
  transcript_id: z.string().uuid(),
  course_name_original: z.string(),
  course_name_translated: nullableString,
  subject_category: nullableString,
  credits: z.coerce.number(),
  grade_original: nullableString,
  mapping_status: z.string(),
});
export type TranscriptCourse = z.infer<typeof TranscriptCourseSchema>;

export const CreditMappingSchema = z.object({
  id: z.string().uuid(),
  transcript_course_id: z.string().uuid(),
  student_profile_id: z.string().uuid(),
  target_subject_category: z.string(),
  probable_us_equivalent: nullableString,
  credits_mapped: z.coerce.number().nullable(),
  confidence: z.string(),
  mapping_reason: nullableString,
  needs_counselor_review: z.boolean(),
  status: z.string(),
});
export type CreditMapping = z.infer<typeof CreditMappingSchema>;

export const GapRequirementSchema = z.object({
  id: z.string().uuid(),
  gap_analysis_id: z.string().uuid(),
  user_id: z.string().uuid(),
  subject_category: z.string(),
  credits_required: z.coerce.number(),
  credits_mapped: z.coerce.number(),
  credits_remaining: z.coerce.number(),
  status: z.string(),
  priority: z.string(),
  notes: nullableString,
  suggested_actions: z.array(z.string()),
});
export type GapRequirement = z.infer<typeof GapRequirementSchema>;

export const GapAnalysisSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  student_profile_id: z.string().uuid(),
  transcript_id: z.string().uuid(),
  total_credits_required: z.coerce.number(),
  total_credits_mapped: z.coerce.number(),
  overall_status: z.string(),
  analysis_summary: nullableString,
  created_at: z.string(),
});
export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

export const RoadmapItemSchema = z.object({
  id: z.string().uuid(),
  roadmap_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  description: nullableString,
  subject_category: nullableString,
  credits_needed: z.coerce.number().nullable(),
  semester_target: nullableString,
  priority: z.string(),
  completion_method: nullableString,
  status: z.string(),
  order_index: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type RoadmapItem = z.infer<typeof RoadmapItemSchema>;

export const RoadmapSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  student_profile_id: z.string().uuid(),
  gap_analysis_id: z.string().uuid().nullable(),
  title: z.string(),
  estimated_graduation_date: nullableString,
  is_on_track: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Roadmap = z.infer<typeof RoadmapSchema>;

export const PathMatchSchema = z.object({
  id: z.string().uuid(),
  origin_country: z.string(),
  source_curriculum: z.string(),
  grade_at_transfer: z.number().int().nullable(),
  target_state: z.string(),
  target_program: nullableString,
  credits_transferred: z.record(z.string(), z.number()),
  credits_not_transferred: z.record(z.string(), z.number()),
  biggest_challenges: z.array(z.string()),
  advice_for_future: nullableString,
  graduated_on_time: z.boolean().nullable(),
  is_verified: z.boolean(),
});
export type PathMatch = z.infer<typeof PathMatchSchema>;

export const TwinMentorSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string(),
  origin_country: z.string(),
  source_curriculum: z.string(),
  target_state: z.string(),
  target_program: nullableString,
  topics_of_expertise: z.array(z.string()),
  is_verified: z.boolean(),
  is_available: z.boolean(),
});
export type TwinMentor = z.infer<typeof TwinMentorSchema>;

export const TwinQuestionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  question_text: z.string(),
  selected_prompt: nullableString,
  anonymous: z.boolean(),
  status: z.string(),
  created_at: z.string(),
});
export type TwinQuestion = z.infer<typeof TwinQuestionSchema>;

export const GuideTopicSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: nullableString,
  category: z.string(),
  icon_name: nullableString,
  reading_time_minutes: z.number().int(),
  order_index: z.number().int(),
  is_published: z.boolean(),
});
export type GuideTopic = z.infer<typeof GuideTopicSchema>;

export const GuideArticleSchema = z.object({
  id: z.string().uuid(),
  topic_id: z.string().uuid(),
  language: z.string(),
  title: z.string(),
  content: z.string(),
  key_takeaways: z.array(z.string()),
  is_published: z.boolean(),
});
export type GuideArticle = z.infer<typeof GuideArticleSchema>;

export const AdvisorMessageSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  sources: z.array(z.string()),
  confidence: nullableString,
  model_used: nullableString,
  created_at: z.string(),
});
export type AdvisorMessage = z.infer<typeof AdvisorMessageSchema>;

export type PassportSummary = {
  profile: StudentProfile;
  transcript: Transcript | null;
  gapAnalysis: GapAnalysis | null;
  gapRequirements: GapRequirement[];
  roadmap: Roadmap | null;
  roadmapItems: RoadmapItem[];
};

async function getUserId(): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You must be signed in to access Scholaport data.");
  return data.user.id;
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getCurrentProfile(): Promise<StudentProfile | null> {
  const client = requireSupabase();
  const userId = await getUserId();
  const { data, error } = await client
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  throwIfError(error);
  return data ? StudentProfileSchema.parse(data) : null;
}

export async function upsertCurrentProfile(input: StudentProfileInput): Promise<StudentProfile> {
  const client = requireSupabase();
  const userId = await getUserId();
  const parsed = StudentProfileInputSchema.parse(input);
  const { data, error } = await client
    .from("student_profiles")
    .upsert(
      { ...parsed, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  throwIfError(error);
  return StudentProfileSchema.parse(data);
}

export async function getPassportSummary(): Promise<PassportSummary> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Complete onboarding before loading your academic passport.");
  const client = requireSupabase();
  const userId = await getUserId();
  const [transcriptResult, gapResult, roadmapResult] = await Promise.all([
    client
      .from("transcripts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("gap_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  throwIfError(transcriptResult.error);
  throwIfError(gapResult.error);
  throwIfError(roadmapResult.error);
  const gapAnalysis = gapResult.data ? GapAnalysisSchema.parse(gapResult.data) : null;
  const roadmap = roadmapResult.data ? RoadmapSchema.parse(roadmapResult.data) : null;
  const [gapRequirementsResult, roadmapItemsResult] = await Promise.all([
    gapAnalysis
      ? client
          .from("gap_requirements")
          .select("*")
          .eq("gap_analysis_id", gapAnalysis.id)
          .order("priority")
      : Promise.resolve({ data: [], error: null }),
    roadmap
      ? client.from("roadmap_items").select("*").eq("roadmap_id", roadmap.id).order("order_index")
      : Promise.resolve({ data: [], error: null }),
  ]);
  throwIfError(gapRequirementsResult.error);
  throwIfError(roadmapItemsResult.error);
  return {
    profile,
    transcript: transcriptResult.data ? TranscriptSchema.parse(transcriptResult.data) : null,
    gapAnalysis,
    gapRequirements: z.array(GapRequirementSchema).parse(gapRequirementsResult.data ?? []),
    roadmap,
    roadmapItems: z.array(RoadmapItemSchema).parse(roadmapItemsResult.data ?? []),
  };
}

export async function getTranscriptCourses(): Promise<TranscriptCourse[]> {
  const client = requireSupabase();
  const userId = await getUserId();
  const { data: transcript, error: transcriptError } = await client
    .from("transcripts")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfError(transcriptError);
  if (!transcript) return [];
  const { data, error } = await client
    .from("transcript_courses")
    .select("*")
    .eq("transcript_id", transcript.id)
    .order("created_at");
  throwIfError(error);
  return z.array(TranscriptCourseSchema).parse(data ?? []);
}

export async function getCreditMappings(): Promise<CreditMapping[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];
  const { data, error } = await requireSupabase()
    .from("credit_mappings")
    .select("*")
    .eq("student_profile_id", profile.id)
    .order("created_at");
  throwIfError(error);
  return z.array(CreditMappingSchema).parse(data ?? []);
}

export async function getGapAnalysis(): Promise<{
  analysis: GapAnalysis | null;
  requirements: GapRequirement[];
}> {
  const summary = await getPassportSummary();
  return { analysis: summary.gapAnalysis, requirements: summary.gapRequirements };
}

export async function getRoadmap(): Promise<{ roadmap: Roadmap | null; items: RoadmapItem[] }> {
  const summary = await getPassportSummary();
  return { roadmap: summary.roadmap, items: summary.roadmapItems };
}

export async function updateRoadmapItemStatus(
  itemId: string,
  status: "pending" | "in_progress" | "completed" | "skipped",
): Promise<RoadmapItem> {
  const client = requireSupabase();
  const userId = await getUserId();
  const { data, error } = await client
    .from("roadmap_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("*")
    .single();
  throwIfError(error);
  return RoadmapItemSchema.parse(data);
}

export async function getPathMatches(): Promise<PathMatch[]> {
  const { data, error } = await requireSupabase()
    .from("pathmatch_paths")
    .select("*")
    .eq("is_verified", true)
    .order("created_at", { ascending: false })
    .limit(20);
  throwIfError(error);
  return z.array(PathMatchSchema).parse(data ?? []);
}

export async function getTwinMentors(): Promise<TwinMentor[]> {
  const { data, error } = await requireSupabase()
    .from("twin_mentors")
    .select("*")
    .eq("is_verified", true)
    .eq("is_available", true)
    .order("created_at");
  throwIfError(error);
  return z.array(TwinMentorSchema).parse(data ?? []);
}

export async function submitTwinQuestion(input: {
  questionText: string;
  selectedPrompt?: string;
  anonymous: boolean;
}): Promise<TwinQuestion> {
  const client = requireSupabase();
  const userId = await getUserId();
  const parsed = z
    .object({
      questionText: z.string().trim().min(5).max(1000),
      selectedPrompt: z.string().optional(),
      anonymous: z.boolean(),
    })
    .parse(input);
  const { data, error } = await client
    .from("twin_questions")
    .insert({
      user_id: userId,
      question_text: parsed.questionText,
      selected_prompt: parsed.selectedPrompt ?? null,
      anonymous: parsed.anonymous,
      status: "pending_moderation",
    })
    .select("*")
    .single();
  throwIfError(error);
  return TwinQuestionSchema.parse(data);
}

export async function getPendingTwinQuestions(): Promise<TwinQuestion[]> {
  const client = requireSupabase();
  const userId = await getUserId();
  const { data, error } = await client
    .from("twin_questions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending_moderation")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return z.array(TwinQuestionSchema).parse(data ?? []);
}

export async function getGuideTopics(): Promise<GuideTopic[]> {
  const { data, error } = await requireSupabase()
    .from("guide_topics")
    .select("*")
    .eq("is_published", true)
    .order("order_index");
  throwIfError(error);
  return z.array(GuideTopicSchema).parse(data ?? []);
}

export async function getGuideArticle(
  topicId: string,
  language = "en",
): Promise<GuideArticle | null> {
  const { data, error } = await requireSupabase()
    .from("guide_articles")
    .select("*")
    .eq("topic_id", topicId)
    .eq("language", language)
    .eq("is_published", true)
    .maybeSingle();
  throwIfError(error);
  return data ? GuideArticleSchema.parse(data) : null;
}

async function getOrCreateAdvisorSession(): Promise<string> {
  const client = requireSupabase();
  const userId = await getUserId();
  const { data: existing, error: existingError } = await client
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfError(existingError);
  if (existing) return existing.id;
  const { data, error } = await client
    .from("chat_sessions")
    .insert({ user_id: userId, title: "Academic advisor", context: {}, is_active: true })
    .select("id")
    .single();
  throwIfError(error);
  if (!data) throw new Error("Unable to create an advisor session.");
  return data.id;
}

export async function getAdvisorMessages(): Promise<AdvisorMessage[]> {
  const client = requireSupabase();
  const userId = await getUserId();
  const { data: session, error: sessionError } = await client
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfError(sessionError);
  if (!session) return [];
  const { data, error } = await client
    .from("chat_messages")
    .select("*")
    .eq("session_id", session.id)
    .order("created_at");
  throwIfError(error);
  return z.array(AdvisorMessageSchema).parse(data ?? []);
}

export async function saveAdvisorMessage(input: {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  confidence?: string;
  modelUsed?: string;
}): Promise<AdvisorMessage> {
  const client = requireSupabase();
  const sessionId = await getOrCreateAdvisorSession();
  const parsed = z
    .object({
      role: z.enum(["user", "assistant"]),
      content: z.string().trim().min(1),
      sources: z.array(z.string()).default([]),
      confidence: z.string().optional(),
      modelUsed: z.string().optional(),
    })
    .parse(input);
  const { data, error } = await client
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role: parsed.role,
      content: parsed.content,
      sources: parsed.sources,
      confidence: parsed.confidence ?? null,
      model_used: parsed.modelUsed ?? null,
    })
    .select("*")
    .single();
  throwIfError(error);
  await client
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  return AdvisorMessageSchema.parse(data);
}

export async function createTranscriptUpload(
  file: File,
): Promise<{ transcript: Transcript; storageUploaded: boolean }> {
  const client = requireSupabase();
  const userId = await getUserId();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Complete onboarding before uploading a transcript.");
  const transcriptId = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userId}/${transcriptId}/${safeName}`;
  const storageResult = await client.storage.from("transcripts").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  const storageUploaded = !storageResult.error;
  const { data, error } = await client
    .from("transcripts")
    .insert({
      id: transcriptId,
      user_id: userId,
      student_profile_id: profile.id,
      original_filename: file.name,
      file_type: file.type || null,
      storage_path: storageUploaded ? storagePath : null,
      storage_error: storageResult.error?.message ?? null,
      upload_status: storageUploaded ? "uploaded_processing" : "uploaded_metadata_only",
      status: "pending",
    })
    .select("*")
    .single();
  throwIfError(error);
  return { transcript: TranscriptSchema.parse(data), storageUploaded };
}
