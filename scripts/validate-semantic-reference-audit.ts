import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Row = Record<string, string>;

const root = process.cwd();
const seedDirectory = resolve(root, "supabase/seeds");
const auditPath = resolve(root, "SEMANTIC_SOURCE_AUDIT.csv");
const countryArgument = process.argv.find((argument) => argument.startsWith("--country="));
const countryFilter = countryArgument?.slice("--country=".length).trim().toUpperCase() || null;

if (countryFilter && !/^[A-Z]{3}$/.test(countryFilter)) {
  throw new Error(
    "--country must be a three-letter uppercase ISO3 code, for example --country=USA.",
  );
}

const auditHeaders = [
  "country_iso3",
  "table_name",
  "record_id",
  "record_name",
  "field_name",
  "claim_summary",
  "source_url",
  "source_authority",
  "source_section_or_page",
  "direct_support",
  "scope_match",
  "current_as_of_2026_06_22",
  "action_taken",
  "notes",
];

const materialFields: Record<string, string[]> = {
  countries: ["primary_languages", "education_system_summary", "grade_structure"],
  curricula: ["name", "grade_range", "authority", "description"],
  curriculum_courses: [
    "course_code",
    "course_name_local",
    "course_name_english",
    "grade_level",
    "credits_estimated",
    "is_required",
    "is_exam_based",
    "description",
    "learning_outcomes_summary",
  ],
  destination_graduation_frameworks: [
    "framework_name",
    "credential_awarded",
    "grade_range",
    "total_credits_required",
    "credit_unit_name",
    "has_state_or_national_exams",
    "exam_notes",
    "effective_year",
  ],
  graduation_requirements: [
    "subject_category",
    "credits_required",
    "specific_courses",
    "notes",
    "requirement_type",
  ],
  education_programs: ["program_name", "description", "availability_scope", "website_url"],
};

function parseCsv(label: string, input: string): { headers: string[]; rows: Row[] } {
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

  if (quoted) throw new Error(`${label} contains an unclosed quoted cell.`);
  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) records.push(row);
  }

  const [headers, ...values] = records;
  if (!headers) throw new Error(`${label} is empty.`);
  const normalizedHeaders = headers.map((header) => header.trim());
  const rows = values.map((cells, rowIndex) => {
    if (cells.length !== normalizedHeaders.length) {
      throw new Error(
        `${label} row ${rowIndex + 2} has ${cells.length} cells; expected ${normalizedHeaders.length}.`,
      );
    }
    return Object.fromEntries(
      normalizedHeaders.map((header, index) => [header, (cells[index] ?? "").trim()]),
    );
  });
  return { headers: normalizedHeaders, rows };
}

function readCsv(path: string) {
  if (!existsSync(path)) throw new Error(`Required file is missing: ${path}`);
  return parseCsv(path, readFileSync(path, "utf8"));
}

const errors: string[] = [];
const audit = readCsv(auditPath);
if (
  audit.headers.length !== auditHeaders.length ||
  audit.headers.some((header, index) => header !== auditHeaders[index])
) {
  errors.push(
    `SEMANTIC_SOURCE_AUDIT.csv has the wrong headers. Expected: ${auditHeaders.join(",")}`,
  );
}

const sources = readCsv(resolve(seedDirectory, "data_sources.csv")).rows;
const sourceByUrl = new Map(sources.map((source) => [source.source_url, source]));
const rowsByTable = new Map<string, Row[]>();
const recordByKey = new Map<string, Row>();

for (const table of Object.keys(materialFields)) {
  const rows = readCsv(resolve(seedDirectory, `${table}.csv`)).rows;
  rowsByTable.set(table, rows);
  for (const row of rows) recordByKey.set(`${table}|${row.id}`, row);
}

const countriesById = new Map(
  (rowsByTable.get("countries") ?? []).map((row) => [row.id, row.iso3]),
);
const curriculaById = new Map((rowsByTable.get("curricula") ?? []).map((row) => [row.id, row]));
const frameworksById = new Map(
  (rowsByTable.get("destination_graduation_frameworks") ?? []).map((row) => [row.id, row]),
);

