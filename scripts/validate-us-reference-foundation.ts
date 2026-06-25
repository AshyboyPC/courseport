import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Row = Record<string, string>;

const root = process.cwd();
const seedDirectory = resolve(root, "supabase/seeds");
const requireComplete = process.argv.includes("--require-complete");

const expectedStateCodes = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

const identityFields = [
  "name",
  "jurisdiction_type",
  "code",
  "education_authority_name",
  "website_url",
];

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
  return {
    headers,
    rows: values.map((cells, rowIndex) => {
      if (cells.length !== headers.length) {
        throw new Error(
          `${label} row ${rowIndex + 2} has ${cells.length} cells; expected ${headers.length}.`,
        );
      }
      return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    }),
  };
}

function readSeed(table: string) {
  const path = resolve(seedDirectory, `${table}.csv`);
  if (!existsSync(path)) throw new Error(`Missing seed file: ${path}`);
  return parseCsv(`${table}.csv`, readFileSync(path, "utf8")).rows;
}

function readOptionalSeed(table: string) {
  const path = resolve(seedDirectory, `${table}.csv`);
  if (!existsSync(path)) return [];
  return parseCsv(`${table}.csv`, readFileSync(path, "utf8")).rows;
}

function countBy(rows: Row[], field: string) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    const key = row[field] || "(blank)";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

const countries = readSeed("countries");
const jurisdictions = readSeed("jurisdictions");
const frameworks = readSeed("destination_graduation_frameworks");
const requirements = readSeed("graduation_requirements");
const programs = readSeed("education_programs");
const courseCatalogs = readOptionalSeed("jurisdiction_course_catalogs");
const courses = readOptionalSeed("jurisdiction_courses");
const dataSources = readSeed("data_sources");
const provenance = readSeed("reference_record_sources");

const errors: string[] = [];
const warnings: string[] = [];

const usa = countries.find((row) => row.iso3 === "USA");
if (!usa) throw new Error("USA country row is missing.");

const sourceIds = new Set(dataSources.map((row) => row.id));
const provenanceByField = new Map<string, Row[]>();
for (const row of provenance) {
  const key = `${row.table_name}|${row.record_id}|${row.field_name}`;
  const rows = provenanceByField.get(key) ?? [];
  rows.push(row);
  provenanceByField.set(key, rows);
}

const planningJurisdictions = jurisdictions
  .filter((row) => row.country_id === usa.id && row.is_selectable_for_planning === "true")
  .sort((a, b) => a.code.localeCompare(b.code));

if (planningJurisdictions.length !== 51) {
  errors.push(`Expected 51 U.S. planning jurisdictions; found ${planningJurisdictions.length}.`);
}

const codes = new Set(planningJurisdictions.map((row) => row.code));
for (const code of expectedStateCodes) {
  if (!codes.has(code)) errors.push(`Missing U.S. planning jurisdiction code ${code}.`);
}
if (codes.size !== planningJurisdictions.length) {
  errors.push("U.S. planning jurisdiction codes are not unique.");
}

for (const jurisdiction of planningJurisdictions) {
  for (const field of identityFields) {
    if (!jurisdiction[field]) {
      errors.push(`${jurisdiction.code} missing identity field ${field}.`);
      continue;
    }
    const links = provenanceByField.get(`jurisdictions|${jurisdiction.id}|${field}`) ?? [];
    if (links.length === 0) {
      errors.push(`${jurisdiction.code} missing provenance for jurisdiction field ${field}.`);
      continue;
    }
    for (const link of links) {
      if (!sourceIds.has(link.data_source_id)) {
        errors.push(`${jurisdiction.code} ${field} provenance points to missing source.`);
      }
      if (link.direct_support_confirmed !== "true") {
        errors.push(`${jurisdiction.code} ${field} provenance lacks direct-support confirmation.`);
      }
      if (link.scope_match_confirmed !== "true") {
        errors.push(`${jurisdiction.code} ${field} provenance lacks scope-match confirmation.`);
      }
      if (link.current_applicability_confirmed !== "true") {
        errors.push(
          `${jurisdiction.code} ${field} provenance lacks current-applicability confirmation.`,
        );
      }
    }
  }

  if (jurisdiction.identity_verification_status !== "verified") {
    errors.push(`${jurisdiction.code} identity_verification_status must be verified.`);
  }
  if (
    !["partial", "research_pending", "verified", "official"].includes(
      jurisdiction.detail_coverage_status,
    )
  ) {
    errors.push(`${jurisdiction.code} has invalid detail_coverage_status.`);
  }
  const url = parseUrl(jurisdiction.website_url);
  if (!url || !["https:", "http:"].includes(url.protocol)) {
    errors.push(`${jurisdiction.code} website_url is not a valid HTTP(S) URL.`);
  }
  if (jurisdiction.code === "DC") {
    if (jurisdiction.jurisdiction_type !== "federal_district") {
      errors.push("District of Columbia must use jurisdiction_type=federal_district.");
    }
  } else if (jurisdiction.jurisdiction_type !== "state") {
    errors.push(`${jurisdiction.code} must use jurisdiction_type=state.`);
  }
}

const usaFrameworks = frameworks.filter((row) => row.country_id === usa.id);
const countryLevelUsFrameworks = usaFrameworks.filter((row) => !row.jurisdiction_id);
if (countryLevelUsFrameworks.length > 0) {
  errors.push("USA must not have a country-level graduation framework.");
}

const frameworksByJurisdictionId = new Map<string, Row[]>();
for (const framework of usaFrameworks) {
  const rows = frameworksByJurisdictionId.get(framework.jurisdiction_id) ?? [];
  rows.push(framework);
  frameworksByJurisdictionId.set(framework.jurisdiction_id, rows);
}

