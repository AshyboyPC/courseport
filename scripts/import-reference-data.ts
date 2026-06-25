import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;
type ImportResult = { imported: number; skipped: number; rejected: number };

const seedDirectory = resolve(process.cwd(), "supabase/seeds");
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");
const mvpSafe = process.argv.includes("--mvp-safe");
const verifyLive = process.argv.includes("--verify-live");
const MVP_COUNTRY_ISO3 = new Set([
  "IND",
  "CHN",
  "MEX",
  "PHL",
  "PAK",
  "USA",
  "DEU",
  "SAU",
  "GBR",
  "ARE",
]);
const USABLE_DETAIL_STATUS = new Set(["partial", "verified", "official"]);

if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
  throw new Error(
    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.seed.local before importing reference data.",
  );
}
if (!existsSync(seedDirectory)) throw new Error(`Seed directory not found: ${seedDirectory}`);

const tableHeaders = {
  countries: [
    "id",
    "name",
    "iso2",
    "iso3",
    "region",
    "primary_languages",
    "education_system_summary",
    "grade_structure",
    "is_source_priority",
    "is_destination_priority",
    "priority_rank_source",
    "priority_rank_destination",
    "coverage_status",
    "created_at",
    "updated_at",
  ],
  jurisdictions: [
    "id",
    "country_id",
    "parent_jurisdiction_id",
    "name",
    "jurisdiction_type",
    "code",
    "education_authority_name",
    "website_url",
    "coverage_status",
    "is_selectable_for_planning",
    "identity_verification_status",
    "detail_coverage_status",
    "controls_statewide_graduation_requirements",
    "local_requirements_may_exceed",
    "statewide_course_catalog_status",
    "jurisdiction_notes",
    "created_at",
    "updated_at",
  ],
  curricula: [
    "id",
    "country_id",
    "jurisdiction_id",
    "name",
    "curriculum_type",
    "level",
    "grade_range",
    "authority",
    "website_url",
    "description",
    "coverage_status",
    "created_at",
    "updated_at",
  ],
  curriculum_courses: [
    "id",
    "curriculum_id",
    "course_code",
    "course_name_local",
    "course_name_english",
    "subject_category",
    "grade_level",
    "level",
    "credits_estimated",
    "is_required",
    "is_exam_based",
    "description",
    "learning_outcomes_summary",
    "coverage_status",
    "created_at",
    "updated_at",
  ],
  destination_graduation_frameworks: [
    "id",
    "country_id",
    "jurisdiction_id",
    "framework_name",
    "credential_awarded",
    "grade_range",
    "total_credits_required",
    "credit_unit_name",
    "has_state_or_national_exams",
    "exam_notes",
    "effective_year",
    "framework_code",
    "controlling_authority",
    "school_sector",
    "authority_level",
    "framework_type",
    "diploma_type",
    "is_standard_framework",
    "cohort_start_year",
    "cohort_end_year",
    "graduation_year_start",
    "graduation_year_end",
    "cohort_label",
    "version_label",
    "effective_date",
    "expiration_date",
    "local_requirements_may_exceed",
    "local_override_notes",
    "source_scope_notes",
    "pathway_type",
    "grade_at_transfer_applicability",
    "transfer_student_notes",
    "international_transfer_notes",
    "counselor_review_required",
    "coverage_status",
    "created_at",
    "updated_at",
  ],
  graduation_requirement_groups: [
    "id",
    "framework_id",
    "group_key",
    "group_name",
    "logic_type",
    "minimum_options",
    "minimum_credits",
    "notes",
    "coverage_status",
    "created_at",
    "updated_at",
  ],
  graduation_requirements: [
    "id",
    "framework_id",
    "subject_category",
    "credits_required",
    "specific_courses",
    "notes",
    "requirement_type",
    "priority",
    "requirement_group_id",
    "requirement_code",
    "requirement_kind",
    "unit_name",
    "minimum_value",
    "completion_rule",
    "applies_to_pathway",
    "substitution_allowed",
    "substitution_notes",
    "sequence_notes",
    "local_override",
    "effective_date",
    "expiration_date",
    "coverage_status",
    "created_at",
    "updated_at",
  ],
  graduation_requirement_options: [
    "id",
    "group_id",
    "requirement_id",
    "option_key",
    "option_name",
    "subject_category",
    "credits_required",
    "specific_courses",
    "condition_notes",
    "substitution_notes",
    "is_default",
    "coverage_status",
    "created_at",
    "updated_at",
  ],
  education_programs: [
    "id",
    "country_id",
    "jurisdiction_id",
    "program_name",
    "program_type",
    "level",
    "description",
    "availability_scope",
    "website_url",
    "framework_id",
    "controlling_organization",
    "grade_range",
    "credential_or_recognition",
    "relationship_to_graduation",
    "school_authorization_required",
    "school_authorization_notes",
    "cohort_start_year",
    "cohort_end_year",
    "effective_date",
    "coverage_status",
    "created_at",
    "updated_at",
  ],
  jurisdiction_course_catalogs: [
    "id",
    "country_id",
    "jurisdiction_id",
    "catalog_name",
    "catalog_type",
    "authority",
    "website_url",
    "school_sector",
    "grade_range",
    "academic_year",
    "effective_date",
    "statewide_recognition_scope",
    "availability_notes",
    "coverage_status",
    "created_at",
    "updated_at",
  ],
  jurisdiction_courses: [
    "id",
    "catalog_id",
    "jurisdiction_id",
    "course_code",
    "course_title",
    "subject_category",
    "grade_range",
    "credit_value",
    "credit_unit_name",
    "course_duration",
    "prerequisites",
    "standards_url",
    "graduation_classification",
    "required_sequence",
    "semester_designation",
    "active_status",
    "availability_scope",
    "notes",
    "coverage_status",
    "created_at",
    "updated_at",
  ],
  mapping_rules: [
    "id",
    "source_country_id",
    "source_curriculum_id",
    "destination_country_id",
    "destination_jurisdiction_id",
    "source_subject_category",
    "source_course_pattern",
    "target_subject_category",
    "probable_equivalent",
    "confidence_level",
    "needs_counselor_review",
    "rule_notes",
    "coverage_status",
    "created_at",
    "updated_at",
  ],
  data_sources: [
    "id",
    "source_title",
    "source_url",
    "source_authority",
    "country_id",
    "jurisdiction_id",
    "source_type",
    "access_method",
    "license_notes",
    "last_verified_at",
    "reliability_level",
    "publication_date",
    "effective_date",
    "document_version",
    "created_at",
    "updated_at",
  ],
  reference_record_sources: [
    "id",
    "table_name",
    "record_id",
    "data_source_id",
    "field_name",
    "notes",
    "source_section_or_page",
    "claim_summary",
    "applicable_jurisdiction_id",
    "applicable_cohort",
    "applicable_school_sector",
    "direct_support_confirmed",
    "scope_match_confirmed",
    "current_applicability_confirmed",
    "created_at",
  ],
} as const;

