-- Scholaport global education reference-data foundation.
-- Priority-country rows are intentionally country_seed_only until sourced research is imported.

create extension if not exists pgcrypto;

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  iso2 text not null,
  iso3 text not null,
  region text,
  primary_languages text[] not null default '{}',
  education_system_summary text,
  grade_structure jsonb not null default '{}'::jsonb,
  is_source_priority boolean not null default false,
  is_destination_priority boolean not null default false,
  priority_rank_source integer,
  priority_rank_destination integer,
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint countries_iso2_format check (iso2 ~ '^[A-Z]{2}$'),
  constraint countries_iso3_format check (iso3 ~ '^[A-Z]{3}$'),
  constraint countries_coverage_status check (coverage_status in ('country_seed_only','needs_research','not_verified','partial','verified','official'))
);

create table if not exists public.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  parent_jurisdiction_id uuid references public.jurisdictions(id) on delete cascade,
  name text not null,
  jurisdiction_type text not null,
  code text,
  education_authority_name text,
  website_url text,
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jurisdictions_type check (jurisdiction_type in ('country','state','province','territory','region','district','school_board','exam_board','curriculum_board','school')),
  constraint jurisdictions_coverage check (coverage_status in ('needs_research','not_verified','partial','verified','official'))
);

create table if not exists public.curricula (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions(id) on delete set null,
  name text not null,
  curriculum_type text not null,
  level text not null,
  grade_range text,
  authority text,
  website_url text,
  description text,
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curricula_type check (curriculum_type in ('national','state_board','exam_board','international','vocational','advanced_program')),
  constraint curricula_coverage check (coverage_status in ('needs_research','not_verified','partial','verified','official'))
);

create table if not exists public.curriculum_courses (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curricula(id) on delete cascade,
  course_code text,
  course_name_local text not null,
  course_name_english text,
  subject_category text not null,
  grade_level integer,
  level text,
  credits_estimated numeric(6,2),
  is_required boolean,
  is_exam_based boolean,
  description text,
  learning_outcomes_summary text,
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curriculum_courses_coverage check (coverage_status in ('needs_research','not_verified','partial','verified','official'))
);

create table if not exists public.destination_graduation_frameworks (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions(id) on delete set null,
  framework_name text not null,
  credential_awarded text,
  grade_range text,
  total_credits_required numeric(7,2),
  credit_unit_name text,
  has_state_or_national_exams boolean,
  exam_notes text,
  effective_year integer,
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint destination_frameworks_coverage check (coverage_status in ('needs_research','not_verified','partial','verified','official'))
);

create table if not exists public.graduation_requirements (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.destination_graduation_frameworks(id) on delete cascade,
  subject_category text not null,
  credits_required numeric(7,2),
  specific_courses text[],
  notes text,
  requirement_type text not null,
  priority text not null default 'medium',
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint graduation_requirement_type check (requirement_type in ('core','elective','exam','language','program_specific','local_override')),
  constraint graduation_requirements_coverage check (coverage_status in ('needs_research','not_verified','partial','verified','official'))
);

create table if not exists public.education_programs (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions(id) on delete set null,
  program_name text not null,
  program_type text not null,
  level text,
  description text,
  availability_scope text not null,
  website_url text,
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint education_program_scope check (availability_scope in ('national','state','province','district','school_specific','international_schools_only')),
  constraint education_programs_coverage check (coverage_status in ('needs_research','not_verified','partial','verified','official'))
);

create table if not exists public.mapping_rules (
  id uuid primary key default gen_random_uuid(),
  source_country_id uuid not null references public.countries(id) on delete cascade,
  source_curriculum_id uuid references public.curricula(id) on delete set null,
  destination_country_id uuid not null references public.countries(id) on delete cascade,
  destination_jurisdiction_id uuid references public.jurisdictions(id) on delete set null,
  source_subject_category text not null,
  source_course_pattern text,
  target_subject_category text not null,
  probable_equivalent text,
  confidence_level text not null default 'unclear',
  needs_counselor_review boolean not null default true,
  rule_notes text,
  coverage_status text not null default 'needs_research',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mapping_rules_confidence check (confidence_level in ('high','medium','low','unclear')),
  constraint mapping_rules_coverage check (coverage_status in ('needs_research','not_verified','partial','verified','official'))
);

