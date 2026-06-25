-- United States destination-education foundation.
-- Additive only: preserves the existing global reference model and stable UUIDs.

alter table public.jurisdictions
  add column if not exists is_selectable_for_planning boolean not null default false,
  add column if not exists identity_verification_status text not null default 'unverified',
  add column if not exists detail_coverage_status text not null default 'research_pending',
  add column if not exists controls_statewide_graduation_requirements boolean,
  add column if not exists local_requirements_may_exceed boolean,
  add column if not exists statewide_course_catalog_status text not null default 'unknown',
  add column if not exists jurisdiction_notes text;

alter table public.jurisdictions
  drop constraint if exists jurisdictions_identity_verification_status,
  add constraint jurisdictions_identity_verification_status
    check (identity_verification_status in ('unverified', 'verified')),
  drop constraint if exists jurisdictions_detail_coverage_status,
  add constraint jurisdictions_detail_coverage_status
    check (detail_coverage_status in ('research_pending', 'partial', 'verified', 'local_control')),
  drop constraint if exists jurisdictions_course_catalog_status,
  add constraint jurisdictions_course_catalog_status
    check (statewide_course_catalog_status in ('unknown', 'available', 'local_only', 'not_identified'));

create index if not exists jurisdictions_planning_idx
  on public.jurisdictions(country_id, is_selectable_for_planning, name);

alter table public.destination_graduation_frameworks
  add column if not exists framework_code text,
  add column if not exists controlling_authority text,
  add column if not exists school_sector text not null default 'public',
  add column if not exists authority_level text not null default 'state',
  add column if not exists framework_type text not null default 'credit_based',
  add column if not exists diploma_type text not null default 'standard',
  add column if not exists is_standard_framework boolean not null default true,
  add column if not exists cohort_start_year integer,
  add column if not exists cohort_end_year integer,
  add column if not exists graduation_year_start integer,
  add column if not exists graduation_year_end integer,
  add column if not exists cohort_label text,
  add column if not exists version_label text,
  add column if not exists effective_date date,
  add column if not exists expiration_date date,
  add column if not exists local_requirements_may_exceed boolean,
  add column if not exists local_override_notes text,
  add column if not exists source_scope_notes text;

alter table public.destination_graduation_frameworks
  drop constraint if exists destination_frameworks_school_sector,
  add constraint destination_frameworks_school_sector
    check (school_sector in ('public', 'charter', 'private', 'tribal', 'all', 'other')),
  drop constraint if exists destination_frameworks_authority_level,
  add constraint destination_frameworks_authority_level
    check (authority_level in ('state', 'district', 'school', 'federal_district', 'other')),
  drop constraint if exists destination_frameworks_type,
  add constraint destination_frameworks_type
    check (framework_type in ('credit_based', 'competency_based', 'assessment_based', 'qualification_based', 'hybrid', 'local_control')),
  drop constraint if exists destination_frameworks_diploma_type,
  add constraint destination_frameworks_diploma_type
    check (diploma_type in ('standard', 'advanced', 'honors', 'career_technical', 'alternate', 'endorsement', 'other')),
  drop constraint if exists destination_frameworks_year_ranges,
  add constraint destination_frameworks_year_ranges check (
    (cohort_end_year is null or cohort_start_year is null or cohort_end_year >= cohort_start_year)
    and (graduation_year_end is null or graduation_year_start is null or graduation_year_end >= graduation_year_start)
    and (expiration_date is null or effective_date is null or expiration_date >= effective_date)
  );

create index if not exists destination_frameworks_applicability_idx
  on public.destination_graduation_frameworks(
    jurisdiction_id,
    school_sector,
    is_standard_framework,
    graduation_year_start,
    graduation_year_end
  );

create table if not exists public.graduation_requirement_groups (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.destination_graduation_frameworks(id) on delete cascade,
  group_key text not null,
  group_name text not null,
  logic_type text not null,
  minimum_options integer,
  minimum_credits numeric(7,2),
  notes text,
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint graduation_requirement_groups_logic
    check (logic_type in ('all_of', 'one_of', 'minimum_n', 'credit_total', 'local_determined')),
  constraint graduation_requirement_groups_coverage
    check (coverage_status in ('needs_research', 'not_verified', 'partial', 'verified', 'official')),
  unique (framework_id, group_key)
);

