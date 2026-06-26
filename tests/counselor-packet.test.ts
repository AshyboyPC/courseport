import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCounselorPacketSnapshot } from "../src/lib/packet/packet-snapshot.ts";
import { privateFileSummary } from "../src/lib/packet/packet-safe-copy.ts";

const context = {
  userId: "00000000-0000-0000-0000-000000000001",
  generatedAt: "2026-06-25T12:00:00.000Z",
  profile: {
    id: "10000000-0000-0000-0000-000000000001",
    first_name: "Asha",
    last_name: "Raman",
    origin_country: "India",
    source_curriculum: "Tamil Nadu State Board",
    destination_country_label: "United States",
    destination_jurisdiction_label: "Georgia",
    destination_framework_label: "Georgia High School Graduation Requirements",
    grade_at_transfer: 11,
    expected_graduation_year: 2027,
    target_school: "Northview High",
  },
  transcript: {
    id: "20000000-0000-0000-0000-000000000001",
    original_filename: "asha-transcript.pdf",
    storage_path: "private/user/path.pdf",
    created_at: "2026-06-25T11:00:00.000Z",
    confirmation_status: "confirmed",
    ocr_status: "succeeded",
    translation_status: "succeeded",
    primary_language_code: "ta",
    framework_match_status: "matched_profile",
  },
  transcriptCourses: [
    {
      id: "30000000-0000-0000-0000-000000000001",
      course_name_original: "கணிதம்",
      course_name_translated: "Mathematics",
      subject_category: "mathematics",
      grade_original: "92",
      max_marks: "100",
      student_confirmed: true,
      extraction_confidence: 0.94,
      translation_confidence: 0.93,
      entry_method: "ocr_translated",
    },
  ],
  mappingRun: {
    id: "40000000-0000-0000-0000-000000000001",
    status: "needs_review",
  },
  creditMappings: [
    {
      id: "50000000-0000-0000-0000-000000000001",
      transcript_course_id: "30000000-0000-0000-0000-000000000001",
      original_course_name: "கணிதம்",
      translated_course_name: "Mathematics",
      probable_destination_equivalent: "Mathematics credit",
      requirement_bucket: "mathematics",
      possible_credit_value: 1,
      mapping_confidence: "medium",
      mapping_method: "deterministic_taxonomy",
      counselor_review_required: true,
      evidence_summary: "Subject category matched mathematics.",
    },
  ],
  gapAnalysis: {
    id: "60000000-0000-0000-0000-000000000001",
    total_required_credits: 23,
    total_likely_earned_credits: 1,
    total_possible_earned_credits: 2,
    total_missing_credits: 21,
    overall_risk_level: "yellow",
    missing_requirement_count: 1,
    counselor_review_requirement_count: 1,
    counselor_questions_json: ["Can my Mathematics coursework count toward math credit?"],
  },
  gapRequirements: [
    {
      id: "70000000-0000-0000-0000-000000000001",
      requirement_name: "Mathematics",
      requirement_category: "mathematics",
      requirement_type: "subject_credit",
      required_amount: 4,
      earned_likely_amount: 1,
      earned_possible_amount: 1,
      earned_review_amount: 0,
      missing_amount: 2,
      status: "partially_satisfied",
      risk_level: "yellow",
      supporting_course_names: ["Mathematics"],
      counselor_review_required: true,
      counselor_question: "How much math credit can be awarded?",
    },
  ],
  roadmap: {
    id: "80000000-0000-0000-0000-000000000001",
    status: "needs_review",
    timeline_urgency: "high",
    overall_risk_level: "yellow",
    summary_text: "Review math credit before registration.",
    counselor_questions_json: ["Which math course should I take next?"],
  },
  roadmapItems: [
    {
      id: "90000000-0000-0000-0000-000000000001",
      title: "Ask about Mathematics",
      description: "Confirm math placement.",
      action_type: "counselor_question",
      priority: "high",
      status: "needs_counselor",
      timing_bucket: "counselor_meeting",
      counselor_review_required: true,
      counselor_question: "Which math course should I take next?",
    },
  ],
  destinationFramework: {
    id: "a0000000-0000-0000-0000-000000000001",
    name: "Georgia High School Graduation Requirements",
  },
  graduationRequirements: [
    {
      id: "b0000000-0000-0000-0000-000000000001",
      subject_category: "mathematics",
    },
  ],
  sourceSummary: [
    {
      tableName: "destination_graduation_frameworks",
      recordId: "a0000000-0000-0000-0000-000000000001",
      sourceTitle: "Georgia graduation rules",
      sourceUrl: "https://example.edu/georgia",
      sourceAuthority: "Georgia Department of Education",
    },
  ],
};