create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  source_title text not null,
  source_url text not null,
  source_authority text not null,
  country_id uuid references public.countries(id) on delete set null,
  jurisdiction_id uuid references public.jurisdictions(id) on delete set null,
  source_type text not null,
  access_method text not null,
  license_notes text,
  last_verified_at date,
  reliability_level text not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint data_source_type check (source_type in ('government_site','official_pdf','official_api','open_data_portal','ministry_page','education_board_site','manual_review','school_catalog')),
  constraint data_source_access check (access_method in ('api','csv','pdf','html','manual_entry','google_sheet_import')),
  constraint data_source_reliability check (reliability_level in ('official','high','medium','low','unverified'))
);

create table if not exists public.reference_record_sources (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  data_source_id uuid not null references public.data_sources(id) on delete cascade,
  field_name text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.student_profiles add column if not exists source_country_id uuid references public.countries(id) on delete set null;
alter table public.student_profiles add column if not exists source_curriculum_id uuid references public.curricula(id) on delete set null;
alter table public.student_profiles add column if not exists destination_country_id uuid references public.countries(id) on delete set null;
alter table public.student_profiles add column if not exists destination_jurisdiction_id uuid references public.jurisdictions(id) on delete set null;
alter table public.student_profiles add column if not exists destination_framework_id uuid references public.destination_graduation_frameworks(id) on delete set null;
create index if not exists student_profiles_source_country_idx on public.student_profiles(source_country_id);
create index if not exists student_profiles_destination_country_idx on public.student_profiles(destination_country_id);

create unique index if not exists countries_iso2_uidx on public.countries(iso2);
create unique index if not exists countries_iso3_uidx on public.countries(iso3);
create index if not exists jurisdictions_country_idx on public.jurisdictions(country_id);
create index if not exists jurisdictions_parent_idx on public.jurisdictions(parent_jurisdiction_id);
create index if not exists jurisdictions_type_idx on public.jurisdictions(jurisdiction_type);
create unique index if not exists jurisdictions_identity_uidx on public.jurisdictions(country_id, name, jurisdiction_type);
create index if not exists curricula_country_idx on public.curricula(country_id);
create index if not exists curricula_jurisdiction_idx on public.curricula(jurisdiction_id);
create index if not exists curricula_type_idx on public.curricula(curriculum_type);
create index if not exists curriculum_courses_curriculum_idx on public.curriculum_courses(curriculum_id);
create index if not exists curriculum_courses_subject_idx on public.curriculum_courses(subject_category);
create index if not exists curriculum_courses_grade_idx on public.curriculum_courses(grade_level);
create index if not exists destination_frameworks_country_idx on public.destination_graduation_frameworks(country_id);
create index if not exists destination_frameworks_jurisdiction_idx on public.destination_graduation_frameworks(jurisdiction_id);
create index if not exists graduation_requirements_framework_idx on public.graduation_requirements(framework_id);
create index if not exists graduation_requirements_subject_idx on public.graduation_requirements(subject_category);
create index if not exists education_programs_country_idx on public.education_programs(country_id);
create index if not exists education_programs_type_idx on public.education_programs(program_type);
create index if not exists mapping_rules_source_country_idx on public.mapping_rules(source_country_id);
create index if not exists mapping_rules_destination_country_idx on public.mapping_rules(destination_country_id);
create index if not exists mapping_rules_source_subject_idx on public.mapping_rules(source_subject_category);
create index if not exists mapping_rules_target_subject_idx on public.mapping_rules(target_subject_category);
create index if not exists data_sources_country_idx on public.data_sources(country_id);
create index if not exists data_sources_jurisdiction_idx on public.data_sources(jurisdiction_id);
create index if not exists data_sources_reliability_idx on public.data_sources(reliability_level);
create unique index if not exists data_sources_url_uidx on public.data_sources(source_url);
create index if not exists reference_record_sources_record_idx on public.reference_record_sources(table_name, record_id);
create unique index if not exists reference_record_sources_identity_uidx on public.reference_record_sources(table_name, record_id, data_source_id, coalesce(field_name, ''));

do $$
declare table_to_secure text;
begin
  foreach table_to_secure in array array[
    'countries','jurisdictions','curricula','curriculum_courses',
    'destination_graduation_frameworks','graduation_requirements','education_programs',
    'mapping_rules','data_sources','reference_record_sources'
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
    'countries','jurisdictions','curricula','curriculum_courses',
    'destination_graduation_frameworks','graduation_requirements','education_programs',
    'mapping_rules','data_sources'
  ] loop
    execute format('drop trigger if exists %I on public.%I', table_with_timestamp || '_updated_at', table_with_timestamp);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', table_with_timestamp || '_updated_at', table_with_timestamp);
  end loop;
end $$;

insert into public.countries (
  name, iso2, iso3, region, primary_languages, education_system_summary, grade_structure,
  is_source_priority, is_destination_priority, priority_rank_source, priority_rank_destination,
  coverage_status
) values
  ('India','IN','IND','Asia','{}',null,'{}',true,false,1,null,'country_seed_only'),
  ('China','CN','CHN','Asia','{}',null,'{}',true,false,2,null,'country_seed_only'),
  ('Mexico','MX','MEX','North America','{}',null,'{}',true,false,3,null,'country_seed_only'),
  ('Philippines','PH','PHL','Asia','{}',null,'{}',true,false,4,null,'country_seed_only'),
  ('Pakistan','PK','PAK','Asia','{}',null,'{}',true,false,5,null,'country_seed_only'),
  ('Bangladesh','BD','BGD','Asia','{}',null,'{}',true,false,6,null,'country_seed_only'),
  ('Ukraine','UA','UKR','Europe','{}',null,'{}',true,false,7,null,'country_seed_only'),
  ('Russia','RU','RUS','Europe / Asia','{}',null,'{}',true,false,8,null,'country_seed_only'),
  ('Egypt','EG','EGY','Africa','{}',null,'{}',true,false,9,null,'country_seed_only'),
  ('Nigeria','NG','NGA','Africa','{}',null,'{}',true,false,10,null,'country_seed_only'),
  ('United States','US','USA','North America','{}',null,'{}',false,true,null,1,'country_seed_only'),
  ('Germany','DE','DEU','Europe','{}',null,'{}',false,true,null,2,'country_seed_only'),
  ('Saudi Arabia','SA','SAU','Asia','{}',null,'{}',false,true,null,3,'country_seed_only'),
  ('United Kingdom','GB','GBR','Europe','{}',null,'{}',false,true,null,4,'country_seed_only'),
  ('United Arab Emirates','AE','ARE','Asia','{}',null,'{}',false,true,null,5,'country_seed_only'),
  ('France','FR','FRA','Europe','{}',null,'{}',false,true,null,6,'country_seed_only'),
  ('Canada','CA','CAN','North America','{}',null,'{}',false,true,null,7,'country_seed_only'),
  ('Australia','AU','AUS','Oceania','{}',null,'{}',false,true,null,8,'country_seed_only'),
  ('Spain','ES','ESP','Europe','{}',null,'{}',false,true,null,9,'country_seed_only'),
  ('Italy','IT','ITA','Europe','{}',null,'{}',false,true,null,10,'country_seed_only')
on conflict (iso3) do update set
  name = excluded.name,
  iso2 = excluded.iso2,
  region = excluded.region,
  is_source_priority = excluded.is_source_priority,
  is_destination_priority = excluded.is_destination_priority,
  priority_rank_source = excluded.priority_rank_source,
  priority_rank_destination = excluded.priority_rank_destination;

-- Preserve the existing Georgia jurisdiction name, but do not claim its old unsourced
-- credit values are verified in the new global reference model.
insert into public.jurisdictions (country_id, name, jurisdiction_type, code, coverage_status)
select id, 'Georgia', 'state', 'GA', 'needs_research'
from public.countries where iso3 = 'USA'
on conflict (country_id, name, jurisdiction_type) do nothing;