alter table public.graduation_requirements
  add column if not exists requirement_group_id uuid references public.graduation_requirement_groups(id) on delete set null,
  add column if not exists requirement_code text,
  add column if not exists requirement_kind text not null default 'credit',
  add column if not exists unit_name text,
  add column if not exists minimum_value numeric(7,2),
  add column if not exists completion_rule text not null default 'all_of',
  add column if not exists applies_to_pathway text,
  add column if not exists substitution_allowed boolean,
  add column if not exists substitution_notes text,
  add column if not exists sequence_notes text,
  add column if not exists local_override boolean not null default false,
  add column if not exists effective_date date,
  add column if not exists expiration_date date;

alter table public.graduation_requirements
  drop constraint if exists graduation_requirements_kind,
  add constraint graduation_requirements_kind
    check (requirement_kind in ('credit', 'course', 'assessment', 'non_course', 'elective', 'local_override')),
  drop constraint if exists graduation_requirements_completion_rule,
  add constraint graduation_requirements_completion_rule
    check (completion_rule in ('all_of', 'one_of', 'minimum_n', 'informational', 'local_determined')),
  drop constraint if exists graduation_requirements_effective_range,
  add constraint graduation_requirements_effective_range
    check (expiration_date is null or effective_date is null or expiration_date >= effective_date);

create table if not exists public.graduation_requirement_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.graduation_requirement_groups(id) on delete cascade,
  requirement_id uuid references public.graduation_requirements(id) on delete set null,
  option_key text not null,
  option_name text not null,
  subject_category text,
  credits_required numeric(7,2),
  specific_courses text[],
  condition_notes text,
  substitution_notes text,
  is_default boolean not null default false,
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint graduation_requirement_options_coverage
    check (coverage_status in ('needs_research', 'not_verified', 'partial', 'verified', 'official')),
  unique (group_id, option_key)
);

create table if not exists public.jurisdiction_course_catalogs (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  jurisdiction_id uuid not null references public.jurisdictions(id) on delete cascade,
  catalog_name text not null,
  catalog_type text not null,
  authority text not null,
  website_url text not null,
  school_sector text not null default 'public',
  grade_range text,
  academic_year text,
  effective_date date,
  statewide_recognition_scope text not null,
  availability_notes text,
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jurisdiction_course_catalogs_type
    check (catalog_type in ('course_codes', 'subject_taxonomy', 'graduation_catalog', 'standards', 'local_only')),
  constraint jurisdiction_course_catalogs_school_sector
    check (school_sector in ('public', 'charter', 'private', 'tribal', 'all', 'other')),
  constraint jurisdiction_course_catalogs_coverage
    check (coverage_status in ('needs_research', 'not_verified', 'partial', 'verified', 'official')),
  unique (jurisdiction_id, catalog_name)
);

create table if not exists public.jurisdiction_courses (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.jurisdiction_course_catalogs(id) on delete cascade,
  jurisdiction_id uuid not null references public.jurisdictions(id) on delete cascade,
  course_code text,
  course_title text not null,
  subject_category text not null,
  grade_range text,
  credit_value numeric(7,2),
  credit_unit_name text,
  course_duration text,
  prerequisites text,
  standards_url text,
  graduation_classification text,
  required_sequence text,
  semester_designation text,
  active_status text not null default 'active',
  availability_scope text not null default 'state_recognized_not_guaranteed',
  notes text,
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jurisdiction_courses_active_status
    check (active_status in ('active', 'inactive', 'unknown')),
  constraint jurisdiction_courses_availability_scope
    check (availability_scope in ('state_required', 'state_recognized_not_guaranteed', 'district_defined', 'school_defined')),
  constraint jurisdiction_courses_coverage
    check (coverage_status in ('needs_research', 'not_verified', 'partial', 'verified', 'official'))
);

create index if not exists jurisdiction_course_catalogs_jurisdiction_idx
  on public.jurisdiction_course_catalogs(jurisdiction_id);
create index if not exists jurisdiction_courses_catalog_idx
  on public.jurisdiction_courses(catalog_id);
create index if not exists jurisdiction_courses_subject_idx
  on public.jurisdiction_courses(jurisdiction_id, subject_category);

alter table public.education_programs
  add column if not exists framework_id uuid references public.destination_graduation_frameworks(id) on delete set null,
  add column if not exists controlling_organization text,
  add column if not exists grade_range text,
  add column if not exists credential_or_recognition text,
  add column if not exists relationship_to_graduation text,
  add column if not exists school_authorization_required boolean,
  add column if not exists school_authorization_notes text,
  add column if not exists cohort_start_year integer,
  add column if not exists cohort_end_year integer,
  add column if not exists effective_date date;

