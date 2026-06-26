import { privateFileSummary } from "./packet-safe-copy.ts";
import { missingSourceMessages } from "./packet-sources.ts";
import type {
  PacketAssemblyContext,
  PacketSectionKey,
  PacketSectionSnapshot,
  SourceSummaryItem,
} from "./types.ts";

function text(value: unknown, fallback = "Not recorded") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function studentName(profile: Record<string, unknown>) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Student";
}

function section(input: {
  key: PacketSectionKey;
  title: string;
  order: number;
  data: unknown;
  warnings?: string[];
  missingReason?: string | null;
  status?: PacketSectionSnapshot["status"];
}): PacketSectionSnapshot {
  return {
    key: input.key,
    title: input.title,
    order: input.order,
    status: input.status ?? (input.missingReason ? "missing_data" : "included"),
    data: input.data,
    missingReason: input.missingReason ?? null,
    warnings: input.warnings ?? [],
  };
}

function courseRows(context: PacketAssemblyContext) {
  return context.transcriptCourses.map((course) => ({
    id: course.id,
    originalCourseName: course.course_name_original,
    translatedCourseName: course.course_name_translated,
    subjectCategory: course.subject_category,
    originalGradeOrMarks: course.grade_original,
    maxMarksOrScale: course.max_marks ?? course.grade_scale_original,
    academicYear: course.academic_year ?? course.academic_year_label,
    term: course.term_label_translated ?? course.term_label_original ?? course.semester,
    entryMethod: course.entry_method,
    extractionConfidence: course.extraction_confidence,
    translationConfidence: course.translation_confidence,
    studentConfirmed: course.student_confirmed,
    reviewNotes: course.review_reason,
  }));
}

function mappingRows(context: PacketAssemblyContext) {
  return context.creditMappings.map((mapping) => ({
    id: mapping.id,
    transcriptCourseId: mapping.transcript_course_id,
    originalCourseName: mapping.original_course_name,
    translatedCourseName: mapping.translated_course_name,
    probableDestinationEquivalent:
      mapping.probable_destination_equivalent ?? mapping.probable_us_equivalent,
    destinationRequirementBucket: mapping.requirement_bucket ?? mapping.target_subject_category,
    possibleCreditValue: mapping.possible_credit_value ?? mapping.credits_mapped,
    creditUnit: mapping.credit_unit,
    mappingConfidence: mapping.mapping_confidence ?? mapping.confidence,
    mappingMethod: mapping.mapping_method,
    mappingStatus: mapping.mapping_status ?? mapping.status,
    counselorReviewRequired:
      mapping.counselor_review_required ?? mapping.needs_counselor_review ?? false,
    evidenceSummary: mapping.evidence_summary ?? mapping.mapping_reason,
    reviewReason: mapping.review_reason,
    warnings: mapping.warnings_json ?? [],
  }));
}

function requirementRows(context: PacketAssemblyContext) {
  return context.gapRequirements.map((requirement) => ({
    id: requirement.id,
    requirementName: requirement.requirement_name ?? requirement.subject_category,
    requirementCategory: requirement.requirement_category ?? requirement.subject_category,
    requirementType: requirement.requirement_type,
    requiredAmount: requirement.required_amount ?? requirement.credits_required,
    likelyEarned: requirement.earned_likely_amount ?? requirement.credits_mapped,
    possibleReviewAmount:
      number(requirement.earned_possible_amount) + number(requirement.earned_review_amount),
    missingAmount: requirement.missing_amount ?? requirement.credits_remaining,
    unitType: requirement.unit_type,
    status: requirement.status,
    riskLevel: requirement.risk_level,
    supportingCourses: requirement.supporting_course_names ?? [],
    unclearCourses: requirement.unclear_course_names ?? [],
    counselorReviewRequired: requirement.counselor_review_required,
    reviewReason: requirement.review_reason,
    studentExplanation: requirement.student_explanation ?? requirement.notes,
    counselorQuestion: requirement.counselor_question,
  }));
}

function roadmapRows(context: PacketAssemblyContext) {
  return context.roadmapItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    actionType: item.action_type,
    priority: item.priority,
    status: item.status,
    timingBucket: item.timing_bucket,
    dueWindowLabel: item.due_window_label ?? item.semester_target,
    riskLevel: item.risk_level,
    counselorReviewRequired: item.counselor_review_required,
    counselorQuestion: item.counselor_question,
    studentInstructions: item.student_instructions,
    evidenceNote: item.evidence_note,
    completionNote: item.completion_note,
  }));
}

