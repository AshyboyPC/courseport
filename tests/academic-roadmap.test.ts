import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateRoadmapFromGapAnalysis } from "../src/lib/roadmap/roadmap-generator.server.ts";

const baseContext = {
  userId: "00000000-0000-0000-0000-000000000001",
  profile: {
    id: "10000000-0000-0000-0000-000000000001",
    grade_at_transfer: 11,
    expected_graduation_year: 2027,
    destination_framework_id: "20000000-0000-0000-0000-000000000001",
  },
  transcript: {
    id: "30000000-0000-0000-0000-000000000001",
    confirmation_status: "confirmed",
  },
  gapAnalysis: {
    id: "40000000-0000-0000-0000-000000000001",
    overall_risk_level: "yellow",
    status: "needs_review",
  },
  destinationFramework: {
    id: "20000000-0000-0000-0000-000000000001",
    name: "Destination framework",
  },
  graduationRequirements: [],
};

function requirement(overrides: Record<string, unknown>) {
  return {
    id: "50000000-0000-0000-0000-000000000001",
    gap_analysis_id: "40000000-0000-0000-0000-000000000001",
    requirement_category: "mathematics",
    requirement_type: "subject_credit",
    requirement_name: "Mathematics",
    required_amount: 4,
    missing_amount: 1,
    unit_type: "credit",
    status: "missing",
    risk_level: "red",
    priority: "high",
    counselor_review_required: false,
    supporting_course_names: [],
    unclear_course_names: [],
    display_order: 1,
    ...overrides,
  };
}

describe("academic roadmap engine", () => {
  it("creates critical roadmap items from missing core requirements for later transfers", () => {
    const result = generateRoadmapFromGapAnalysis({
      ...baseContext,
      profile: { ...baseContext.profile, grade_at_transfer: 12 },
      gapRequirements: [
        requirement({
          priority: "critical",
          requirement_name: "Mathematics",
          requirement_category: "mathematics",
        }),
      ],
    });
    assert.equal(result.timelineUrgency, "urgent");
    assert.equal(result.items[0].priority, "critical");
    assert.equal(result.items[0].actionType, "missing_credit");
    assert.match(result.items[0].title, /Mathematics/);
  });

  it("creates assessment items from saved assessment gap requirements", () => {
    const result = generateRoadmapFromGapAnalysis({
      ...baseContext,
      gapRequirements: [
        requirement({
          requirement_name: "State assessment",
          requirement_category: "assessment",
          requirement_type: "assessment",
          priority: "critical",
        }),
      ],
    });
    assert.equal(result.items[0].actionType, "assessment_requirement");
    assert.equal(result.items[0].priority, "critical");
    assert.match(result.items[0].description, /assessment|non-course/i);
  });

  it("turns counselor-review gaps into counselor question items", () => {
    const result = generateRoadmapFromGapAnalysis({
      ...baseContext,
      gapRequirements: [
        requirement({
          status: "counselor_review_required",
          risk_level: "yellow",
          requirement_name: "World Language",
          requirement_category: "world_language",
          counselor_review_required: true,
          counselor_question: "Can my Tamil coursework count toward world language credit?",
        }),
      ],
    });
    assert.equal(result.items[0].actionType, "counselor_question");
    assert.equal(result.items[0].status, "needs_counselor");
    assert.match(result.counselorQuestions.join("\n"), /Tamil coursework/);
  });

  it("does not create urgent tasks for satisfied requirements without review flags", () => {
    const result = generateRoadmapFromGapAnalysis({
      ...baseContext,
      gapRequirements: [
        requirement({
          status: "satisfied",
          risk_level: "green",
          requirement_name: "Science",
          requirement_category: "science",
          missing_amount: 0,
          priority: "low",
        }),
      ],
    });
    assert.equal(result.items.length, 0);
  });

  it("uses less urgent timeline language for grade 9 transfer profiles", () => {
    const result = generateRoadmapFromGapAnalysis({
      ...baseContext,
      profile: { ...baseContext.profile, grade_at_transfer: 9, expected_graduation_year: 2030 },
      gapRequirements: [requirement({ priority: "medium" })],
    });
    assert.equal(result.timelineUrgency, "low");
    assert.match(result.timelineSummary, /confirming transfer credits|early/i);
  });

  it("adds alternate completion planning only from real missing requirements", () => {
    const result = generateRoadmapFromGapAnalysis({
      ...baseContext,
      gapRequirements: [
        requirement({
          priority: "critical",
          requirement_name: "Science",
          requirement_category: "science",
          missing_amount: 2,
        }),
      ],
    });
    const alternate = result.items.find((item) => item.actionType === "summer_option");
    assert.ok(alternate);
    assert.match(alternate?.title ?? "", /Science/);
    assert.equal(alternate?.counselorReviewRequired, true);
  });

  it("migration adds roadmap fields, item fields, and stale triggers", () => {
    const migration = readFileSync(
      "supabase/migrations/202606250004_academic_roadmap_engine.sql",
      "utf8",
    );
    assert.match(migration, /timeline_urgency/);
    assert.match(migration, /roadmap_items_action_type_check/);
    assert.match(migration, /counselor_review_required/);
    assert.match(migration, /mark_roadmaps_stale_from_gap/);
    assert.match(migration, /student_profiles_mark_roadmap_stale/);
  });

  it("service enforces the persisted prerequisite chain and ownership filters", () => {
    const service = readFileSync("src/lib/roadmap/roadmap-service.server.ts", "utf8");
    assert.match(service, /\.eq\("user_id", userId\)/);
    assert.match(service, /Review and confirm your extracted courses first/);
    assert.match(service, /Generate probable credit mapping first/);
    assert.match(service, /Run graduation gap analysis first/);
    assert.match(service, /Destination graduation framework is still being verified/);
  });

  it("API and UI expose roadmap actions without frontend-only mock roadmap data", () => {
    const route = readFileSync("src/routes/api/v1/transcripts.ts", "utf8");
    const page = readFileSync("src/routes/roadmap.tsx", "utf8");
    assert.match(route, /generate_academic_roadmap/);
    assert.match(route, /update_roadmap_item/);
    assert.match(route, /add_manual_roadmap_item/);
    assert.match(page, /Run graduation gap analysis first/);
    assert.match(page, /Generate probable credit mapping first/);
    assert.match(page, /Roadmap items are saved to your Scholaport account/);
    assert.doesNotMatch(page, /AP U\.S\. History|Texas roadmap|Georgia roadmap/);
    assert.doesNotMatch(page, /OPENAI_API_KEY|GEMINI_API_KEY|SERVICE_ROLE/);
  });

  it("production roadmap files do not import test fixtures or mock roadmap providers", () => {
    const page = readFileSync("src/routes/roadmap.tsx", "utf8");
    const service = readFileSync("src/lib/roadmap/roadmap-service.server.ts", "utf8");
    assert.doesNotMatch(page, /mockRoadmap|demoRoadmap|fixture/i);
    assert.doesNotMatch(service, /mockRoadmap|demoRoadmap|fixture/i);
  });
});