type TableName = keyof typeof tableHeaders;

// Parent rows are inserted before children. Source links are last so every target exists first.
const importOrder: TableName[] = [
  "countries",
  "jurisdictions",
  "data_sources",
  "curricula",
  "curriculum_courses",
  "destination_graduation_frameworks",
  "graduation_requirement_groups",
  "graduation_requirements",
  "graduation_requirement_options",
  "education_programs",
  "jurisdiction_course_catalogs",
  "jurisdiction_courses",
  "mapping_rules",
  "reference_record_sources",
];

const requiredFields: Record<TableName, string[]> = {
  countries: [
    "id",
    "name",
    "iso2",
    "iso3",
    "primary_languages",
    "grade_structure",
    "is_source_priority",
    "is_destination_priority",
    "coverage_status",
  ],
  jurisdictions: ["id", "country_id", "name", "jurisdiction_type", "coverage_status"],
  curricula: ["id", "country_id", "name", "curriculum_type", "level", "coverage_status"],
  curriculum_courses: [
    "id",
    "curriculum_id",
    "course_name_local",
    "subject_category",
    "coverage_status",
  ],
  destination_graduation_frameworks: ["id", "country_id", "framework_name", "coverage_status"],
  graduation_requirement_groups: [
    "id",
    "framework_id",
    "group_key",
    "group_name",
    "logic_type",
    "coverage_status",
  ],
  graduation_requirements: [
    "id",
    "framework_id",
    "subject_category",
    "requirement_type",
    "priority",
    "coverage_status",
  ],
  graduation_requirement_options: [
    "id",
    "group_id",
    "option_key",
    "option_name",
    "coverage_status",
  ],
  education_programs: [
    "id",
    "country_id",
    "program_name",
    "program_type",
    "availability_scope",
    "coverage_status",
  ],
  jurisdiction_course_catalogs: [
    "id",
    "country_id",
    "jurisdiction_id",
    "catalog_name",
    "catalog_type",
    "authority",
    "website_url",
    "school_sector",
    "statewide_recognition_scope",
    "coverage_status",
  ],
  jurisdiction_courses: [
    "id",
    "catalog_id",
    "jurisdiction_id",
    "course_title",
    "subject_category",
    "active_status",
    "availability_scope",
    "coverage_status",
  ],
  mapping_rules: [
    "id",
    "source_country_id",
    "destination_country_id",
    "source_subject_category",
    "target_subject_category",
    "confidence_level",
    "needs_counselor_review",
    "coverage_status",
  ],
  data_sources: [
    "id",
    "source_title",
    "source_url",
    "source_authority",
    "source_type",
    "access_method",
    "reliability_level",
  ],
  reference_record_sources: ["id", "table_name", "record_id", "data_source_id"],
};

