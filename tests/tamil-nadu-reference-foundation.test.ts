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
const curricula = parseCsv("supabase/seeds/curricula.csv");
const courses = parseCsv("supabase/seeds/curriculum_courses.csv");
const sources = parseCsv("supabase/seeds/data_sources.csv");
const provenance = parseCsv("supabase/seeds/reference_record_sources.csv");
const frameworks = parseCsv("supabase/seeds/destination_graduation_frameworks.csv");
const requirements = parseCsv("supabase/seeds/graduation_requirements.csv");

const india = countries.find((country) => country.iso3 === "IND");
assert.ok(india, "India country row must exist");

const indiaJurisdictions = jurisdictions.filter((row) => row.country_id === india.id);
const tamilNadu = indiaJurisdictions.find((row) => row.code === "TN");
assert.ok(tamilNadu, "Tamil Nadu jurisdiction must exist");

test("Tamil Nadu is the only verified India source jurisdiction for MVP", () => {
  assert.equal(tamilNadu.coverage_status, "partial");
  assert.equal(tamilNadu.is_selectable_for_planning, "true");
  assert.equal(tamilNadu.identity_verification_status, "verified");
  assert.equal(tamilNadu.detail_coverage_status, "partial");
});

test("Tamil Nadu has both SSLC and HSC curricula", () => {
  const tnCurricula = curricula.filter((row) => row.jurisdiction_id === tamilNadu.id);
  assert.equal(tnCurricula.length, 2, "Expected exactly 2 Tamil Nadu curricula");
  const sslc = tnCurricula.find((row) => row.name.includes("SSLC"));
  const hsc = tnCurricula.find((row) => row.name.includes("HSC"));
  assert.ok(sslc, "SSLC curriculum must exist");
  assert.ok(hsc, "HSC curriculum must exist");
  assert.equal(sslc.grade_range, "9-10");
  assert.equal(hsc.grade_range, "11-12");
  assert.equal(sslc.coverage_status, "partial");
  assert.equal(hsc.coverage_status, "partial");
});

test("Tamil Nadu has curriculum courses for SSLC and HSC", () => {
  const tnCurricula = curricula.filter((row) => row.jurisdiction_id === tamilNadu.id);
  const tnCurriculumIds = new Set(tnCurricula.map((row) => row.id));
  const tnCourses = courses.filter((row) => tnCurriculumIds.has(row.curriculum_id));
  assert.ok(tnCourses.length >= 80, `Expected at least 80 Tamil Nadu courses; found ${tnCourses.length}`);

  // SSLC core subjects
  const sslcId = tnCurricula.find((row) => row.name.includes("SSLC"))?.id;
  assert.ok(sslcId);
  const sslcCourses = tnCourses.filter((row) => row.curriculum_id === sslcId);
  assert.ok(sslcCourses.some((row) => row.course_name_english === "Tamil"), "SSLC must have Tamil");
  assert.ok(sslcCourses.some((row) => row.course_name_english === "English"), "SSLC must have English");
  assert.ok(sslcCourses.some((row) => row.course_name_english === "Mathematics"), "SSLC must have Mathematics");
  assert.ok(sslcCourses.some((row) => row.course_name_english === "Science"), "SSLC must have Science");
  assert.ok(sslcCourses.some((row) => row.course_name_english === "Social Science"), "SSLC must have Social Science");

  // HSC stream subjects
  const hscId = tnCurricula.find((row) => row.name.includes("HSC"))?.id;
  assert.ok(hscId);
  const hscCourses = tnCourses.filter((row) => row.curriculum_id === hscId);
  assert.ok(hscCourses.some((row) => row.course_name_english.includes("Physics")), "HSC must have Physics");
  assert.ok(hscCourses.some((row) => row.course_name_english.includes("Chemistry")), "HSC must have Chemistry");
  assert.ok(hscCourses.some((row) => row.course_name_english.includes("Biology")), "HSC must have Biology");
  assert.ok(hscCourses.some((row) => row.course_name_english.includes("Accountancy")), "HSC must have Accountancy");
  assert.ok(hscCourses.some((row) => row.course_name_english.includes("History")), "HSC must have History");
});

test("Tamil Nadu has no destination graduation frameworks", () => {
  const tnFrameworks = frameworks.filter((row) => row.jurisdiction_id === tamilNadu.id);
  assert.equal(tnFrameworks.length, 0, "Tamil Nadu must not have destination graduation frameworks");
});

test("Tamil Nadu has no destination graduation requirements", () => {
  const tnFrameworks = frameworks.filter((row) => row.jurisdiction_id === tamilNadu.id);
  const tnFrameworkIds = new Set(tnFrameworks.map((row) => row.id));
  const tnRequirements = requirements.filter((row) => tnFrameworkIds.has(row.framework_id));
  assert.equal(tnRequirements.length, 0, "Tamil Nadu must not have destination graduation requirements");
});

