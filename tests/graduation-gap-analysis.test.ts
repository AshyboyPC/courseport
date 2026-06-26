import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateGapAnalysis } from "../src/lib/gaps/gap-calculator.server.ts";

describe("graduation gap analysis engine", () => {
  it("counts high-confidence clean mappings toward likely earned credits", () => {
    const result = calculateGapAnalysis({
      frameworkTotalCredits: 23,
      requirements: [
        {
          id: "00000000-0000-0000-0000-000000000001",
          subject_category: "mathematics",
          credits_required: 4,
          unit_name: "credit",
        },
      ],
      mappings: [
        {
          id: "10000000-0000-0000-0000-000000000001",
          transcript_course_id: "20000000-0000-0000-0000-000000000001",
          mapped_subject_category: "mathematics",
          possible_credit_value: 4,
          mapping_confidence: "high",
          counselor_review_required: false,
          mapping_status: "candidate",
          translated_course_name: "Mathematics",
        },
      ],
      gradeAtTransfer: 10,
    });
    const math = result.requirements.find((item) => item.requirementCategory === "mathematics");
    assert.equal(math?.status, "likely_satisfied");
    assert.equal(math?.earnedLikelyAmount, 4);
  });

  it("counts medium-confidence mappings as possible partial, not fully satisfied", () => {
    const result = calculateGapAnalysis({
      requirements: [
        {
          id: "00000000-0000-0000-0000-000000000002",
          subject_category: "science",
          credits_required: 4,
        },
      ],
      mappings: [
        {
          id: "10000000-0000-0000-0000-000000000002",
          transcript_course_id: "20000000-0000-0000-0000-000000000002",
          mapped_subject_category: "science",
          possible_credit_value: 3,
          mapping_confidence: "medium",
          counselor_review_required: false,
          mapping_status: "candidate",
          translated_course_name: "Science",
        },
      ],
    });
    const science = result.requirements.find((item) => item.requirementCategory === "science");
    assert.equal(science?.status, "partially_satisfied");
    assert.equal(science?.earnedLikelyAmount, 0);
    assert.equal(science?.earnedPossibleAmount, 3);
  });

  it("does not satisfy requirements with low unclear or rejected mappings", () => {
    const result = calculateGapAnalysis({
      requirements: [
        {
          id: "00000000-0000-0000-0000-000000000003",
          subject_category: "english_language_arts",
          credits_required: 4,
        },
      ],
      mappings: [
        {
          id: "10000000-0000-0000-0000-000000000003",
          transcript_course_id: "20000000-0000-0000-0000-000000000003",
          mapped_subject_category: "english_language_arts",
          possible_credit_value: 4,
          mapping_confidence: "low",
          mapping_status: "candidate",
          translated_course_name: "English",
        },
        {
          id: "10000000-0000-0000-0000-000000000004",
          transcript_course_id: "20000000-0000-0000-0000-000000000004",
          mapped_subject_category: "english_language_arts",
          possible_credit_value: 4,
          mapping_confidence: "high",
          mapping_status: "rejected",
          translated_course_name: "Rejected English",
        },
      ],
    });
    const english = result.requirements.find(
      (item) => item.requirementCategory === "english_language_arts",
    );
    assert.equal(english?.status, "partially_satisfied");
    assert.equal(english?.earnedLikelyAmount, 0);
    assert.equal(english?.earnedReviewAmount, 4);
  });

  it("does not satisfy U.S. History from generic foreign social studies", () => {
    const result = calculateGapAnalysis({
      requirements: [
        {
          id: "00000000-0000-0000-0000-000000000004",
          subject_category: "social_studies",
          specific_courses: ["U.S. History"],
          credits_required: 1,
          notes: "State-specific U.S. History requirement.",
        },
      ],
      mappings: [
        {
          id: "10000000-0000-0000-0000-000000000005",
          transcript_course_id: "20000000-0000-0000-0000-000000000005",
          mapped_subject_category: "social_studies",
          possible_credit_value: 1,
          mapping_confidence: "high",
          mapping_status: "candidate",
          counselor_review_required: false,
          translated_course_name: "Indian Social Science",
        },
      ],
      gradeAtTransfer: 12,
    });
    const social = result.requirements.find((item) => item.requirementName === "U.S. History");
    assert.equal(social?.status, "missing");
    assert.equal(social?.riskLevel, "red");
    assert.match(social?.counselorQuestion ?? "", /U\.S\.-specific history|U.S.-specific history/);
  });

  it("marks assessment requirements missing unless explicitly satisfied", () => {
    const result = calculateGapAnalysis({
      requirements: [
        {
          id: "00000000-0000-0000-0000-000000000005",
          subject_category: "assessment",
          requirement_kind: "assessment",
          notes: "Texas STAAR EOC participation requirement.",
        },
      ],
      mappings: [],
    });
    const assessment = result.requirements.find((item) => item.requirementType === "assessment");
    assert.equal(assessment?.status, "missing");
    assert.equal(assessment?.priority, "critical");
  });

  it("raises urgency for grade 11 or 12 missing core requirements", () => {
    const result = calculateGapAnalysis({
      requirements: [
        {
          id: "00000000-0000-0000-0000-000000000006",
          subject_category: "mathematics",
          credits_required: 4,
        },
      ],
      mappings: [],
      gradeAtTransfer: 12,
    });
    const math = result.requirements.find((item) => item.requirementCategory === "mathematics");
    assert.equal(math?.priority, "critical");
  });

  it("adds migration fields, statuses, and stale triggers", () => {
    const migration = readFileSync(
      "supabase/migrations/202606250003_graduation_gap_analysis_engine.sql",
      "utf8",
    );
    assert.match(migration, /overall_risk_level/);
    assert.match(migration, /credit_mapping_run_id/);
    assert.match(migration, /gap_requirements_status_check/);
    assert.match(migration, /mark_gap_analysis_stale_from_mapping/);
    assert.match(migration, /mark_gap_analysis_stale_from_course/);
  });

  it("service enforces prerequisites and ownership filters", () => {
    const service = readFileSync("src/lib/gaps/gap-service.server.ts", "utf8");
    assert.match(service, /\.eq\("user_id", userId\)/);
    assert.match(service, /confirmation_status !== "confirmed"/);
    assert.match(service, /Generate probable credit mapping first/);
    assert.match(service, /Requirements for this state are not ready yet/);
  });

  it("API and frontend expose gap generation states safely", () => {
    const route = readFileSync("src/routes/api/v1/transcripts.ts", "utf8");
    const page = readFileSync("src/routes/gaps.tsx", "utf8");
    assert.match(route, /start_gap_analysis/);
    assert.match(route, /regenerate_gap_analysis/);
    assert.match(page, /Upload and confirm your transcript first/);
    assert.match(page, /Generate probable credit mapping first/);
    assert.match(page, /Run graduation gap analysis/);
    assert.match(page, /Final graduation and transfer-credit decisions are made by your school/);
    assert.doesNotMatch(page, /OPENAI_API_KEY|GEMINI_API_KEY|SERVICE_ROLE/);
  });
});