const booleanFields = new Set([
  "is_source_priority",
  "is_destination_priority",
  "is_required",
  "is_exam_based",
  "has_state_or_national_exams",
  "needs_counselor_review",
  "is_selectable_for_planning",
  "controls_statewide_graduation_requirements",
  "local_requirements_may_exceed",
  "is_standard_framework",
  "substitution_allowed",
  "local_override",
  "is_default",
  "school_authorization_required",
  "direct_support_confirmed",
  "scope_match_confirmed",
  "current_applicability_confirmed",
  "counselor_review_required",
]);
const numberFields = new Set([
  "priority_rank_source",
  "priority_rank_destination",
  "grade_level",
  "credits_estimated",
  "total_credits_required",
  "effective_year",
  "credits_required",
  "minimum_options",
  "minimum_credits",
  "minimum_value",
  "cohort_start_year",
  "cohort_end_year",
  "graduation_year_start",
  "graduation_year_end",
  "credit_value",
]);
const integerFields = new Set([
  "priority_rank_source",
  "priority_rank_destination",
  "grade_level",
  "effective_year",
  "minimum_options",
  "cohort_start_year",
  "cohort_end_year",
  "graduation_year_start",
  "graduation_year_end",
]);
const jsonFields = new Set(["grade_structure"]);
const arrayFields = new Set(["primary_languages", "specific_courses"]);
const uuidFields = new Set([
  "id",
  "country_id",
  "parent_jurisdiction_id",
  "jurisdiction_id",
  "curriculum_id",
  "framework_id",
  "requirement_group_id",
  "group_id",
  "requirement_id",
  "catalog_id",
  "source_country_id",
  "source_curriculum_id",
  "destination_country_id",
  "destination_jurisdiction_id",
  "record_id",
  "data_source_id",
  "applicable_jurisdiction_id",
]);
const dateFields = new Set([
  "last_verified_at",
  "publication_date",
  "effective_date",
  "expiration_date",
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const allowedCoverage = new Set([
  "country_seed_only",
  "needs_research",
  "not_verified",
  "partial",
  "verified",
  "official",
]);
const allowedValues: Partial<Record<TableName, Record<string, Set<string>>>> = {
  jurisdictions: {
    jurisdiction_type: new Set([
      "country",
      "state",
      "province",
      "territory",
      "region",
      "district",
      "federal_district",
      "school_board",
      "exam_board",
      "curriculum_board",
      "school",
    ]),
    identity_verification_status: new Set(["unverified", "verified"]),
    detail_coverage_status: new Set(["research_pending", "partial", "verified", "local_control"]),
    statewide_course_catalog_status: new Set([
      "unknown",
      "available",
      "local_only",
      "not_identified",
    ]),
  },
  curricula: {
    curriculum_type: new Set([
      "national",
      "state_board",
      "exam_board",
      "international",
      "vocational",
      "advanced_program",
    ]),
  },
  graduation_requirements: {
    requirement_type: new Set([
      "core",
      "elective",
      "exam",
      "language",
      "program_specific",
      "local_override",
    ]),
    priority: new Set(["high", "medium", "low"]),
    requirement_kind: new Set([
      "credit",
      "course",
      "assessment",
      "non_course",
      "elective",
      "local_override",
    ]),
    completion_rule: new Set([
      "all_of",
      "one_of",
      "minimum_n",
      "informational",
      "local_determined",
    ]),
  },
  destination_graduation_frameworks: {
    school_sector: new Set(["public", "charter", "private", "tribal", "all", "other"]),
    authority_level: new Set(["state", "district", "school", "federal_district", "other"]),
    framework_type: new Set([
      "credit_based",
      "competency_based",
      "assessment_based",
      "qualification_based",
      "hybrid",
      "local_control",
    ]),
    diploma_type: new Set([
      "standard",
      "advanced",
      "honors",
      "career_technical",
      "alternate",
      "endorsement",
      "other",
    ]),
  },
  graduation_requirement_groups: {
    logic_type: new Set(["all_of", "one_of", "minimum_n", "credit_total", "local_determined"]),
  },
  education_programs: {
    availability_scope: new Set([
      "national",
      "state",
      "province",
      "district",
      "school_specific",
      "international_schools_only",
    ]),
  },
  jurisdiction_course_catalogs: {
    catalog_type: new Set([
      "course_codes",
      "subject_taxonomy",
      "graduation_catalog",
      "standards",
      "local_only",
    ]),
    school_sector: new Set(["public", "charter", "private", "tribal", "all", "other"]),
  },
  jurisdiction_courses: {
    active_status: new Set(["active", "inactive", "unknown"]),
    availability_scope: new Set([
      "state_required",
      "state_recognized_not_guaranteed",
      "district_defined",
      "school_defined",
    ]),
  },
  mapping_rules: {
    confidence_level: new Set(["high", "medium", "low", "unclear"]),
  },
  data_sources: {
    source_type: new Set([
      "government_site",
      "official_pdf",
      "official_api",
      "open_data_portal",
      "ministry_page",
      "education_board_site",
      "manual_review",
      "school_catalog",
    ]),
    access_method: new Set(["api", "csv", "pdf", "html", "manual_entry", "google_sheet_import"]),
    reliability_level: new Set(["official", "high", "medium", "low", "unverified"]),
  },
};

function parseCsv(table: TableName, input: string): Row[] {
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
  if (quoted) throw new Error(`${table}.csv contains an unclosed quoted cell.`);
  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) records.push(row);
  }
  const [headers, ...values] = records;
  if (!headers) throw new Error(`${table}.csv is empty; include the exact header row.`);
  const expected = [...tableHeaders[table]];
  const actual = headers.map((header) => header.trim());
  if (
    actual.length !== expected.length ||
    actual.some((header, index) => header !== expected[index])
  ) {
    throw new Error(
      `${table}.csv headers do not exactly match the template.\nExpected: ${expected.join(",")}\nActual:   ${actual.join(",")}`,
    );
  }
  return values.map((cells, rowIndex) => {
    if (cells.length !== expected.length) {
      throw new Error(
        `${table}.csv row ${rowIndex + 2} has ${cells.length} cells; expected ${expected.length}.`,
      );
    }
    return Object.fromEntries(expected.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function readRows(table: TableName): Row[] {
  const csvPath = resolve(seedDirectory, `${table}.csv`);
  const jsonPath = resolve(seedDirectory, `${table}.json`);
  if (existsSync(csvPath)) return parseCsv(table, readFileSync(csvPath, "utf8"));
  if (existsSync(jsonPath)) {
    const parsed: unknown = JSON.parse(readFileSync(jsonPath, "utf8"));
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as Row)[table])
        ? (parsed as Row)[table]
        : null;
    if (!rows) throw new Error(`${jsonPath} must contain an array or a { ${table}: [] } object.`);
    return rows as Row[];
  }
  return [];
}

function normalizeRow(row: Row): Row {
  const normalized: Row = {};
  for (const [key, rawValue] of Object.entries(row)) {
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
    if (value === "" || value === undefined || value === null) continue;
    if (booleanFields.has(key)) {
      if (value !== true && value !== false && value !== "true" && value !== "false") {
        throw new Error(`${key} must be true or false.`);
      }
      normalized[key] = value === true || value === "true";
    } else if (numberFields.has(key)) {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) throw new Error(`${key} must be a finite number.`);
      if (integerFields.has(key) && !Number.isInteger(numberValue)) {
        throw new Error(`${key} must be an integer.`);
      }
      normalized[key] = numberValue;
    } else if (jsonFields.has(key) || arrayFields.has(key)) {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      if (arrayFields.has(key) && !Array.isArray(parsed)) {
        throw new Error(`${key} must be a JSON array.`);
      }
      if (jsonFields.has(key) && (!parsed || typeof parsed !== "object" || Array.isArray(parsed))) {
        throw new Error(`${key} must be a JSON object.`);
      }
      normalized[key] = parsed;
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

function requireFields(table: TableName, row: Row) {
  const missing = requiredFields[table].filter((field) => row[field] === undefined);
  if (missing.length) throw new Error(`Missing required fields: ${missing.join(", ")}.`);
}

function validateRow(table: TableName, row: Row) {
  requireFields(table, row);
  for (const [field, value] of Object.entries(row)) {
    if (uuidFields.has(field) && (typeof value !== "string" || !UUID_PATTERN.test(value))) {
      throw new Error(`${field} must be a lowercase RFC 4122 UUID.`);
    }
  }
  if ("coverage_status" in row) {
    const status = String(row.coverage_status);
    if (!allowedCoverage.has(status)) throw new Error(`Invalid coverage_status: ${status}.`);
    if (status === "country_seed_only" && table !== "countries") {
      throw new Error("country_seed_only is allowed only for countries.");
    }
  }
  for (const [field, values] of Object.entries(allowedValues[table] ?? {})) {
    if (row[field] !== undefined && !values.has(String(row[field]))) {
      throw new Error(`Invalid ${field}: ${String(row[field])}.`);
    }
  }
  for (const field of dateFields) {
    if (row[field] !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(row[field]))) {
      throw new Error(`${field} must use YYYY-MM-DD.`);
    }
  }
  if (table === "countries") {
    if (!/^[A-Z]{2}$/.test(String(row.iso2)))
      throw new Error("iso2 must be two uppercase letters.");
    if (!/^[A-Z]{3}$/.test(String(row.iso3)))
      throw new Error("iso3 must be three uppercase letters.");
    if (row.coverage_status === "country_seed_only") {
      if (row.education_system_summary !== undefined) {
        throw new Error("country_seed_only rows must not contain an education_system_summary.");
      }
      if (JSON.stringify(row.grade_structure) !== "{}") {
        throw new Error("country_seed_only rows must use grade_structure={}. ");
      }
    }
  }
  if (table === "mapping_rules" && row.needs_counselor_review !== true) {
    throw new Error("Every mapping rule must keep needs_counselor_review=true.");
  }
  if (table === "data_sources") {
    let url: URL;
    try {
      url = new URL(String(row.source_url));
    } catch {
      throw new Error("source_url must be a valid URL.");
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("source_url must use http or https.");
    }
  }
  if (table === "reference_record_sources") {
    if (!Object.hasOwn(tableHeaders, String(row.table_name))) {
      throw new Error(`Invalid table_name: ${String(row.table_name)}.`);
    }
    if (row.field_name !== undefined) {
      const target = String(row.table_name) as TableName;
      if (!tableHeaders[target].includes(row.field_name as never)) {
        throw new Error(`${String(row.field_name)} is not a column in ${target}.`);
      }
    }
  }
}

function assertReference(
  table: TableName,
  row: Row,
  field: string,
  target: TableName,
  ids: Record<TableName, Set<string>>,
) {
  const value = row[field];
  if (value !== undefined && !ids[target].has(String(value))) {
    throw new Error(`${field} references missing ${target} id ${String(value)}.`);
  }
}

function validatePackage(staged: Record<TableName, Row[]>) {
  const ids = Object.fromEntries(
    importOrder.map((table) => [table, new Set(staged[table].map((row) => String(row.id)))]),
  ) as Record<TableName, Set<string>>;
  const globalIds = new Map<string, string>();
  for (const table of importOrder) {
    for (const row of staged[table]) {
      const id = String(row.id);
      const previous = globalIds.get(id);
      if (previous) throw new Error(`UUID ${id} is duplicated in ${previous} and ${table}.`);
      globalIds.set(id, table);
    }
  }

  const unique = (table: TableName, key: (row: Row) => string) => {
    const seen = new Set<string>();
    for (const row of staged[table]) {
      const value = key(row).toLowerCase();
      if (seen.has(value)) throw new Error(`${table} contains duplicate natural key: ${value}.`);
      seen.add(value);
    }
  };
  unique("countries", (row) => String(row.iso3));
  unique("data_sources", (row) => String(row.source_url));
  unique("jurisdictions", (row) => `${row.country_id}|${row.name}|${row.jurisdiction_type}`);
  unique("curricula", (row) => `${row.country_id}|${row.jurisdiction_id ?? ""}|${row.name}`);
  unique(
    "education_programs",
    (row) => `${row.country_id}|${row.jurisdiction_id ?? ""}|${row.program_name}`,
  );

  for (const row of staged.jurisdictions) {
    assertReference("jurisdictions", row, "country_id", "countries", ids);
    assertReference("jurisdictions", row, "parent_jurisdiction_id", "jurisdictions", ids);
  }
  for (const row of staged.curricula) {
    assertReference("curricula", row, "country_id", "countries", ids);
    assertReference("curricula", row, "jurisdiction_id", "jurisdictions", ids);
  }
  for (const row of staged.curriculum_courses) {
    assertReference("curriculum_courses", row, "curriculum_id", "curricula", ids);
  }
  for (const row of staged.destination_graduation_frameworks) {
    assertReference("destination_graduation_frameworks", row, "country_id", "countries", ids);
    assertReference(
      "destination_graduation_frameworks",
      row,
      "jurisdiction_id",
      "jurisdictions",
      ids,
    );
  }
  for (const row of staged.graduation_requirement_groups) {
    assertReference(
      "graduation_requirement_groups",
      row,
      "framework_id",
      "destination_graduation_frameworks",
      ids,
    );
  }
  for (const row of staged.graduation_requirements) {
    assertReference(
      "graduation_requirements",
      row,
      "framework_id",
      "destination_graduation_frameworks",
      ids,
    );
    assertReference(
      "graduation_requirements",
      row,
      "requirement_group_id",
      "graduation_requirement_groups",
      ids,
    );
  }
  for (const row of staged.graduation_requirement_options) {
    assertReference(
      "graduation_requirement_options",
      row,
      "group_id",
      "graduation_requirement_groups",
      ids,
    );
    assertReference(
      "graduation_requirement_options",
      row,
      "requirement_id",
      "graduation_requirements",
      ids,
    );
  }
  for (const row of staged.education_programs) {
    assertReference("education_programs", row, "country_id", "countries", ids);
    assertReference("education_programs", row, "jurisdiction_id", "jurisdictions", ids);
    assertReference(
      "education_programs",
      row,
      "framework_id",
      "destination_graduation_frameworks",
      ids,
    );
  }
  for (const row of staged.jurisdiction_course_catalogs) {
    assertReference("jurisdiction_course_catalogs", row, "country_id", "countries", ids);
    assertReference("jurisdiction_course_catalogs", row, "jurisdiction_id", "jurisdictions", ids);
  }
  for (const row of staged.jurisdiction_courses) {
    assertReference("jurisdiction_courses", row, "catalog_id", "jurisdiction_course_catalogs", ids);
    assertReference("jurisdiction_courses", row, "jurisdiction_id", "jurisdictions", ids);
  }
  for (const row of staged.mapping_rules) {
    assertReference("mapping_rules", row, "source_country_id", "countries", ids);
    assertReference("mapping_rules", row, "source_curriculum_id", "curricula", ids);
    assertReference("mapping_rules", row, "destination_country_id", "countries", ids);
    assertReference("mapping_rules", row, "destination_jurisdiction_id", "jurisdictions", ids);
  }
  for (const row of staged.data_sources) {
    assertReference("data_sources", row, "country_id", "countries", ids);
    assertReference("data_sources", row, "jurisdiction_id", "jurisdictions", ids);
  }

  const sourceById = new Map(staged.data_sources.map((row) => [String(row.id), row]));
  const linksByRecord = new Map<string, Row[]>();
  for (const link of staged.reference_record_sources) {
    const target = String(link.table_name) as TableName;
    if (target === "reference_record_sources") {
      throw new Error("reference_record_sources rows cannot cite other source-link rows.");
    }
    if (!ids[target].has(String(link.record_id))) {
      throw new Error(
        `Source link ${String(link.id)} references missing ${target} record ${String(link.record_id)}.`,
      );
    }
    if (!sourceById.has(String(link.data_source_id))) {
      throw new Error(
        `Source link ${String(link.id)} references missing data source ${String(link.data_source_id)}.`,
      );
    }
    assertReference(
      "reference_record_sources",
      link,
      "applicable_jurisdiction_id",
      "jurisdictions",
      ids,
    );
    const key = `${target}|${String(link.record_id)}`;
    linksByRecord.set(key, [...(linksByRecord.get(key) ?? []), link]);
  }

  for (const table of importOrder) {
    if (table === "data_sources" || table === "reference_record_sources") continue;
    for (const row of staged[table]) {
      const status = String(row.coverage_status);
      if (status === "country_seed_only" || status === "needs_research") continue;
      const links = linksByRecord.get(`${table}|${String(row.id)}`) ?? [];
      if (!links.length) throw new Error(`${table} ${String(row.id)} has no provenance link.`);
      const reliability = links.map((link) =>
        String(sourceById.get(String(link.data_source_id))?.reliability_level),
      );
      if (status === "official" && !reliability.includes("official")) {
        throw new Error(`${table} ${String(row.id)} is official but has no official source.`);
      }
      if (
        status === "verified" &&
        !reliability.some((value) => value === "official" || value === "high")
      ) {
        throw new Error(`${table} ${String(row.id)} is verified but has no official/high source.`);
      }
    }
  }
}

const availableFiles = new Set(readdirSync(seedDirectory));
const raw = Object.fromEntries(importOrder.map((table) => [table, readRows(table)])) as Record<
  TableName,
  Row[]
>;
const validated = Object.fromEntries(
  importOrder.map((table) => [
    table,
    raw[table].map((row, index) => {
      try {
        const normalized = normalizeRow(row);
        validateRow(table, normalized);
        return normalized;
      } catch (error) {
        throw new Error(
          `${table} row ${index + 2}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }),
  ]),
) as Record<TableName, Row[]>;

validatePackage(validated);

const staged = mvpSafe ? buildMvpSafePackage(validated) : validated;
if (mvpSafe) validatePackage(staged);

const totals = Object.fromEntries(
  importOrder.map((table) => [table, { imported: 0, skipped: 0, rejected: 0 }]),
) as Record<TableName, ImportResult>;

if (dryRun) {
  for (const table of importOrder) {
    if (!availableFiles.has(`${table}.csv`) && !availableFiles.has(`${table}.json`)) {
      totals[table].skipped = 1;
    } else {
      totals[table].imported = staged[table].length;
    }
  }
} else {
  const client = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (verifyLive) {
    await verifyLivePackage(client, staged);
  } else {
    for (const table of importOrder) {
      if (!availableFiles.has(`${table}.csv`) && !availableFiles.has(`${table}.json`)) {
        totals[table].skipped = 1;
        continue;
      }
      for (const [index, row] of staged[table].entries()) {
        try {
          await saveRowWithRetry(client, table, row);
          totals[table].imported += 1;
        } catch (error) {
          totals[table].rejected += 1;
          console.error(`[reject] ${table} row ${index + 2}: ${formatError(error)}`);
        }
      }
    }
  }
}

if (!verifyLive) {
  console.log(`\nReference ${dryRun ? "validation" : "import"} summary`);
  if (mvpSafe) console.log("scope=MVP_SAFE");
  for (const table of importOrder) {
    const result = totals[table];
    console.log(
      `${table}: imported=${result.imported} skipped=${result.skipped} rejected=${result.rejected}`,
    );
  }
}
if (Object.values(totals).some((result) => result.rejected > 0)) process.exitCode = 1;

function buildMvpSafePackage(source: Record<TableName, Row[]>): Record<TableName, Row[]> {
  const mvpCountryIds = new Set(
    source.countries
      .filter((row) => MVP_COUNTRY_ISO3.has(String(row.iso3)))
      .map((row) => String(row.id)),
  );
  const countries = source.countries.map((row) =>
    mvpCountryIds.has(String(row.id))
      ? row
      : normalizeRow({
          id: row.id,
          name: row.name,
          iso2: row.iso2,
          iso3: row.iso3,
          region: row.region,
          primary_languages: [],
          grade_structure: {},
          is_source_priority: row.is_source_priority,
          is_destination_priority: row.is_destination_priority,
          priority_rank_source: row.priority_rank_source,
          priority_rank_destination: row.priority_rank_destination,
          coverage_status: "country_seed_only",
        }),
  );
  const jurisdictions = source.jurisdictions.filter((row) =>
    mvpCountryIds.has(String(row.country_id)),
  );
  const jurisdictionIds = new Set(jurisdictions.map((row) => String(row.id)));
  const curricula = source.curricula.filter(
    (row) =>
      mvpCountryIds.has(String(row.country_id)) &&
      USABLE_DETAIL_STATUS.has(String(row.coverage_status)),
  );
  const curriculumIds = new Set(curricula.map((row) => String(row.id)));
  const curriculumCourses = source.curriculum_courses.filter(
    (row) =>
      curriculumIds.has(String(row.curriculum_id)) &&
      USABLE_DETAIL_STATUS.has(String(row.coverage_status)),
  );
  const frameworks = source.destination_graduation_frameworks.filter(
    (row) =>
      mvpCountryIds.has(String(row.country_id)) &&
      USABLE_DETAIL_STATUS.has(String(row.coverage_status)),
  );
  const frameworkIds = new Set(frameworks.map((row) => String(row.id)));
  const requirementGroups = source.graduation_requirement_groups.filter(
    (row) =>
      frameworkIds.has(String(row.framework_id)) &&
      USABLE_DETAIL_STATUS.has(String(row.coverage_status)),
  );
  const requirementGroupIds = new Set(requirementGroups.map((row) => String(row.id)));
  const requirements = source.graduation_requirements.filter((row) =>
    frameworkIds.has(String(row.framework_id)),
  );
  const requirementIds = new Set(requirements.map((row) => String(row.id)));
  const requirementOptions = source.graduation_requirement_options.filter(
    (row) =>
      requirementGroupIds.has(String(row.group_id)) &&
      USABLE_DETAIL_STATUS.has(String(row.coverage_status)),
  );
  const programs = source.education_programs.filter(
    (row) =>
      mvpCountryIds.has(String(row.country_id)) &&
      USABLE_DETAIL_STATUS.has(String(row.coverage_status)),
  );
  const courseCatalogs = source.jurisdiction_course_catalogs.filter(
    (row) =>
      mvpCountryIds.has(String(row.country_id)) &&
      USABLE_DETAIL_STATUS.has(String(row.coverage_status)),
  );
  const courseCatalogIds = new Set(courseCatalogs.map((row) => String(row.id)));
  const jurisdictionCourses = source.jurisdiction_courses.filter(
    (row) =>
      courseCatalogIds.has(String(row.catalog_id)) &&
      USABLE_DETAIL_STATUS.has(String(row.coverage_status)),
  );
  const mappingRules = source.mapping_rules.filter(
    (row) =>
      mvpCountryIds.has(String(row.source_country_id)) &&
      mvpCountryIds.has(String(row.destination_country_id)),
  );

  const retainedIds = new Map<TableName, Set<string>>([
    ["countries", new Set(countries.map((row) => String(row.id)))],
    ["jurisdictions", jurisdictionIds],
    ["curricula", curriculumIds],
    ["curriculum_courses", new Set(curriculumCourses.map((row) => String(row.id)))],
    ["destination_graduation_frameworks", frameworkIds],
    ["graduation_requirement_groups", requirementGroupIds],
    ["graduation_requirements", requirementIds],
    ["graduation_requirement_options", new Set(requirementOptions.map((row) => String(row.id)))],
    ["education_programs", new Set(programs.map((row) => String(row.id)))],
    ["jurisdiction_course_catalogs", courseCatalogIds],
    ["jurisdiction_courses", new Set(jurisdictionCourses.map((row) => String(row.id)))],
    ["mapping_rules", new Set(mappingRules.map((row) => String(row.id)))],
    ["data_sources", new Set()],
    ["reference_record_sources", new Set()],
  ]);
  const links = source.reference_record_sources.filter((row) => {
    const table = String(row.table_name) as TableName;
    if (table === "countries" && !mvpCountryIds.has(String(row.record_id))) return false;
    return retainedIds.get(table)?.has(String(row.record_id)) ?? false;
  });
  const sourceIds = new Set(links.map((row) => String(row.data_source_id)));
  const dataSources = source.data_sources.filter((row) => sourceIds.has(String(row.id)));

  return {
    countries,
    jurisdictions,
    data_sources: dataSources,
    curricula,
    curriculum_courses: curriculumCourses,
    destination_graduation_frameworks: frameworks,
    graduation_requirement_groups: requirementGroups,
    graduation_requirements: requirements,
    graduation_requirement_options: requirementOptions,
    education_programs: programs,
    jurisdiction_course_catalogs: courseCatalogs,
    jurisdiction_courses: jurisdictionCourses,
    mapping_rules: mappingRules,
    reference_record_sources: links,
  };
}

async function verifyLivePackage(client: SupabaseClient, expected: Record<TableName, Row[]>) {
  console.log("\nLive reference verification summary");
  if (mvpSafe) console.log("scope=MVP_SAFE");
  for (const table of importOrder) {
    const { data, error, count } = await client
      .from(table)
      .select("*", { count: "exact" })
      .range(0, 9999);
    if (error) throw new Error(`${table}: ${error.message}`);
    const liveRows = (data ?? []) as Row[];
    const liveById = new Map(liveRows.map((row) => [String(row.id), row]));
    const missing: string[] = [];
    const conflicting: string[] = [];
    const conflictingFields = new Set<string>();
    for (const row of expected[table]) {
      const live = liveById.get(String(row.id));
      if (!live) {
        missing.push(String(row.id));
        continue;
      }
      const mismatchedFields = Object.entries(row)
        .filter(([key, value]) => !isDeepStrictEqual(live[key], value))
        .map(([key]) => key);
      if (mismatchedFields.length) {
        conflicting.push(String(row.id));
        mismatchedFields.forEach((field) => conflictingFields.add(field));
      }
    }
    const expectedIds = new Set(expected[table].map((row) => String(row.id)));
    const unexpected = liveRows.filter((row) => !expectedIds.has(String(row.id))).length;
    const coverage = liveRows.reduce<Record<string, number>>((summary, row) => {
      if (typeof row.coverage_status !== "string") return summary;
      summary[row.coverage_status] = (summary[row.coverage_status] ?? 0) + 1;
      return summary;
    }, {});
    console.log(
      `${table}: expected=${expected[table].length} matched=${expected[table].length - missing.length} total_live=${count ?? liveRows.length} missing=${missing.length} conflicting=${conflicting.length} unexpected=${unexpected} coverage=${JSON.stringify(coverage)}`,
    );
    if (missing.length) console.log(`${table}: missing_ids=${missing.join(",")}`);
    if (conflicting.length) console.log(`${table}: conflicting_ids=${conflicting.join(",")}`);
    if (conflictingFields.size) {
      console.log(`${table}: conflicting_fields=${[...conflictingFields].sort().join(",")}`);
    }
  }
}

async function findExistingId(
  client: SupabaseClient,
  table: "countries" | "jurisdictions" | "curricula" | "education_programs" | "data_sources",
  row: Row,
): Promise<string | null> {
  let query = client.from(table).select("id");
  if (table === "countries") query = query.eq("iso3", row.iso3);
  if (table === "data_sources") query = query.eq("source_url", row.source_url);
  if (table === "jurisdictions") {
    query = query
      .eq("country_id", row.country_id)
      .eq("name", row.name)
      .eq("jurisdiction_type", row.jurisdiction_type);
  }
  if (table === "curricula") {
    query = query.eq("country_id", row.country_id).eq("name", row.name);
    query = row.jurisdiction_id
      ? query.eq("jurisdiction_id", row.jurisdiction_id)
      : query.is("jurisdiction_id", null);
  }
  if (table === "education_programs") {
    query = query.eq("country_id", row.country_id).eq("program_name", row.program_name);
    query = row.jurisdiction_id
      ? query.eq("jurisdiction_id", row.jurisdiction_id)
      : query.is("jurisdiction_id", null);
  }
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function saveRow(client: SupabaseClient, table: TableName, row: Row) {
  if (
    table === "countries" ||
    table === "jurisdictions" ||
    table === "curricula" ||
    table === "education_programs" ||
    table === "data_sources"
  ) {
    const existingId = await findExistingId(client, table, row);
    if (existingId && existingId !== row.id) {
      throw new Error(
        `Stable ID mismatch for ${table}: database has ${existingId}, seed has ${String(row.id)}.`,
      );
    }
    if (existingId) {
      const { id: _id, ...updates } = row;
      const { error } = await client.from(table).update(updates).eq("id", existingId);
      if (error) throw error;
      return;
    }
  }
  const { error } = await client.from(table).upsert(row, { onConflict: "id" });
  if (error) throw error;
}

async function saveRowWithRetry(client: SupabaseClient, table: TableName, row: Row) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await saveRow(client, table, row);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 500));
    }
  }
  throw lastError;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}