test("Tamil Nadu jurisdiction identity fields have provenance", () => {
  const sourceIds = new Set(sources.map((row) => row.id));
  const provenanceKeys = new Set(
    provenance.map((row) => `${row.table_name}|${row.record_id}|${row.field_name}`),
  );
  const fields = ["name", "jurisdiction_type", "code", "education_authority_name", "website_url"];

  for (const field of fields) {
    assert.ok(
      provenanceKeys.has(`jurisdictions|${tamilNadu.id}|${field}`),
      `Tamil Nadu missing provenance for ${field}`,
    );
  }
  const linkedSources = provenance.filter(
    (row) =>
      row.table_name === "jurisdictions" &&
      row.record_id === tamilNadu.id &&
      fields.includes(row.field_name),
  );
  assert.ok(linkedSources.every((row) => sourceIds.has(row.data_source_id)));
  assert.ok(linkedSources.every((row) => row.direct_support_confirmed === "true"));
  assert.ok(linkedSources.every((row) => row.scope_match_confirmed === "true"));
  assert.ok(linkedSources.every((row) => row.current_applicability_confirmed === "true"));
});

test("Tamil Nadu curricula have provenance for name", () => {
  const provenanceKeys = new Set(
    provenance.map((row) => `${row.table_name}|${row.record_id}|${row.field_name}`),
  );
  const tnCurricula = curricula.filter((row) => row.jurisdiction_id === tamilNadu.id);
  for (const curriculum of tnCurricula) {
    assert.ok(
      provenanceKeys.has(`curricula|${curriculum.id}|name`),
      `${curriculum.name} missing provenance for name`,
    );
  }
});

test("Tamil Nadu has at least two data sources", () => {
  const tnSources = sources.filter((row) => row.jurisdiction_id === tamilNadu.id);
  assert.ok(tnSources.length >= 2, `Expected at least 2 Tamil Nadu data sources; found ${tnSources.length}`);
});

test("MVP onboarding only allows India→Tamil Nadu and Andhra Pradesh as verified source paths", () => {
  // Only Tamil Nadu and Andhra Pradesh should have verified/partial detail_coverage_status among India jurisdictions
  const verifiedIndiaJurisdictions = indiaJurisdictions.filter(
    (row) => row.detail_coverage_status === "partial" || row.detail_coverage_status === "verified" || row.detail_coverage_status === "official",
  );
  assert.equal(verifiedIndiaJurisdictions.length, 2, "Only Tamil Nadu and Andhra Pradesh should have verified source data for MVP");
  const codes = verifiedIndiaJurisdictions.map((row) => row.code).sort();
  assert.deepEqual(codes, ["AP", "TN"]);
});

// Andhra Pradesh tests
const andhraPradesh = indiaJurisdictions.find((row) => row.code === "AP");
assert.ok(andhraPradesh, "Andhra Pradesh jurisdiction must exist");

test("Andhra Pradesh is verified as an India source jurisdiction for MVP", () => {
  assert.equal(andhraPradesh.coverage_status, "partial");
  assert.equal(andhraPradesh.is_selectable_for_planning, "true");
  assert.equal(andhraPradesh.identity_verification_status, "verified");
  assert.equal(andhraPradesh.detail_coverage_status, "partial");
});

test("Andhra Pradesh has both SSC and Intermediate curricula", () => {
  const apCurricula = curricula.filter((row) => row.jurisdiction_id === andhraPradesh.id);
  assert.equal(apCurricula.length, 2, "Expected exactly 2 Andhra Pradesh curricula");
  const ssc = apCurricula.find((row) => row.name.includes("SSC"));
  const intermediate = apCurricula.find((row) => row.name.includes("Intermediate"));
  assert.ok(ssc, "SSC curriculum must exist");
  assert.ok(intermediate, "Intermediate curriculum must exist");
  assert.equal(ssc.grade_range, "9-10");
  assert.equal(intermediate.grade_range, "11-12");
  assert.equal(ssc.coverage_status, "partial");
  assert.equal(intermediate.coverage_status, "partial");
});