export function collectCounselorQuestions(context: PacketAssemblyContext) {
  const questions = [
    ...((context.gapAnalysis.counselor_questions_json as string[] | undefined) ?? []),
    ...context.gapRequirements.map((requirement) => text(requirement.counselor_question, "")),
    ...((context.roadmap.counselor_questions_json as string[] | undefined) ?? []),
    ...context.roadmapItems.map((item) => text(item.counselor_question, "")),
  ];
  return Array.from(new Set(questions.map((question) => question.trim()).filter(Boolean)));
}

export function collectReviewWarnings(input: {
  context: PacketAssemblyContext;
  sourceWarnings: string[];
  pdfError: string;
  storageWarning: string;
}) {
  const warnings = [
    "This packet is a Scholaport preview for counselor review, not an official school evaluation.",
    input.pdfError,
    input.storageWarning,
    ...input.sourceWarnings,
  ];
  const lowTranslationRows = input.context.transcriptCourses.filter(
    (course) =>
      number(course.translation_confidence) > 0 && number(course.translation_confidence) < 0.75,
  );
  if (lowTranslationRows.length) warnings.push("Some translated transcript rows need review.");
  const reviewMappings = input.context.creditMappings.filter(
    (mapping) =>
      mapping.counselor_review_required ||
      mapping.needs_counselor_review ||
      ["low", "unclear"].includes(String(mapping.mapping_confidence ?? mapping.confidence)),
  );
  if (reviewMappings.length) warnings.push("Some probable credit mappings need counselor review.");
  const localRequirements = input.context.gapRequirements.filter(
    (requirement) =>
      requirement.counselor_review_required ||
      requirement.requirement_type === "local_requirement" ||
      requirement.status === "counselor_review_required",
  );
  if (localRequirements.length)
    warnings.push("Local-control or counselor-review items remain unresolved.");
  return Array.from(new Set(warnings.filter(Boolean)));
}

function sourceSectionData(input: {
  context: PacketAssemblyContext;
  missingSourceWarnings: string[];
}) {
  return {
    sources: input.context.sourceSummary,
    missingSources: input.missingSourceWarnings,
    note: input.context.sourceSummary.length
      ? "Only linked Scholaport reference sources are shown."
      : "Source not yet linked in Scholaport reference database.",
  };
}

