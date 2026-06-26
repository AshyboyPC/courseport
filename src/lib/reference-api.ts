import { z } from "zod";
import {
  filterMvpDestinationCountries,
  filterMvpSourceCountries,
  getMvpVisibility,
  MVP_DESTINATION_COUNTRY_ISO3,
  MVP_PRIORITY_COUNTRY_ISO3,
  MVP_SOURCE_COUNTRY_ISO3,
  sortByMvpDestinationCountryOrder,
  sortByMvpSourceCountryOrder,
  USABLE_REFERENCE_STATUSES,
  type MvpVisibility,
} from "@/lib/mvp-reference-scope";
import { requireSupabase } from "@/lib/supabase";

const coverageStatus = z.enum([
  "country_seed_only",
  "needs_research",
  "not_verified",
  "partial",
  "verified",
  "official",
]);
const nullableString = z.string().nullable();

export const CountrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  iso2: z.string(),
  iso3: z.string(),
  region: nullableString,
  primary_languages: z.array(z.string()),
  education_system_summary: nullableString,
  grade_structure: z.record(z.string(), z.unknown()),
  is_source_priority: z.boolean(),
  is_destination_priority: z.boolean(),
  priority_rank_source: z.number().int().nullable(),
  priority_rank_destination: z.number().int().nullable(),
  coverage_status: coverageStatus,
  created_at: z.string(),
  updated_at: z.string(),
});
export type Country = z.infer<typeof CountrySchema>;

export const JurisdictionSchema = z.object({
  id: z.string().uuid(),
  country_id: z.string().uuid(),
  parent_jurisdiction_id: z.string().uuid().nullable(),
  name: z.string(),
  jurisdiction_type: z.string(),
  code: nullableString,
  education_authority_name: nullableString,
  website_url: nullableString,
  coverage_status: coverageStatus.exclude(["country_seed_only"]),
  is_selectable_for_planning: z.boolean(),
  identity_verification_status: z.enum(["unverified", "verified"]),
  detail_coverage_status: z.enum(["research_pending", "partial", "verified", "local_control"]),
  controls_statewide_graduation_requirements: z.boolean().nullable(),
  local_requirements_may_exceed: z.boolean().nullable(),
  statewide_course_catalog_status: z.enum(["unknown", "available", "local_only", "not_identified"]),
  jurisdiction_notes: nullableString,
  created_at: z.string(),
  updated_at: z.string(),
});
export type Jurisdiction = z.infer<typeof JurisdictionSchema>;

