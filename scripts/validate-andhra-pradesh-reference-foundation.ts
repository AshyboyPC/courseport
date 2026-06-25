import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Row = Record<string, string>;

const root = process.cwd();
const seedDirectory = resolve(root, "supabase/seeds");
const requireComplete = process.argv.includes("--require-complete");

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

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

const errors: string[] = [];
const warnings: string[] = [];

const countries = readSeed("countries");
const jurisdictions = readSeed("jurisdictions");
const curricula = readSeed("curricula");
const courses = readSeed("curriculum_courses");
const dataSources = readSeed("data_sources");
const provenance = readSeed("reference_record_sources");
const frameworks = readOptionalSeed("destination_graduation_frameworks");
const requirements = readOptionalSeed("graduation_requirements");

const india = countries.find((row) => row.iso3 === "IND");
if (!india) throw new Error("India country row is missing.");

const sourceIds = new Set(dataSources.map((row) => row.id));
const provenanceByField = new Map<string, Row[]>();
for (const row of provenance) {
  const key = `${row.table_name}|${row.record_id}|${row.field_name}`;
  const rows = provenanceByField.get(key) ?? [];
  rows.push(row);
  provenanceByField.set(key, rows);
}

// Andhra Pradesh jurisdiction checks
const andhraPradesh = jurisdictions.find((row) => row.country_id === india.id && row.code === "AP");
if (!andhraPradesh) {
  errors.push("Andhra Pradesh jurisdiction row is missing.");
} else {
  if (andhraPradesh.coverage_status !== "partial") {
    errors.push(`Andhra Pradesh coverage_status must be partial; found ${andhraPradesh.coverage_status}.`);
  }
  if (andhraPradesh.is_selectable_for_planning !== "true") {
    errors.push("Andhra Pradesh must be selectable for planning.");
  }
  if (andhraPradesh.identity_verification_status !== "verified") {
    errors.push("Andhra Pradesh identity_verification_status must be verified.");
  }
  if (andhraPradesh.detail_coverage_status !== "partial") {
    errors.push(`Andhra Pradesh detail_coverage_status must be partial; found ${andhraPradesh.detail_coverage_status}.`);
  }
  const url = parseUrl(andhraPradesh.website_url);
  if (!url || !["https:", "http:"].includes(url.protocol)) {
    errors.push("Andhra Pradesh website_url is not a valid HTTP(S) URL.");
  }

  // Identity field provenance
  const identityFields = ["name", "jurisdiction_type", "code", "education_authority_name", "website_url"];
  for (const field of identityFields) {
    if (!andhraPradesh[field]) {
      errors.push(`Andhra Pradesh missing identity field ${field}.`);
      continue;
    }
    const links = provenanceByField.get(`jurisdictions|${andhraPradesh.id}|${field}`) ?? [];
    if (links.length === 0) {
      errors.push(`Andhra Pradesh missing provenance for jurisdiction field ${field}.`);
      continue;
    }
    for (const link of links) {
      if (!sourceIds.has(link.data_source_id)) {
        errors.push(`Andhra Pradesh ${field} provenance points to missing source.`);
      }
      if (link.direct_support_confirmed !== "true") {
        errors.push(`Andhra Pradesh ${field} provenance lacks direct-support confirmation.`);
      }
      if (link.scope_match_confirmed !== "true") {
        errors.push(`Andhra Pradesh ${field} provenance lacks scope-match confirmation.`);
      }
      if (link.current_applicability_confirmed !== "true") {
        errors.push(`Andhra Pradesh ${field} provenance lacks current-applicability confirmation.`);
      }
    }
  }
}

// Andhra Pradesh curricula checks
const apCurricula = curricula.filter((row) => row.jurisdiction_id === andhraPradesh?.id);
if (apCurricula.length < 2) {
  errors.push(`Expected at least 2 Andhra Pradesh curricula (SSC and Intermediate); found ${apCurricula.length}.`);
} else {
  const ssc = apCurricula.find((row) => row.name.includes("SSC"));
  const intermediate = apCurricula.find((row) => row.name.includes("Intermediate"));
  if (!ssc) errors.push("Andhra Pradesh SSC curriculum is missing.");
  if (!intermediate) errors.push("Andhra Pradesh Intermediate curriculum is missing.");

  for (const curriculum of apCurricula) {
    if (curriculum.coverage_status !== "partial") {
      errors.push(`Andhra Pradesh curriculum ${curriculum.name} coverage_status must be partial.`);
    }
    // Provenance for curriculum name
    const links = provenanceByField.get(`curricula|${curriculum.id}|name`) ?? [];
    if (links.length === 0) {
      errors.push(`Andhra Pradesh curriculum ${curriculum.name} missing provenance for name.`);
    }
  }
}

// Andhra Pradesh curriculum courses checks
const apCurriculumIds = new Set(apCurricula.map((row) => row.id));
const apCourses = courses.filter((row) => apCurriculumIds.has(row.curriculum_id));
if (apCourses.length < 14) {
  errors.push(`Expected at least 14 Andhra Pradesh curriculum courses (7 SSC × 2 grades + 7+ Intermediate × 2 grades); found ${apCourses.length}.`);
}

// Ensure no US-style graduation frameworks exist for Andhra Pradesh
const apFrameworks = frameworks.filter((row) => row.jurisdiction_id === andhraPradesh?.id);
if (apFrameworks.length > 0) {
  errors.push(`Andhra Pradesh must not have destination graduation frameworks; found ${apFrameworks.length}.`);
}

// Ensure no US-style graduation requirements exist for Andhra Pradesh
const apFrameworkIds = new Set(apFrameworks.map((row) => row.id));
const apRequirements = requirements.filter((row) => apFrameworkIds.has(row.framework_id));
if (apRequirements.length > 0) {
  errors.push(`Andhra Pradesh must not have destination graduation requirements; found ${apRequirements.length}.`);
}

// Data source checks for Andhra Pradesh
const apSources = dataSources.filter((row) => row.jurisdiction_id === andhraPradesh?.id);
if (apSources.length < 2) {
  errors.push(`Expected at least 2 Andhra Pradesh data sources; found ${apSources.length}.`);
}

// Summary
console.log("Andhra Pradesh reference validation summary");
console.log(`mode=${requireComplete ? "require-complete" : "staged"}`);
console.log(`andhra_pradesh_jurisdiction=${andhraPradesh ? "present" : "missing"}`);
console.log(`andhra_pradesh_curricula=${apCurricula.length}`);
console.log(`andhra_pradesh_courses=${apCourses.length}`);
console.log(`andhra_pradesh_data_sources=${apSources.length}`);
console.log(`andhra_pradesh_frameworks=${apFrameworks.length} (expected 0)`);
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
