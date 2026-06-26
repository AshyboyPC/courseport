import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifySubjectDeterministically } from "../src/lib/mapping/subject-taxonomy.ts";
import {
  computeMappingConfidence,
  requiresCounselorReview,
} from "../src/lib/mapping/mapping-confidence.ts";
import { safeParseAiMappingJson } from "../src/lib/mapping/mapping-validators.ts";

describe("credit mapping engine", () => {
  it("classifies common English courses deterministically", () => {
    assert.equal(
      classifySubjectDeterministically({ translated: "Algebra II" }).category,
      "mathematics",
    );
    assert.equal(classifySubjectDeterministically({ translated: "Biology" }).category, "science");
    assert.equal(
      classifySubjectDeterministically({ translated: "English Language & Literature" }).category,
      "english_language_arts",
    );
  });

  it("classifies Tamil Hindi and Spanish course names", () => {
    assert.equal(classifySubjectDeterministically({ original: "கணிதம்" }).category, "mathematics");
    assert.equal(classifySubjectDeterministically({ original: "भौतिकी" }).category, "science");
    assert.equal(
      classifySubjectDeterministically({ original: "Matemáticas" }).category,
      "mathematics",
    );
  });

  it("does not treat generic social science as high confidence for U.S. state requirements", () => {
    const confidence = computeMappingConfidence({
      method: "deterministic_taxonomy",
      category: "social_studies",
      hasDestinationRequirement: true,
      destinationFrameworkStatus: "partial",
      sourceFrameworkComplete: true,
      requirementText: "U.S. History and Government",
      deterministicConfidence: "medium",
    });
    assert.equal(confidence, "low");
    assert.equal(
      requiresCounselorReview({
        confidence,
        requirementText: "U.S. History and Government",
        sourceFrameworkComplete: true,
        destinationFrameworkStatus: "partial",
        creditsMissing: false,
        category: "social_studies",
      }),
      true,
    );
  });

  it("requires review for world language and health/PE mappings", () => {
    assert.equal(
      requiresCounselorReview({
        confidence: "medium",
        sourceFrameworkComplete: true,
        destinationFrameworkStatus: "verified",
        creditsMissing: false,
        category: "physical_education",
      }),
      true,
    );
    assert.equal(
      classifySubjectDeterministically({ original: "தமிழ்" }).category,
      "world_language",
    );
  });

  it("accepts schema-valid structured AI JSON and rejects invalid JSON", () => {
    const valid = safeParseAiMappingJson(
      JSON.stringify({
        original_course_name: "கணிதம்",
        translated_course_name: "Mathematics",
        normalized_course_name: "mathematics",
        source_subject_category: "mathematics",
        mapped_subject_category: "mathematics",
        probable_destination_equivalent: "Mathematics credit",
        requirement_bucket: "mathematics",
        possible_credit_value: null,
        credit_unit: "unknown",
        confidence: "medium",
        counselor_review_required: true,
        review_reason: "Credit amount requires counselor review.",
        evidence_summary: "Course maps to a broad math bucket.",
        warnings: ["Probable mapping only."],
      }),
    );
    assert.equal(valid?.mapped_subject_category, "mathematics");
    assert.equal(safeParseAiMappingJson("{nope"), null);
  });

  it("adds additive database support for mapping candidates and runs", () => {
    const migration = readFileSync(
      "supabase/migrations/202606250002_credit_mapping_engine.sql",
      "utf8",
    );
    assert.match(migration, /create table if not exists public\.credit_mapping_runs/);
    assert.match(
      migration,
      /alter table public\.credit_mappings add column if not exists mapping_method/,
    );
    assert.match(migration, /reference_embeddings/);
    assert.match(migration, /users manage own mapping runs/);
  });

  it("server route requires confirmed transcript courses before mapping and verifies ownership", () => {
    const service = readFileSync("src/lib/mapping/mapping-service.server.ts", "utf8");
    assert.match(service, /confirmation_status !== "confirmed"/);
    assert.match(service, /\.eq\("user_id", userId\)/);
    assert.match(service, /student_confirmed", true/);
  });

  it("route exposes mapping review actions", () => {
    const route = readFileSync("src/routes/api/v1/transcripts.ts", "utf8");
    assert.match(route, /start_credit_mapping/);
    assert.match(route, /update_credit_mapping/);
    assert.match(route, /confirm_credit_mapping/);
    assert.match(route, /reject_credit_mapping/);
    assert.match(route, /mark_mapping_for_counselor_review/);
  });

  it("frontend bundle source does not reference server AI keys", () => {
    const frontend = readFileSync("src/routes/transcript.tsx", "utf8");
    assert.doesNotMatch(frontend, /OPENAI_API_KEY|GEMINI_API_KEY|OPENAI_EMBEDDING_MODEL/);
  });
});