export const CurriculumSchema = z.object({
  id: z.string().uuid(),
  country_id: z.string().uuid(),
  jurisdiction_id: z.string().uuid().nullable(),
  name: z.string(),
  curriculum_type: z.string(),
  level: z.string(),
  grade_range: nullableString,
  authority: nullableString,
  website_url: nullableString,
  description: nullableString,
  coverage_status: coverageStatus.exclude(["country_seed_only"]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Curriculum = z.infer<typeof CurriculumSchema>;

export const CurriculumCourseSchema = z.object({
  id: z.string().uuid(),
  curriculum_id: z.string().uuid(),
  course_code: nullableString,
  course_name_local: z.string(),
  course_name_english: nullableString,
  subject_category: z.string(),
  grade_level: z.number().int().nullable(),
  level: nullableString,
  credits_estimated: z.coerce.number().nullable(),
  is_required: z.boolean().nullable(),
  is_exam_based: z.boolean().nullable(),
  description: nullableString,
  learning_outcomes_summary: nullableString,
  coverage_status: coverageStatus.exclude(["country_seed_only"]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CurriculumCourse = z.infer<typeof CurriculumCourseSchema>;

export const DestinationFrameworkSchema = z.object({
  id: z.string().uuid(),
  country_id: z.string().uuid(),
  jurisdiction_id: z.string().uuid().nullable(),
  framework_name: z.string(),
  credential_awarded: nullableString,
  grade_range: nullableString,
  total_credits_required: z.coerce.number().nullable(),
  credit_unit_name: nullableString,
  has_state_or_national_exams: z.boolean().nullable(),
  exam_notes: nullableString,
  effective_year: z.number().int().nullable(),
  framework_code: nullableString,
  controlling_authority: nullableString,
  school_sector: z.string(),
  authority_level: z.string(),
  framework_type: z.string(),
  diploma_type: z.string(),
  is_standard_framework: z.boolean(),
  cohort_start_year: z.number().int().nullable(),
  cohort_end_year: z.number().int().nullable(),
  graduation_year_start: z.number().int().nullable(),
  graduation_year_end: z.number().int().nullable(),
  cohort_label: nullableString,
  version_label: nullableString,
  effective_date: nullableString,
  expiration_date: nullableString,
  local_requirements_may_exceed: z.boolean().nullable(),
  local_override_notes: nullableString,
  source_scope_notes: nullableString,
  pathway_type: nullableString,
  grade_at_transfer_applicability: nullableString,
  transfer_student_notes: nullableString,
  international_transfer_notes: nullableString,
  counselor_review_required: z.boolean(),
  coverage_status: coverageStatus.exclude(["country_seed_only"]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DestinationFramework = z.infer<typeof DestinationFrameworkSchema>;

export const GraduationRequirementSchema = z.object({
  id: z.string().uuid(),
  framework_id: z.string().uuid(),
  subject_category: z.string(),
  credits_required: z.coerce.number().nullable(),
  specific_courses: z.array(z.string()).nullable(),
  notes: nullableString,
  requirement_type: z.string(),
  priority: z.string(),
  requirement_group_id: z.string().uuid().nullable(),
  requirement_code: nullableString,
  requirement_kind: z.string(),
  unit_name: nullableString,
  minimum_value: z.coerce.number().nullable(),
  completion_rule: z.string(),
  applies_to_pathway: nullableString,
  substitution_allowed: z.boolean().nullable(),
  substitution_notes: nullableString,
  sequence_notes: nullableString,
  local_override: z.boolean(),
  effective_date: nullableString,
  expiration_date: nullableString,
  coverage_status: coverageStatus.exclude(["country_seed_only"]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type GraduationRequirement = z.infer<typeof GraduationRequirementSchema>;

export const EducationProgramSchema = z.object({
  id: z.string().uuid(),
  country_id: z.string().uuid(),
  jurisdiction_id: z.string().uuid().nullable(),
  program_name: z.string(),
  program_type: z.string(),
  level: nullableString,
  description: nullableString,
  availability_scope: z.string(),
  website_url: nullableString,
  framework_id: z.string().uuid().nullable(),
  controlling_organization: nullableString,
  grade_range: nullableString,
  credential_or_recognition: nullableString,
  relationship_to_graduation: nullableString,
  school_authorization_required: z.boolean().nullable(),
  school_authorization_notes: nullableString,
  cohort_start_year: z.number().int().nullable(),
  cohort_end_year: z.number().int().nullable(),
  effective_date: nullableString,
  coverage_status: coverageStatus.exclude(["country_seed_only"]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type EducationProgram = z.infer<typeof EducationProgramSchema>;

export const MappingRuleSchema = z.object({
  id: z.string().uuid(),
  source_country_id: z.string().uuid(),
  source_curriculum_id: z.string().uuid().nullable(),
  destination_country_id: z.string().uuid(),
  destination_jurisdiction_id: z.string().uuid().nullable(),
  source_subject_category: z.string(),
  source_course_pattern: nullableString,
  target_subject_category: z.string(),
  probable_equivalent: nullableString,
  confidence_level: z.enum(["high", "medium", "low", "unclear"]),
  needs_counselor_review: z.boolean(),
  rule_notes: nullableString,
  coverage_status: coverageStatus.exclude(["country_seed_only"]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type MappingRule = z.infer<typeof MappingRuleSchema>;

export const DataSourceSchema = z.object({
  id: z.string().uuid(),
  source_title: z.string(),
  source_url: z.string(),
  source_authority: z.string(),
  country_id: z.string().uuid().nullable(),
  jurisdiction_id: z.string().uuid().nullable(),
  source_type: z.string(),
  access_method: z.string(),
  license_notes: nullableString,
  last_verified_at: nullableString,
  reliability_level: z.enum(["official", "high", "medium", "low", "unverified"]),
  publication_date: nullableString,
  effective_date: nullableString,
  document_version: nullableString,
  created_at: z.string(),
  updated_at: z.string(),
});
export type DataSource = z.infer<typeof DataSourceSchema>;

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

async function selectCountries(
  column?: "is_source_priority" | "is_destination_priority",
  allowedIso3?: readonly string[],
) {
  let query = requireSupabase().from("countries").select("*");
  if (column) query = query.eq(column, true);
  if (allowedIso3?.length) query = query.in("iso3", [...allowedIso3]);
  const orderColumn =
    column === "is_source_priority"
      ? "priority_rank_source"
      : column === "is_destination_priority"
        ? "priority_rank_destination"
        : "name";
  const { data, error } = await query.order(orderColumn, { ascending: true });
  throwIfError(error);
  return z.array(CountrySchema).parse(data ?? []);
}

export const getPriorityCountries = () => selectCountries(undefined, MVP_PRIORITY_COUNTRY_ISO3);
export const getSourceCountries = () =>
  selectCountries("is_source_priority", MVP_SOURCE_COUNTRY_ISO3).then((countries) =>
    sortByMvpSourceCountryOrder(filterMvpSourceCountries(countries)),
  );
export const getDestinationCountries = () =>
  selectCountries("is_destination_priority", MVP_DESTINATION_COUNTRY_ISO3).then((countries) =>
    sortByMvpDestinationCountryOrder(filterMvpDestinationCountries(countries)),
  );

export async function getCountryEducationProfile(countryId: string) {
  const client = requireSupabase();
  const [country, jurisdictions, curricula, frameworks, programs, sources] = await Promise.all([
    client.from("countries").select("*").eq("id", countryId).single(),
    client.from("jurisdictions").select("*").eq("country_id", countryId).order("name"),
    client.from("curricula").select("*").eq("country_id", countryId).order("name"),
    client
      .from("destination_graduation_frameworks")
      .select("*")
      .eq("country_id", countryId)
      .order("framework_name"),
    client.from("education_programs").select("*").eq("country_id", countryId).order("program_name"),
    client.from("data_sources").select("*").eq("country_id", countryId).order("source_title"),
  ]);
  [country, jurisdictions, curricula, frameworks, programs, sources].forEach((result) =>
    throwIfError(result.error),
  );
  return {
    country: CountrySchema.parse(country.data),
    jurisdictions: z.array(JurisdictionSchema).parse(jurisdictions.data ?? []),
    curricula: z.array(CurriculumSchema).parse(curricula.data ?? []),
    frameworks: z.array(DestinationFrameworkSchema).parse(frameworks.data ?? []),
    programs: z.array(EducationProgramSchema).parse(programs.data ?? []),
    sources: z.array(DataSourceSchema).parse(sources.data ?? []),
  };
}

export async function getJurisdictions(countryId: string) {
  const { data, error } = await requireSupabase()
    .from("jurisdictions")
    .select("*")
    .eq("country_id", countryId)
    .order("jurisdiction_type")
    .order("name");
  throwIfError(error);
  return z
    .array(JurisdictionSchema)
    .parse(data ?? [])
    .filter(
      (row) =>
        row.is_selectable_for_planning ||
        USABLE_REFERENCE_STATUSES.includes(row.coverage_status as never),
    );
}

export async function getCurricula(countryId: string, jurisdictionId?: string | null) {
  let query = requireSupabase()
    .from("curricula")
    .select("*")
    .eq("country_id", countryId)
    .in("coverage_status", USABLE_REFERENCE_STATUSES);
  if (jurisdictionId) {
    query = query.or(`jurisdiction_id.is.null,jurisdiction_id.eq.${jurisdictionId}`);
  }
  const { data, error } = await query.order("name");
  throwIfError(error);
  return z.array(CurriculumSchema).parse(data ?? []);
}

export async function getCurriculumCourses(curriculumId: string) {
  const { data, error } = await requireSupabase()
    .from("curriculum_courses")
    .select("*")
    .eq("curriculum_id", curriculumId)
    .in("coverage_status", USABLE_REFERENCE_STATUSES)
    .order("grade_level")
    .order("course_name_english");
  throwIfError(error);
  return z.array(CurriculumCourseSchema).parse(data ?? []);
}

export async function getDestinationFrameworks(
  countryId: string,
  jurisdictionId?: string | null,
  expectedGraduationYear?: number | null,
) {
  let query = requireSupabase()
    .from("destination_graduation_frameworks")
    .select("*")
    .eq("country_id", countryId)
    .in("coverage_status", USABLE_REFERENCE_STATUSES);
  query = jurisdictionId
    ? query.eq("jurisdiction_id", jurisdictionId)
    : query.is("jurisdiction_id", null);
  const { data, error } = await query.order("framework_name");
  throwIfError(error);
  return z
    .array(DestinationFrameworkSchema)
    .parse(data ?? [])
    .filter((framework) => {
      if (!expectedGraduationYear) return true;
      const starts = framework.graduation_year_start;
      const ends = framework.graduation_year_end;
      return (
        (starts === null || starts <= expectedGraduationYear) &&
        (ends === null || ends >= expectedGraduationYear)
      );
    });
}

export async function getGraduationRequirements(frameworkId: string) {
  const { data, error } = await requireSupabase()
    .from("graduation_requirements")
    .select("*")
    .eq("framework_id", frameworkId)
    .in("coverage_status", USABLE_REFERENCE_STATUSES)
    .order("priority")
    .order("subject_category");
  throwIfError(error);
  return z.array(GraduationRequirementSchema).parse(data ?? []);
}

export async function getEducationPrograms(
  countryId: string,
  jurisdictionId?: string | null,
  frameworkId?: string | null,
) {
  let query = requireSupabase()
    .from("education_programs")
    .select("*")
    .eq("country_id", countryId)
    .in("coverage_status", USABLE_REFERENCE_STATUSES);
  query = jurisdictionId
    ? query.or(`jurisdiction_id.is.null,jurisdiction_id.eq.${jurisdictionId}`)
    : query.is("jurisdiction_id", null);
  const { data, error } = await query.order("program_name");
  throwIfError(error);
  return z
    .array(EducationProgramSchema)
    .parse(data ?? [])
    .filter((program) => !program.framework_id || program.framework_id === frameworkId);
}

export type MappingRuleFilters = {
  sourceCountryId?: string;
  sourceCurriculumId?: string;
  destinationCountryId?: string;
  destinationJurisdictionId?: string;
  sourceSubjectCategory?: string;
  targetSubjectCategory?: string;
};

export async function getMappingRules(filters: MappingRuleFilters) {
  let query = requireSupabase()
    .from("mapping_rules")
    .select("*")
    .in("coverage_status", USABLE_REFERENCE_STATUSES);
  const fields: Array<[keyof MappingRuleFilters, string]> = [
    ["sourceCountryId", "source_country_id"],
    ["sourceCurriculumId", "source_curriculum_id"],
    ["destinationCountryId", "destination_country_id"],
    ["destinationJurisdictionId", "destination_jurisdiction_id"],
    ["sourceSubjectCategory", "source_subject_category"],
    ["targetSubjectCategory", "target_subject_category"],
  ];
  for (const [input, column] of fields) {
    if (filters[input]) query = query.eq(column, filters[input]);
  }
  const { data, error } = await query.order("confidence_level");
  throwIfError(error);
  return z.array(MappingRuleSchema).parse(data ?? []);
}

export async function getDataSourcesForRecord(tableName: string, recordId: string) {
  const { data, error } = await requireSupabase()
    .from("reference_record_sources")
    .select("field_name,notes,data_source:data_sources(*)")
    .eq("table_name", tableName)
    .eq("record_id", recordId);
  throwIfError(error);
  return z
    .array(
      z.object({
        field_name: nullableString,
        notes: nullableString,
        data_source: DataSourceSchema,
      }),
    )
    .parse(data ?? []);
}

export type ReferenceCoverage = {
  country: Country;
  mvpVisibility: MvpVisibility;
  jurisdictions: number;
  curricula: number;
  curriculumCourses: number;
  frameworks: number;
  requirements: number;
  programs: number;
  dataSources: number;
};

export async function getReferenceCoverage(): Promise<ReferenceCoverage[]> {
  const client = requireSupabase();
  const [
    countries,
    jurisdictions,
    curricula,
    courses,
    frameworks,
    requirements,
    programs,
    sources,
  ] = await Promise.all([
    client.from("countries").select("*"),
    client.from("jurisdictions").select("id,country_id"),
    client.from("curricula").select("id,country_id"),
    client.from("curriculum_courses").select("id,curriculum_id"),
    client.from("destination_graduation_frameworks").select("id,country_id"),
    client.from("graduation_requirements").select("id,framework_id"),
    client.from("education_programs").select("id,country_id"),
    client.from("data_sources").select("id,country_id"),
  ]);
  [
    countries,
    jurisdictions,
    curricula,
    courses,
    frameworks,
    requirements,
    programs,
    sources,
  ].forEach((result) => throwIfError(result.error));
  const countryRows = z.array(CountrySchema).parse(countries.data ?? []);
  return countryRows
    .map((country) => {
      const countryCurricula = (curricula.data ?? []).filter(
        (row) => row.country_id === country.id,
      );
      const countryFrameworks = (frameworks.data ?? []).filter(
        (row) => row.country_id === country.id,
      );
      return {
        country,
        mvpVisibility: getMvpVisibility(country.iso3),
        jurisdictions: (jurisdictions.data ?? []).filter((row) => row.country_id === country.id)
          .length,
        curricula: countryCurricula.length,
        curriculumCourses: (courses.data ?? []).filter((row) =>
          countryCurricula.some((curriculum) => curriculum.id === row.curriculum_id),
        ).length,
        frameworks: countryFrameworks.length,
        requirements: (requirements.data ?? []).filter((row) =>
          countryFrameworks.some((framework) => framework.id === row.framework_id),
        ).length,
        programs: (programs.data ?? []).filter((row) => row.country_id === country.id).length,
        dataSources: (sources.data ?? []).filter((row) => row.country_id === country.id).length,
      };
    })
    .sort((a, b) => a.country.name.localeCompare(b.country.name));
}
