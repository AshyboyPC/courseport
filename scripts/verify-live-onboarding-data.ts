import { createClient } from "@supabase/supabase-js";
import {
  MVP_DESTINATION_COUNTRY_ISO3,
  MVP_SOURCE_COUNTRY_ISO3,
  USABLE_REFERENCE_STATUSES,
  getMvpVisibility,
} from "../src/lib/mvp-reference-scope.ts";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Server-only Supabase credentials are required.");
const client = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const tables = [
  "countries",
  "jurisdictions",
  "curricula",
  "curriculum_courses",
  "destination_graduation_frameworks",
  "graduation_requirements",
  "education_programs",
  "data_sources",
] as const;
const results = await Promise.all(tables.map((table) => client.from(table).select("*")));
for (const [index, result] of results.entries()) {
  if (result.error) throw new Error(`${tables[index]}: ${result.error.message}`);
}
const [countries, jurisdictions, curricula, courses, frameworks, requirements, programs, sources] =
  results.map((result) => result.data ?? []);
const countryByIso = new Map(countries.map((country) => [country.iso3, country]));
for (const iso3 of [...MVP_SOURCE_COUNTRY_ISO3, ...MVP_DESTINATION_COUNTRY_ISO3]) {
  assert(countryByIso.has(iso3), `Missing MVP country ${iso3}.`);
}
assert(getMvpVisibility("CAN") === "destination", "Canada is not a destination coming-soon row.");
assert(
  getMvpVisibility("AUS") === "destination",
  "Australia is not a destination coming-soon row.",
);
assert(getMvpVisibility("FRA") === "hidden", "Unexpected hidden-country visibility changed.");

const usableStatuses = new Set<string>(USABLE_REFERENCE_STATUSES);
for (const [table, rows] of [
  ["curricula", curricula],
  ["curriculum_courses", courses],
  ["destination_graduation_frameworks", frameworks],
  ["graduation_requirements", requirements],
  ["education_programs", programs],
] as const) {
  assert(
    rows.every((row) => usableStatuses.has(String(row.coverage_status))),
    `${table} contains a non-usable live detail row.`,
  );
}

const sourceCounts = Object.fromEntries(
  MVP_SOURCE_COUNTRY_ISO3.map((iso3) => {
    const countryId = countryByIso.get(iso3)!.id;
    return [iso3, curricula.filter((row) => row.country_id === countryId).length];
  }),
);
const destinationCounts = Object.fromEntries(
  MVP_DESTINATION_COUNTRY_ISO3.map((iso3) => {
    const countryId = countryByIso.get(iso3)!.id;
    return [
      iso3,
      {
        jurisdictions: jurisdictions.filter(
          (row) => row.country_id === countryId && usableStatuses.has(row.coverage_status),
        ).length,
        frameworks: frameworks.filter((row) => row.country_id === countryId).length,
        programs: programs.filter((row) => row.country_id === countryId).length,
      },
    ];
  }),
);
const uaeId = countryByIso.get("ARE")!.id;
assert(
  jurisdictions.filter((row) => row.country_id === uaeId).length === 7,
  "UAE emirate placeholders are missing.",
);
assert(
  curricula.filter((row) => row.country_id === uaeId).length === 0,
  "UAE has live curriculum detail.",
);
assert(
  frameworks.filter((row) => row.country_id === uaeId).length === 0,
  "UAE has a live framework.",
);
assert(programs.filter((row) => row.country_id === uaeId).length === 0, "UAE has a live program.");
const usaId = countryByIso.get("USA")!.id;
const indiaId = countryByIso.get("IND")!.id;
const tamilNadu = jurisdictions.find(
  (row) => row.country_id === indiaId && row.name === "Tamil Nadu" && row.code === "TN",
);
const andhraPradesh = jurisdictions.find(
  (row) => row.country_id === indiaId && row.name === "Andhra Pradesh" && row.code === "AP",
);
assert(Boolean(tamilNadu), "Tamil Nadu source jurisdiction is missing.");
assert(Boolean(andhraPradesh), "Andhra Pradesh source jurisdiction is missing.");
const mvpSourceCurricula = curricula.filter(
  (row) => row.jurisdiction_id === tamilNadu?.id || row.jurisdiction_id === andhraPradesh?.id,
);
assert(mvpSourceCurricula.length >= 4, "Tamil Nadu/Andhra Pradesh source curricula are missing.");
const georgia = jurisdictions.find(
  (row) => row.country_id === usaId && row.name === "Georgia" && row.jurisdiction_type === "state",
);
const texas = jurisdictions.find(
  (row) => row.country_id === usaId && row.name === "Texas" && row.jurisdiction_type === "state",
);
assert(Boolean(georgia), "Georgia planning jurisdiction is missing.");
assert(Boolean(texas), "Texas planning jurisdiction is missing.");
assert(
  frameworks.some((row) => row.country_id === usaId && row.jurisdiction_id === georgia.id),
  "Georgia's supported framework is missing.",
);
assert(
  frameworks.some((row) => row.country_id === usaId && row.jurisdiction_id === texas.id),
  "Texas's supported framework is missing.",
);

const coverage = countries
  .map((country) => {
    const countryCurricula = curricula.filter((row) => row.country_id === country.id);
    const countryFrameworks = frameworks.filter((row) => row.country_id === country.id);
    return {
      iso3: country.iso3,
      visibility: getMvpVisibility(country.iso3),
      coverage_status: country.coverage_status,
      jurisdictions: jurisdictions.filter((row) => row.country_id === country.id).length,
      curricula: countryCurricula.length,
      courses: courses.filter((row) =>
        countryCurricula.some((curriculum) => curriculum.id === row.curriculum_id),
      ).length,
      frameworks: countryFrameworks.length,
      requirements: requirements.filter((row) =>
        countryFrameworks.some((framework) => framework.id === row.framework_id),
      ).length,
      programs: programs.filter((row) => row.country_id === country.id).length,
      sources: sources.filter((row) => row.country_id === country.id).length,
    };
  })
  .sort((a, b) => a.iso3.localeCompare(b.iso3));

console.log(`source_options=${MVP_SOURCE_COUNTRY_ISO3.join(",")}`);
console.log(`destination_options=${MVP_DESTINATION_COUNTRY_ISO3.join(",")}`);
console.log(`source_curricula_counts=${JSON.stringify(sourceCounts)}`);
console.log(`destination_detail_counts=${JSON.stringify(destinationCounts)}`);
console.log("uae_honest_empty_state=PASS");
console.log("georgia_framework_selection=PASS");
console.log("texas_framework_selection=PASS");
console.log("india_source_state_selection=PASS");
console.log(`reference_coverage=${JSON.stringify(coverage)}`);
