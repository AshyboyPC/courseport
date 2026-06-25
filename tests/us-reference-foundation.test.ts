import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type Row = Record<string, string>;

function parseCsv(path: string): Row[] {
  const input = readFileSync(path, "utf8");
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) records.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) records.push(row);
  }

  const [headers, ...values] = records;
  assert.ok(headers, `${path} must not be empty`);
  return values.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])),
  );
}

const countries = parseCsv("supabase/seeds/countries.csv");
const jurisdictions = parseCsv("supabase/seeds/jurisdictions.csv");
const frameworks = parseCsv("supabase/seeds/destination_graduation_frameworks.csv");
const requirements = parseCsv("supabase/seeds/graduation_requirements.csv");
const programs = parseCsv("supabase/seeds/education_programs.csv");
const sources = parseCsv("supabase/seeds/data_sources.csv");
const provenance = parseCsv("supabase/seeds/reference_record_sources.csv");
const usa = countries.find((country) => country.iso3 === "USA");
assert.ok(usa, "USA country row must exist");

const usJurisdictions = jurisdictions.filter((row) => row.country_id === usa.id);
const usPlanningJurisdictions = usJurisdictions.filter(
  (row) => row.is_selectable_for_planning === "true",
);
const georgia = usPlanningJurisdictions.find((row) => row.code === "GA");
assert.ok(georgia, "Georgia planning jurisdiction must exist");

const texas = usPlanningJurisdictions.find((row) => row.code === "TX");
assert.ok(texas, "Texas planning jurisdiction must exist");

test("United States has exactly 51 verified planning jurisdictions", () => {
  assert.equal(usPlanningJurisdictions.length, 51);
  assert.equal(new Set(usPlanningJurisdictions.map((row) => row.code)).size, 51);
  assert.equal(
    usPlanningJurisdictions.filter((row) => row.identity_verification_status === "verified").length,
    51,
  );
});

test("District of Columbia is not modeled as a state", () => {
  const dc = usPlanningJurisdictions.find((row) => row.code === "DC");
  assert.ok(dc);
  assert.equal(dc.name, "District of Columbia");
  assert.equal(dc.jurisdiction_type, "federal_district");
  assert.equal(dc.education_authority_name, "Office of the State Superintendent of Education");
});

test("jurisdiction identity is separate from detailed framework coverage", () => {
  assert.equal(
    usPlanningJurisdictions.filter((row) => row.detail_coverage_status === "partial").length,
    2,
  );
  assert.equal(georgia.detail_coverage_status, "partial");
  assert.equal(
    usPlanningJurisdictions.filter((row) => row.detail_coverage_status === "research_pending")
      .length,
    49,
  );
});

test("Texas framework is scoped to Texas and does not fall back to Georgia", () => {
  const texasFrameworks = frameworks.filter((row) => row.jurisdiction_id === texas.id);
  assert.equal(texasFrameworks.length, 1);
  assert.equal(texasFrameworks[0].framework_name, "Texas Foundation High School Program");
  assert.equal(texasFrameworks[0].is_standard_framework, "true");
  assert.equal(texasFrameworks[0].local_requirements_may_exceed, "true");
  assert.equal(texasFrameworks[0].counselor_review_required, "true");

  const california = usPlanningJurisdictions.find((row) => row.code === "CA");
  assert.ok(california);
  assert.equal(frameworks.filter((row) => row.jurisdiction_id === california.id).length, 0);
  assert.equal(
    frameworks.filter((row) => row.country_id === usa.id && !row.jurisdiction_id).length,
    0,
  );
});

test("Texas requirements remain attached only to Texas's framework", () => {
  const texasFramework = frameworks.find((row) => row.jurisdiction_id === texas.id);
  assert.ok(texasFramework);
  const texasRequirements = requirements.filter(
    (row) => row.framework_id === texasFramework.id,
  );
  assert.equal(texasRequirements.length, 11);
  assert.equal(
    texasRequirements.reduce((sum, row) => sum + Number(row.credits_required || 0), 0),
    26,
  );
  assert.ok(texasRequirements.some((row) => row.requirement_kind === "assessment"));
  assert.ok(texasRequirements.some((row) => row.requirement_kind === "non_course"));
  assert.ok(texasRequirements.some((row) => row.subject_category === "Endorsement/Advanced Credits"));
  assert.equal(texasFramework.total_credits_required, "26");
});

test("Georgia requirements remain attached only to Georgia's framework", () => {
  const georgiaFramework = frameworks.find((row) => row.jurisdiction_id === georgia.id);
  assert.ok(georgiaFramework);
  const georgiaRequirements = requirements.filter(
    (row) => row.framework_id === georgiaFramework.id,
  );
  assert.equal(georgiaRequirements.length, 8);
  assert.equal(
    georgiaRequirements.reduce((sum, row) => sum + Number(row.credits_required || 0), 0),
    23,
  );
  assert.ok(georgiaRequirements.some((row) => row.requirement_kind === "assessment"));
});

test("programs stay jurisdiction-scoped and separate from graduation frameworks", () => {
  const usPrograms = programs.filter((row) => row.country_id === usa.id);
  assert.ok(usPrograms.length >= 2);
  for (const program of usPrograms) {
    assert.equal(program.jurisdiction_id, georgia.id);
    assert.equal(program.framework_id, "");
    assert.match(program.relationship_to_graduation, /Optional|optional/);
  }
});

test("every displayed U.S. jurisdiction identity field has provenance", () => {
  const sourceIds = new Set(sources.map((row) => row.id));
  const provenanceKeys = new Set(
    provenance.map((row) => `${row.table_name}|${row.record_id}|${row.field_name}`),
  );
  const fields = ["name", "jurisdiction_type", "code", "education_authority_name", "website_url"];

  for (const jurisdiction of usPlanningJurisdictions) {
    for (const field of fields) {
      assert.ok(
        provenanceKeys.has(`jurisdictions|${jurisdiction.id}|${field}`),
        `${jurisdiction.code} missing provenance for ${field}`,
      );
    }
    const linkedSources = provenance.filter(
      (row) =>
        row.table_name === "jurisdictions" &&
        row.record_id === jurisdiction.id &&
        fields.includes(row.field_name),
    );
    assert.ok(linkedSources.every((row) => sourceIds.has(row.data_source_id)));
    assert.ok(linkedSources.every((row) => row.direct_support_confirmed === "true"));
    assert.ok(linkedSources.every((row) => row.scope_match_confirmed === "true"));
    assert.ok(linkedSources.every((row) => row.current_applicability_confirmed === "true"));
  }
});