const requirementsByFrameworkId = new Map<string, Row[]>();
for (const requirement of requirements) {
  const rows = requirementsByFrameworkId.get(requirement.framework_id) ?? [];
  rows.push(requirement);
  requirementsByFrameworkId.set(requirement.framework_id, rows);
}

for (const jurisdiction of planningJurisdictions) {
  const scopedFrameworks = frameworksByJurisdictionId.get(jurisdiction.id) ?? [];
  const hasStandardFramework = scopedFrameworks.some((row) => row.is_standard_framework === "true");
  const hasOfficialLocalControl =
    jurisdiction.controls_statewide_graduation_requirements === "false" &&
    jurisdiction.detail_coverage_status !== "research_pending";

  if (
    ["verified", "official"].includes(jurisdiction.detail_coverage_status) &&
    !hasStandardFramework &&
    !hasOfficialLocalControl
  ) {
    errors.push(
      `${jurisdiction.code} claims verified detail coverage but has no standard framework or sourced local-control result.`,
    );
  }

  if (requireComplete && !hasStandardFramework && !hasOfficialLocalControl) {
    errors.push(
      `${jurisdiction.code} is not complete: no standard framework or sourced local-control result.`,
    );
  }
}

const georgia = planningJurisdictions.find((row) => row.code === "GA");
if (!georgia) throw new Error("Georgia jurisdiction row is missing.");

const georgiaFrameworks = frameworksByJurisdictionId.get(georgia.id) ?? [];
if (georgiaFrameworks.length !== 1) {
  errors.push(`Expected one Georgia framework; found ${georgiaFrameworks.length}.`);
} else {
  const [framework] = georgiaFrameworks;
  for (const field of [
    "framework_name",
    "credential_awarded",
    "controlling_authority",
    "school_sector",
    "framework_type",
    "diploma_type",
    "cohort_label",
    "version_label",
    "local_override_notes",
    "source_scope_notes",
  ]) {
    if (!framework[field]) errors.push(`Georgia framework missing ${field}.`);
  }
  const scopedRequirements = requirementsByFrameworkId.get(framework.id) ?? [];
  if (scopedRequirements.length !== 8) {
    errors.push(`Expected eight Georgia requirement rows; found ${scopedRequirements.length}.`);
  }
  const creditTotal = scopedRequirements.reduce(
    (sum, row) => sum + Number(row.credits_required || 0),
    0,
  );
  if (creditTotal !== 23) {
    errors.push(`Expected Georgia requirement credits to total 23; found ${creditTotal}.`);
  }
  if (!scopedRequirements.some((row) => row.requirement_kind === "assessment")) {
    errors.push("Georgia framework must retain the assessment participation row.");
  }
}

for (const program of programs.filter((row) => row.country_id === usa.id)) {
  if (
    program.jurisdiction_id &&
    !codes.has(jurisdictions.find((row) => row.id === program.jurisdiction_id)?.code ?? "")
  ) {
    errors.push(`USA program ${program.program_name} points to a non-planning jurisdiction.`);
  }
  if (program.framework_id) {
    const parentFramework = frameworks.find((row) => row.id === program.framework_id);
    if (!parentFramework || parentFramework.country_id !== usa.id) {
      errors.push(`USA program ${program.program_name} points to an incompatible framework.`);
    }
  }
}

for (const catalog of courseCatalogs.filter((row) => row.country_id === usa.id)) {
  if (!catalog.jurisdiction_id)
    errors.push(`USA course catalog ${catalog.catalog_name} must be jurisdiction-scoped.`);
  if (!catalog.statewide_recognition_scope) {
    errors.push(`USA course catalog ${catalog.catalog_name} missing statewide_recognition_scope.`);
  }
}

for (const course of courses) {
  const catalog = courseCatalogs.find((row) => row.id === course.catalog_id);
  if (
    catalog?.country_id === usa.id &&
    course.semester_designation &&
    course.semester_designation === "invented"
  ) {
    errors.push(`USA course ${course.course_title} contains invented semester designation.`);
  }
}

for (const jurisdiction of planningJurisdictions) {
  if (jurisdiction.detail_coverage_status === "research_pending") {
    warnings.push(`${jurisdiction.code}: detailed graduation framework is still research_pending.`);
  }
}

const totalIdentityLinks = planningJurisdictions.length * identityFields.length;
const presentIdentityLinks = planningJurisdictions.reduce((count, jurisdiction) => {
  return (
    count +
    identityFields.filter((field) =>
      provenanceByField.has(`jurisdictions|${jurisdiction.id}|${field}`),
    ).length
  );
}, 0);

console.log("United States reference validation summary");
console.log(`mode=${requireComplete ? "require-complete" : "staged"}`);
console.log(`planning_jurisdictions=${planningJurisdictions.length}`);
console.log(
  `detail_coverage=${JSON.stringify(countBy(planningJurisdictions, "detail_coverage_status"))}`,
);
console.log(`identity_provenance=${presentIdentityLinks}/${totalIdentityLinks}`);
console.log(`us_frameworks=${usaFrameworks.length}`);
console.log(`us_programs=${programs.filter((row) => row.country_id === usa.id).length}`);
console.log(
  `us_course_catalogs=${courseCatalogs.filter((row) => row.country_id === usa.id).length}`,
);
console.log(`warnings=${warnings.length}`);

if (warnings.length) {
  console.log("\nKnown limitations");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error("\nValidation errors");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("\nNo validation errors.");
}