alter table public.education_programs
  drop constraint if exists education_programs_cohort_range,
  add constraint education_programs_cohort_range
    check (cohort_end_year is null or cohort_start_year is null or cohort_end_year >= cohort_start_year);

alter table public.data_sources
  add column if not exists publication_date date,
  add column if not exists effective_date date,
  add column if not exists document_version text;

alter table public.reference_record_sources
  add column if not exists source_section_or_page text,
  add column if not exists claim_summary text,
  add column if not exists applicable_jurisdiction_id uuid references public.jurisdictions(id) on delete set null,
  add column if not exists applicable_cohort text,
  add column if not exists applicable_school_sector text,
  add column if not exists direct_support_confirmed boolean,
  add column if not exists scope_match_confirmed boolean,
  add column if not exists current_applicability_confirmed boolean;

alter table public.student_profiles
  add column if not exists destination_program_id uuid references public.education_programs(id) on delete set null,
  add column if not exists target_district text,
  add column if not exists destination_country_label text,
  add column if not exists destination_jurisdiction_label text,
  add column if not exists destination_framework_label text,
  add column if not exists destination_program_label text,
  add column if not exists applicable_cohort text,
  add column if not exists framework_version_label text;

create index if not exists student_profiles_destination_jurisdiction_idx
  on public.student_profiles(destination_jurisdiction_id);
create index if not exists student_profiles_destination_framework_idx
  on public.student_profiles(destination_framework_id);
create index if not exists student_profiles_destination_program_idx
  on public.student_profiles(destination_program_id);

create or replace function public.clear_incompatible_student_destination_references()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  selected_jurisdiction_country uuid;
  selected_framework record;
  selected_program record;
begin
  if new.destination_jurisdiction_id is not null then
    select country_id into selected_jurisdiction_country
    from public.jurisdictions where id = new.destination_jurisdiction_id;
    if selected_jurisdiction_country is distinct from new.destination_country_id then
      new.destination_jurisdiction_id := null;
      new.destination_jurisdiction_label := null;
      new.destination_framework_id := null;
      new.destination_framework_label := null;
      new.destination_program_id := null;
      new.destination_program_label := null;
    end if;
  end if;

  if new.destination_framework_id is not null then
    select country_id, jurisdiction_id into selected_framework
    from public.destination_graduation_frameworks where id = new.destination_framework_id;
    if selected_framework.country_id is distinct from new.destination_country_id
      or selected_framework.jurisdiction_id is distinct from new.destination_jurisdiction_id then
      new.destination_framework_id := null;
      new.destination_framework_label := null;
      new.applicable_cohort := null;
      new.framework_version_label := null;
      new.destination_program_id := null;
      new.destination_program_label := null;
    end if;
  end if;

  if new.destination_program_id is not null then
    select country_id, jurisdiction_id, framework_id into selected_program
    from public.education_programs where id = new.destination_program_id;
    if selected_program.country_id is distinct from new.destination_country_id
      or (selected_program.jurisdiction_id is not null
        and selected_program.jurisdiction_id is distinct from new.destination_jurisdiction_id)
      or (selected_program.framework_id is not null
        and selected_program.framework_id is distinct from new.destination_framework_id) then
      new.destination_program_id := null;
      new.destination_program_label := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists student_profiles_clear_incompatible_destination on public.student_profiles;
create trigger student_profiles_clear_incompatible_destination
before insert or update of destination_country_id, destination_jurisdiction_id,
  destination_framework_id, destination_program_id on public.student_profiles
for each row execute function public.clear_incompatible_student_destination_references();

do $$
declare table_to_secure text;
begin
  foreach table_to_secure in array array[
    'graduation_requirement_groups',
    'graduation_requirement_options',
    'jurisdiction_course_catalogs',
    'jurisdiction_courses'
  ] loop
    execute format('alter table public.%I enable row level security', table_to_secure);
    execute format('drop policy if exists "public reads reference data" on public.%I', table_to_secure);
    execute format('create policy "public reads reference data" on public.%I for select using (true)', table_to_secure);
  end loop;
end $$;

do $$
declare table_with_timestamp text;
begin
  foreach table_with_timestamp in array array[
    'graduation_requirement_groups',
    'graduation_requirement_options',
    'jurisdiction_course_catalogs',
    'jurisdiction_courses'
  ] loop
    execute format('drop trigger if exists %I on public.%I', table_with_timestamp || '_updated_at', table_with_timestamp);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', table_with_timestamp || '_updated_at', table_with_timestamp);
  end loop;
end $$;