export function buildPacketSections(input: {
  context: PacketAssemblyContext;
  missingSourceWarnings: string[];
  pdfError: string;
  storageWarning: string;
}): PacketSectionSnapshot[] {
  const context = input.context;
  const profile = context.profile;
  const transcript = context.transcript;
  const sourceFrameworkLabel =
    transcript.selected_source_curriculum_label ??
    transcript.detected_source_curriculum_label ??
    profile.source_curriculum ??
    null;
  const profileRows = {
    studentName: studentName(profile),
    sourceCountry: profile.destination_country_label
      ? profile.origin_country
      : profile.origin_country,
    sourceCurriculum: sourceFrameworkLabel,
    sourceJurisdiction:
      transcript.selected_source_jurisdiction_label ??
      transcript.detected_source_jurisdiction_label,
    destinationCountry:
      profile.destination_country_label ?? profile.destination_country ?? profile.target_country,
    destinationJurisdiction: profile.destination_jurisdiction_label ?? profile.target_state,
    destinationFramework:
      profile.destination_framework_label ??
      context.destinationFramework?.framework_name ??
      context.destinationFramework?.name,
    gradeAtTransfer: profile.grade_at_transfer,
    expectedGraduationYear: profile.expected_graduation_year,
    targetSchool: profile.target_school,
    targetDistrict: profile.target_district,
    targetProgram: profile.destination_program_label ?? profile.target_program,
  };
  return [
    section({
      key: "cover",
      title: "Cover Page",
      order: 1,
      data: {
        packetTitle: "Counselor-ready Scholaport packet",
        ...profileRows,
        generatedAt: context.generatedAt,
        packetStatus: "Scholaport preview",
      },
    }),
    section({
      key: "student_academic_snapshot",
      title: "Student Academic Snapshot",
      order: 2,
      data: {
        ...profileRows,
        localControlNote:
          context.gapAnalysis.local_review_required || context.roadmap.counselor_review_items
            ? "Some items require local school or counselor review."
            : null,
      },
    }),
    section({
      key: "transcript_summary",
      title: "Transcript Summary",
      order: 3,
      data: {
        filename: transcript.original_filename,
        uploadDate: transcript.created_at,
        ocrStatus: transcript.ocr_status ?? transcript.status,
        translationStatus: transcript.translation_status,
        primaryDetectedLanguage: transcript.primary_language_code ?? transcript.original_language,
        selectedTranscriptSourceFramework: sourceFrameworkLabel,
        frameworkMatchStatus: transcript.framework_match_status,
        ocrConfidence: transcript.ocr_confidence,
        translationConfidence: transcript.translation_confidence,
        requiresUserConfirmation: transcript.requires_user_confirmation,
        confirmationStatus: transcript.confirmation_status,
      },
    }),
    section({
      key: "course_translation_review",
      title: "Original + Translated Transcript Course List",
      order: 4,
      data: { courses: courseRows(context) },
    }),
    section({
      key: "probable_credit_mapping",
      title: "Probable Credit Mapping Summary",
      order: 5,
      data: {
        mappingRun: context.mappingRun,
        mappings: mappingRows(context),
      },
      warnings: context.creditMappings.some((mapping) => mapping.counselor_review_required)
        ? ["Some mappings require counselor confirmation."]
        : [],
    }),
    section({
      key: "graduation_gap_summary",
      title: "Graduation Gap Summary",
      order: 6,
      data: {
        destinationFramework: profileRows.destinationFramework,
        totalRequiredCredits:
          context.gapAnalysis.total_required_credits ?? context.gapAnalysis.total_credits_required,
        likelyEarnedCredits:
          context.gapAnalysis.total_likely_earned_credits ??
          context.gapAnalysis.total_credits_mapped,
        possibleReviewCredits: context.gapAnalysis.total_possible_earned_credits,
        missingCredits: context.gapAnalysis.total_missing_credits,
        overallRiskLevel: context.gapAnalysis.overall_risk_level,
        satisfiedRequirementCount: context.gapAnalysis.satisfied_requirement_count,
        partialRequirementCount: context.gapAnalysis.partial_requirement_count,
        missingRequirementCount: context.gapAnalysis.missing_requirement_count,
        counselorReviewRequirementCount: context.gapAnalysis.counselor_review_requirement_count,
        assessmentGapCount: context.gapAnalysis.assessment_gap_count,
        localReviewRequired: context.gapAnalysis.local_review_required,
        summaryText: context.gapAnalysis.summary_text ?? context.gapAnalysis.analysis_summary,
      },
    }),
    section({
      key: "requirement_checklist",
      title: "Requirement-by-Requirement Checklist",
      order: 7,
      data: { requirements: requirementRows(context) },
    }),
    section({
      key: "academic_roadmap",
      title: "Academic Roadmap Summary",
      order: 8,
      data: {
        roadmapStatus: context.roadmap.status,
        timelineUrgency: context.roadmap.timeline_urgency,
        overallRiskLevel: context.roadmap.overall_risk_level,
        summaryText: context.roadmap.summary_text,
        timelineSummary: context.roadmap.timeline_summary,
        items: roadmapRows(context),
      },
    }),
    section({
      key: "counselor_meeting_checklist",
      title: "Counselor Meeting Checklist",
      order: 9,
      data: {
        questions: collectCounselorQuestions(context),
      },
    }),
    section({
      key: "review_flags_limitations",
      title: "Review Flags and Limitations",
      order: 10,
      data: {
        warnings: collectReviewWarnings({
          context,
          sourceWarnings: input.missingSourceWarnings,
          pdfError: input.pdfError,
          storageWarning: input.storageWarning,
        }),
      },
      status: "needs_review",
    }),
    section({
      key: "source_provenance_summary",
      title: "Source / Provenance Summary",
      order: 11,
      data: sourceSectionData({ context, missingSourceWarnings: input.missingSourceWarnings }),
      warnings: input.missingSourceWarnings,
    }),
    section({
      key: "attachments_original_transcript",
      title: "Attachments / Original Transcript Reference",
      order: 12,
      data: privateFileSummary(transcript),
    }),
  ];
}

export function missingSourceWarnings(context: PacketAssemblyContext) {
  return missingSourceMessages({
    frameworkId: String(
      context.destinationFramework?.id ?? context.profile.destination_framework_id ?? "",
    ),
    requirementIds: context.graduationRequirements
      .map((requirement) => String(requirement.id ?? ""))
      .filter(Boolean),
    sourceSummary: context.sourceSummary as SourceSummaryItem[],
  });
}