test("Andhra Pradesh has curriculum courses for SSC and Intermediate", () => {
  const apCurricula = curricula.filter((row) => row.jurisdiction_id === andhraPradesh.id);
  const apCurriculumIds = new Set(apCurricula.map((row) => row.id));
  const apCourses = courses.filter((row) => apCurriculumIds.has(row.curriculum_id));
  assert.ok(apCourses.length >= 14, `Expected at least 14 Andhra Pradesh courses; found ${apCourses.length}`);

  // SSC core subjects
  const sscId = apCurricula.find((row) => row.name.includes("SSC"))?.id;
  assert.ok(sscId);
  const sscCourses = apCourses.filter((row) => row.curriculum_id === sscId);
  assert.ok(sscCourses.some((row) => row.course_name_english.includes("First Language")), "SSC must have First Language");
  assert.ok(sscCourses.some((row) => row.course_name_english.includes("Second Language")), "SSC must have Second Language");
  assert.ok(sscCourses.some((row) => row.course_name_english === "English"), "SSC must have English");
  assert.ok(sscCourses.some((row) => row.course_name_english === "Mathematics"), "SSC must have Mathematics");
  assert.ok(sscCourses.some((row) => row.course_name_english.includes("Physical Science")), "SSC must have Physical Science");
  assert.ok(sscCourses.some((row) => row.course_name_english.includes("Biological Science")), "SSC must have Biological Science");
  assert.ok(sscCourses.some((row) => row.course_name_english.includes("Social Studies")), "SSC must have Social Studies");

  // Intermediate stream subjects
  const interId = apCurricula.find((row) => row.name.includes("Intermediate"))?.id;
  assert.ok(interId);
  const interCourses = apCourses.filter((row) => row.curriculum_id === interId);
  assert.ok(interCourses.some((row) => row.course_name_english.includes("Physics")), "Intermediate must have Physics");
  assert.ok(interCourses.some((row) => row.course_name_english.includes("Chemistry")), "Intermediate must have Chemistry");
  assert.ok(interCourses.some((row) => row.course_name_english.includes("Mathematics")), "Intermediate must have Mathematics");
  assert.ok(interCourses.some((row) => row.course_name_english.includes("Botany")), "Intermediate must have Botany");
  assert.ok(interCourses.some((row) => row.course_name_english.includes("Zoology")), "Intermediate must have Zoology");
  assert.ok(interCourses.some((row) => row.course_name_english.includes("Economics")), "Intermediate must have Economics");
  assert.ok(interCourses.some((row) => row.course_name_english.includes("Commerce")), "Intermediate must have Commerce");
});

test("Andhra Pradesh has no destination graduation frameworks", () => {
  const apFrameworks = frameworks.filter((row) => row.jurisdiction_id === andhraPradesh.id);
  assert.equal(apFrameworks.length, 0, "Andhra Pradesh must not have destination graduation frameworks");
});

test("Andhra Pradesh has no destination graduation requirements", () => {
  const apFrameworks = frameworks.filter((row) => row.jurisdiction_id === andhraPradesh.id);
  const apFrameworkIds = new Set(apFrameworks.map((row) => row.id));
  const apRequirements = requirements.filter((row) => apFrameworkIds.has(row.framework_id));
  assert.equal(apRequirements.length, 0, "Andhra Pradesh must not have destination graduation requirements");
});

test("Andhra Pradesh jurisdiction identity fields have provenance", () => {
  const sourceIds = new Set(sources.map((row) => row.id));
  const provenanceKeys = new Set(
    provenance.map((row) => `${row.table_name}|${row.record_id}|${row.field_name}`),
  );
  const fields = ["name", "jurisdiction_type", "code", "education_authority_name", "website_url"];

  for (const field of fields) {
    assert.ok(
      provenanceKeys.has(`jurisdictions|${andhraPradesh.id}|${field}`),
      `Andhra Pradesh missing provenance for ${field}`,
    );
  }
  const linkedSources = provenance.filter(
    (row) =>
      row.table_name === "jurisdictions" &&
      row.record_id === andhraPradesh.id &&
      fields.includes(row.field_name),
  );
  assert.ok(linkedSources.every((row) => sourceIds.has(row.data_source_id)));
  assert.ok(linkedSources.every((row) => row.direct_support_confirmed === "true"));
  assert.ok(linkedSources.every((row) => row.scope_match_confirmed === "true"));
  assert.ok(linkedSources.every((row) => row.current_applicability_confirmed === "true"));
});

test("Andhra Pradesh curricula have provenance for name", () => {
  const provenanceKeys = new Set(
    provenance.map((row) => `${row.table_name}|${row.record_id}|${row.field_name}`),
  );
  const apCurricula = curricula.filter((row) => row.jurisdiction_id === andhraPradesh.id);
  for (const curriculum of apCurricula) {
    assert.ok(
      provenanceKeys.has(`curricula|${curriculum.id}|name`),
      `${curriculum.name} missing provenance for name`,
    );
  }
});

test("Andhra Pradesh has at least two data sources", () => {
  const apSources = sources.filter((row) => row.jurisdiction_id === andhraPradesh.id);
  assert.ok(apSources.length >= 2, `Expected at least 2 Andhra Pradesh data sources; found ${apSources.length}`);
});