describe("counselor packet engine", () => {
  it("builds packet snapshot sections from real context data", () => {
    const built = buildCounselorPacketSnapshot(context);
    assert.match(built.snapshot.title, /Asha Raman/);
    assert.equal(built.snapshot.sections.length, 12);
    assert.ok(
      built.snapshot.sections.some((section) => section.key === "course_translation_review"),
    );
    assert.match(JSON.stringify(built.snapshot.sections), /கணிதம்/);
    assert.match(JSON.stringify(built.snapshot.sections), /Mathematics credit/);
  });

  it("includes credit mapping confidence and counselor review flags", () => {
    const built = buildCounselorPacketSnapshot(context);
    const mapping = built.snapshot.sections.find(
      (section) => section.key === "probable_credit_mapping",
    );
    assert.match(JSON.stringify(mapping), /medium/);
    assert.match(JSON.stringify(mapping), /counselorReviewRequired/);
  });

  it("includes gap summary requirement checklist roadmap items and real questions", () => {
    const built = buildCounselorPacketSnapshot(context);
    assert.match(JSON.stringify(built.snapshot.sections), /Graduation Gap Summary/);
    assert.match(JSON.stringify(built.snapshot.sections), /Requirement-by-Requirement Checklist/);
    assert.match(JSON.stringify(built.snapshot.sections), /Ask about Mathematics/);
    assert.match(built.snapshot.counselorQuestions.join("\n"), /Which math course/);
  });

  it("handles missing provenance honestly", () => {
    const built = buildCounselorPacketSnapshot({
      ...context,
      sourceSummary: [],
    });
    const sourceSection = built.snapshot.sections.find(
      (section) => section.key === "source_provenance_summary",
    );
    assert.match(JSON.stringify(sourceSection), /Source not yet linked/);
  });

  it("does not expose raw transcript storage paths in safe summaries", () => {
    const summary = privateFileSummary(context.transcript);
    assert.equal(summary.originalFileStoredPrivately, true);
    assert.doesNotMatch(JSON.stringify(summary), /private\/user\/path/);
  });

  it("records honest printable HTML and PDF limitation behavior", () => {
    const built = buildCounselorPacketSnapshot(context);
    assert.match(built.printableHtml, /Scholaport preview/);
    assert.match(built.snapshot.warnings.join("\n"), /PDF generation is not configured/);
    assert.notEqual(built.status, "pdf_ready");
  });

  it("migration adds packet fields sections and stale triggers", () => {
    const migration = readFileSync(
      "supabase/migrations/202606250005_counselor_packet_engine.sql",
      "utf8",
    );
    assert.match(migration, /packet_snapshot_json/);
    assert.match(migration, /counselor_packet_sections/);
    assert.match(migration, /generated_file_storage_path/);
    assert.match(migration, /mark_packets_stale_from_roadmap/);
    assert.match(migration, /student_profiles_mark_packet_stale/);
  });

  it("service enforces full packet prerequisites and ownership filters", () => {
    const service = readFileSync("src/lib/packet/packet-service.server.ts", "utf8");
    assert.match(service, /\.eq\("user_id", userId\)/);
    assert.match(service, /Complete onboarding before generating a counselor packet/);
    assert.match(service, /Review and confirm your extracted courses first/);
    assert.match(service, /Generate probable credit mapping first/);
    assert.match(service, /Run graduation gap analysis first/);
    assert.match(service, /Generate academic roadmap first/);
  });

  it("API and UI expose packet states without hardcoded fake packet content", () => {
    const route = readFileSync("src/routes/api/v1/packets.ts", "utf8");
    const page = readFileSync("src/routes/packet.tsx", "utf8");
    assert.match(route, /generate_counselor_packet/);
    assert.match(route, /get_packet_download_url/);
    assert.match(page, /Generate counselor packet/);
    assert.match(page, /Run graduation gap analysis first/);
    assert.match(page, /Generate academic roadmap first/);
    assert.doesNotMatch(page, /Which mapped credits can be confirmed today/);
    assert.doesNotMatch(page, /19 JUN 2026|PathMatch insight|AP U\.S\. History/);
  });

  it("production packet files do not import test fixtures or expose secrets", () => {
    const page = readFileSync("src/routes/packet.tsx", "utf8");
    const service = readFileSync("src/lib/packet/packet-service.server.ts", "utf8");
    assert.doesNotMatch(page, /mockPacket|demoPacket|fixture/i);
    assert.doesNotMatch(service, /mockPacket|demoPacket|fixture/i);
    assert.doesNotMatch(page, /SERVICE_ROLE|OPENAI_API_KEY|GEMINI_API_KEY/);
  });
});
