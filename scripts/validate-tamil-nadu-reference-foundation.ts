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

// Tamil Nadu jurisdiction checks
const tamilNadu = jurisdictions.find((row) => row.country_id === india.id && row.code === "TN");
if (!tamilNadu) {
  errors.push("Tamil Nadu jurisdiction row is missing.");
} else {
  if (tamilNadu.coverage_status !== "partial") {
    errors.push(`Tamil Nadu coverage_status must be partial; found ${tamilNadu.coverage_status}.`);
  }
  if (tamilNadu.is_selectable_for_planning !== "true") {
    errors.push("Tamil Nadu must be selectable for planning.");
  }
  if (tamilNadu.identity_verification_status !== "verified") {
    errors.push("Tamil Nadu identity_verification_status must be verified.");
  }
  if (tamilNadu.detail_coverage_status !== "partial") {
    errors.push(
      `Tamil Nadu detail_coverage_status must be partial; found ${tamilNadu.detail_coverage_status}.`,
    );
  }
  const url = parseUrl(tamilNadu.website_url);
  if (!url || !["https:", "http:"].includes(url.protocol)) {
    errors.push("Tamil Nadu website_url is not a valid HTTP(S) URL.");
  }

  // Identity field provenance
  const identityFields = [
    "name",
    "jurisdiction_type",
    "code",
    "education_authority_name",
    "website_url",
  ];
  for (const field of identityFields) {
    if (!tamilNadu[field]) {
      errors.push(`Tamil Nadu missing identity field ${field}.`);
      continue;
    }
    const links = provenanceByField.get(`jurisdictions|${tamilNadu.id}|${field}`) ?? [];
    if (links.length === 0) {
      errors.push(`Tamil Nadu missing provenance for jurisdiction field ${field}.`);
      continue;
    }
    for (const link of links) {
      if (!sourceIds.has(link.data_source_id)) {
        errors.push(`Tamil Nadu ${field} provenance points to missing source.`);
      }
      if (link.direct_support_confirmed !== "true") {
        errors.push(`Tamil Nadu ${field} provenance lacks direct-support confirmation.`);
      }
      if (link.scope_match_confirmed !== "true") {
        errors.push(`Tamil Nadu ${field} provenance lacks scope-match confirmation.`);
      }
      if (link.current_applicability_confirmed !== "true") {
        errors.push(`Tamil Nadu ${field} provenance lacks current-applicability confirmation.`);
      }
    }
  }
}

// Tamil Nadu curricula checks
const tnCurricula = curricula.filter((row) => row.jurisdiction_id === tamilNadu?.id);
if (tnCurricula.length < 2) {
  errors.push(
    `Expected at least 2 Tamil Nadu curricula (SSLC and HSC); found ${tnCurricula.length}.`,
  );
} else {
  const sslc = tnCurricula.find((row) => row.name.includes("SSLC"));
  const hsc = tnCurricula.find((row) => row.name.includes("HSC"));
  if (!sslc) errors.push("Tamil Nadu SSLC curriculum is missing.");
  if (!hsc) errors.push("Tamil Nadu HSC curriculum is missing.");

  for (const curriculum of tnCurricula) {
    if (curriculum.coverage_status !== "partial") {
      errors.push(`Tamil Nadu curriculum ${curriculum.name} coverage_status must be partial.`);
    }
    // Provenance for curriculum name
    const links = provenanceByField.get(`curricula|${curriculum.id}|name`) ?? [];
    if (links.length === 0) {
      errors.push(`Tamil Nadu curriculum ${curriculum.name} missing provenance for name.`);
    }
  }
}

// Tamil Nadu curriculum courses checks
const tnCurriculumIds = new Set(tnCurricula.map((row) => row.id));
const tnCourses = courses.filter((row) => tnCurriculumIds.has(row.curriculum_id));
if (tnCourses.length < 80) {
  errors.push(`Expected at least 80 Tamil Nadu curriculum courses; found ${tnCourses.length}.`);
}

// Ensure no US-style graduation frameworks exist for Tamil Nadu
const tnFrameworks = frameworks.filter((row) => row.jurisdiction_id === tamilNadu?.id);
if (tnFrameworks.length > 0) {
  errors.push(
    `Tamil Nadu must not have destination graduation frameworks; found ${tnFrameworks.length}.`,
  );
}

// Ensure no US-style graduation requirements exist for Tamil Nadu
const tnFrameworkIds = new Set(tnFrameworks.map((row) => row.id));
const tnRequirements = requirements.filter((row) => tnFrameworkIds.has(row.framework_id));
if (tnRequirements.length > 0) {
  errors.push(
    `Tamil Nadu must not have destination graduation requirements; found ${tnRequirements.length}.`,
  );
}

// Data source checks for Tamil Nadu
const tnSources = dataSources.filter((row) => row.jurisdiction_id === tamilNadu?.id);
if (tnSources.length < 2) {
  errors.push(`Expected at least 2 Tamil Nadu data sources; found ${tnSources.length}.`);
}

// Summary
console.log("Tamil Nadu reference validation summary");
console.log(`mode=${requireComplete ? "require-complete" : "staged"}`);
console.log(`tamil_nadu_jurisdiction=${tamilNadu ? "present" : "missing"}`);
console.log(`tamil_nadu_curricula=${tnCurricula.length}`);
console.log(`tamil_nadu_courses=${tnCourses.length}`);
console.log(`tamil_nuda_data_sources=${tnSources.length}`);
console.log(`tamil_nadu_frameworks=${tnFrameworks.length} (expected 0)`);
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