function recordCountryIso3(table: string, row: Row): string | undefined {
  if (table === "countries") return row.iso3;
  if (table === "curricula" || table === "destination_graduation_frameworks") {
    return countriesById.get(row.country_id);
  }
  if (table === "curriculum_courses") {
    const curriculum = curriculaById.get(row.curriculum_id);
    return curriculum ? countriesById.get(curriculum.country_id) : undefined;
  }
  if (table === "graduation_requirements") {
    const framework = frameworksById.get(row.framework_id);
    return framework ? countriesById.get(framework.country_id) : undefined;
  }
  if (table === "education_programs") return countriesById.get(row.country_id);
  return undefined;
}

const supportByField = new Map<string, Row[]>();
const seenAuditTuples = new Set<string>();

for (const [index, row] of audit.rows.entries()) {
  if (countryFilter && row.country_iso3 !== countryFilter) continue;
  const line = index + 2;
  const action = row.action_taken;
  const retainedAction = action === "kept" || action === "corrected";
  const key = `${row.table_name}|${row.record_id}`;
  const tuple = `${key}|${row.field_name}|${row.source_url}`;

  if (seenAuditTuples.has(tuple)) errors.push(`Audit row ${line} duplicates ${tuple}.`);
  seenAuditTuples.add(tuple);

  if (!Object.hasOwn(materialFields, row.table_name)) {
    errors.push(`Audit row ${line} has unsupported table_name=${row.table_name}.`);
    continue;
  }

  if (retainedAction && !recordByKey.has(key)) {
    errors.push(`Audit row ${line} claims retained support for missing record ${key}.`);
  }

  if (!materialFields[row.table_name].includes(row.field_name)) {
    errors.push(
      `Audit row ${line} field_name=${row.field_name} is not a material audited field for ${row.table_name}.`,
    );
  }

  if (retainedAction) {
    let url: URL | null = null;
    try {
      url = new URL(row.source_url);
    } catch {
      errors.push(`Audit row ${line} source_url is not a real URL: ${row.source_url}.`);
    }
    if (url && url.protocol !== "https:" && url.protocol !== "http:") {
      errors.push(`Audit row ${line} source_url must use http or https.`);
    }
    if (!sourceByUrl.has(row.source_url)) {
      errors.push(`Audit row ${line} source_url is absent from data_sources.csv.`);
    }
    if (!row.claim_summary) errors.push(`Audit row ${line} has no claim_summary.`);
    if (!row.source_authority) errors.push(`Audit row ${line} has no source_authority.`);
    if (!row.source_section_or_page) {
      errors.push(`Audit row ${line} has no exact source section/page.`);
    }
    if (row.direct_support !== "yes") {
      errors.push(`Audit row ${line} retained claim must have direct_support=yes.`);
    }
    if (row.scope_match !== "yes") {
      errors.push(`Audit row ${line} retained claim must have scope_match=yes.`);
    }
    if (row.current_as_of_2026_06_22 !== "yes") {
      errors.push(`Audit row ${line} retained claim must be current_as_of_2026_06_22=yes.`);
    }
    const fieldKey = `${key}|${row.field_name}`;
    supportByField.set(fieldKey, [...(supportByField.get(fieldKey) ?? []), row]);
  }
}

const retainedStatuses = new Set(["partial", "verified", "official"]);
let requiredClaimCount = 0;
let supportedClaimCount = 0;

for (const [table, fields] of Object.entries(materialFields)) {
  for (const row of rowsByTable.get(table) ?? []) {
    if (countryFilter && recordCountryIso3(table, row) !== countryFilter) continue;
    if (!retainedStatuses.has(row.coverage_status)) continue;
    for (const field of fields) {
      if (!row[field]) continue;
      requiredClaimCount += 1;
      const support = supportByField.get(`${table}|${row.id}|${field}`) ?? [];
      if (!support.length) {
        errors.push(`${table} ${row.id} has no valid semantic audit for populated ${field}.`);
      } else {
        supportedClaimCount += 1;
      }
    }
  }
}

console.log("\nSemantic reference audit summary");
console.log(`country=${countryFilter ?? "ALL"}`);
console.log(`audit_rows=${audit.rows.length}`);
console.log(`required_material_claims=${requiredClaimCount}`);
console.log(`supported_material_claims=${supportedClaimCount}`);
console.log(`errors=${errors.length}`);

if (errors.length) {
  const preview = errors.slice(0, 80);
  for (const error of preview) console.error(`[semantic-reject] ${error}`);
  if (errors.length > preview.length) {
    console.error(`[semantic-reject] ...and ${errors.length - preview.length} more errors.`);
  }
  process.exitCode = 1;
}
