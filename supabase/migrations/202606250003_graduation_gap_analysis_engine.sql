-- Scholaport graduation gap analysis engine.
-- Non-destructive extension of the original MVP gap tables.

alter table public.gap_analyses alter column state_id drop not null;
alter table public.gap_analyses add column if not exists credit_mapping_run_id uuid references public.credit_mapping_runs(id) on delete set null;
alter table public.gap_analyses add column if not exists destination_country_id uuid references public.countries(id) on delete set null;
alter table public.gap_analyses add column if not exists destination_jurisdiction_id uuid references public.jurisdictions(id) on delete set null;
alter table public.gap_analyses add column if not exists destination_framework_id uuid references public.destination_graduation_frameworks(id) on delete set null;
alter table public.gap_analyses add column if not exists destination_program_id uuid references public.education_programs(id) on delete set null;
alter table public.gap_analyses add column if not exists expected_graduation_year integer;
alter table public.gap_analyses add column if not exists grade_at_transfer integer;
alter table public.gap_analyses add column if not exists status text not null default 'not_started';
alter table public.gap_analyses add column if not exists overall_risk_level text not null default 'gray';
alter table public.gap_analyses add column if not exists total_likely_earned_credits numeric(7,2) not null default 0;
alter table public.gap_analyses add column if not exists total_possible_earned_credits numeric(7,2) not null default 0;
alter table public.gap_analyses add column if not exists total_missing_credits numeric(7,2) not null default 0;
alter table public.gap_analyses add column if not exists high_confidence_credits numeric(7,2) not null default 0;
alter table public.gap_analyses add column if not exists medium_confidence_credits numeric(7,2) not null default 0;
alter table public.gap_analyses add column if not exists low_confidence_credits numeric(7,2) not null default 0;
alter table public.gap_analyses add column if not exists unclear_credits numeric(7,2) not null default 0;
alter table public.gap_analyses add column if not exists satisfied_requirement_count integer not null default 0;
alter table public.gap_analyses add column if not exists partial_requirement_count integer not null default 0;
alter table public.gap_analyses add column if not exists missing_requirement_count integer not null default 0;
alter table public.gap_analyses add column if not exists counselor_review_requirement_count integer not null default 0;
alter table public.gap_analyses add column if not exists assessment_gap_count integer not null default 0;
alter table public.gap_analyses add column if not exists local_review_required boolean not null default false;
alter table public.gap_analyses add column if not exists summary_text text;
alter table public.gap_analyses add column if not exists student_next_steps_json jsonb not null default '[]'::jsonb;
alter table public.gap_analyses add column if not exists counselor_questions_json jsonb not null default '[]'::jsonb;
alter table public.gap_analyses add column if not exists warnings_json jsonb not null default '[]'::jsonb;
alter table public.gap_analyses add column if not exists source_snapshot_json jsonb not null default '{}'::jsonb;
alter table public.gap_analyses add column if not exists completed_at timestamptz;

alter table public.gap_analyses
  drop constraint if exists gap_analyses_status_check,
  add constraint gap_analyses_status_check
    check (status in ('not_started', 'processing', 'completed', 'failed', 'needs_review', 'stale')),
  drop constraint if exists gap_analyses_risk_level_check,
  add constraint gap_analyses_risk_level_check
    check (overall_risk_level in ('green', 'yellow', 'red', 'gray'));

alter table public.gap_requirements add column if not exists student_profile_id uuid references public.student_profiles(id) on delete cascade;
alter table public.gap_requirements add column if not exists transcript_id uuid references public.transcripts(id) on delete cascade;
alter table public.gap_requirements add column if not exists destination_requirement_id uuid references public.graduation_requirements(id) on delete set null;
alter table public.gap_requirements add column if not exists requirement_category text;
alter table public.gap_requirements add column if not exists requirement_type text;
alter table public.gap_requirements add column if not exists requirement_name text;
alter table public.gap_requirements add column if not exists required_amount numeric(7,2);
alter table public.gap_requirements add column if not exists earned_likely_amount numeric(7,2) not null default 0;
alter table public.gap_requirements add column if not exists earned_possible_amount numeric(7,2) not null default 0;
alter table public.gap_requirements add column if not exists earned_review_amount numeric(7,2) not null default 0;
alter table public.gap_requirements add column if not exists missing_amount numeric(7,2) not null default 0;
alter table public.gap_requirements add column if not exists unit_type text;
alter table public.gap_requirements add column if not exists risk_level text not null default 'gray';
alter table public.gap_requirements add column if not exists matched_credit_mapping_ids uuid[] not null default '{}';
alter table public.gap_requirements add column if not exists supporting_course_names text[] not null default '{}';
alter table public.gap_requirements add column if not exists unclear_course_names text[] not null default '{}';
alter table public.gap_requirements add column if not exists counselor_review_required boolean not null default false;
alter table public.gap_requirements add column if not exists review_reason text;
alter table public.gap_requirements add column if not exists requirement_notes text;
alter table public.gap_requirements add column if not exists student_explanation text;
alter table public.gap_requirements add column if not exists counselor_question text;
alter table public.gap_requirements add column if not exists display_order integer not null default 0;

update public.gap_requirements
set
  student_profile_id = coalesce(student_profile_id, ga.student_profile_id),
  transcript_id = coalesce(transcript_id, ga.transcript_id),
  requirement_category = coalesce(requirement_category, subject_category),
  requirement_name = coalesce(requirement_name, subject_category),
  required_amount = coalesce(required_amount, credits_required),
  missing_amount = coalesce(missing_amount, credits_remaining)
from public.gap_analyses ga
where ga.id = gap_requirements.gap_analysis_id;

alter table public.gap_requirements
  drop constraint if exists gap_requirements_status_check,
  add constraint gap_requirements_status_check
    check (status in ('satisfied', 'likely_satisfied', 'partially_satisfied', 'missing', 'unclear', 'not_applicable', 'counselor_review_required', 'partial')),
  drop constraint if exists gap_requirements_risk_level_check,
  add constraint gap_requirements_risk_level_check
    check (risk_level in ('green', 'yellow', 'red', 'gray')),
  drop constraint if exists gap_requirements_priority_check,
  add constraint gap_requirements_priority_check
    check (priority in ('critical', 'high', 'medium', 'low', 'informational'));

create index if not exists gap_analyses_user_transcript_idx
  on public.gap_analyses(user_id, transcript_id, status, created_at desc);
create index if not exists gap_analyses_framework_idx
  on public.gap_analyses(destination_framework_id, status);
create index if not exists gap_requirements_analysis_order_idx
  on public.gap_requirements(gap_analysis_id, display_order);
create index if not exists gap_requirements_user_transcript_idx
  on public.gap_requirements(user_id, transcript_id);

create or replace function public.mark_gap_analysis_stale_for_transcript(target_user_id uuid, target_transcript_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.gap_analyses
  set status = 'stale', updated_at = now()
  where user_id = target_user_id
    and transcript_id = target_transcript_id
    and status in ('completed', 'needs_review');
$$;

create or replace function public.mark_gap_analysis_stale_from_mapping()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.mark_gap_analysis_stale_for_transcript(new.user_id, new.transcript_id);
  return new;
end;
$$;

create or replace function public.mark_gap_analysis_stale_from_course()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.mark_gap_analysis_stale_for_transcript(new.user_id, new.transcript_id);
  return new;
end;
$$;

drop trigger if exists credit_mappings_mark_gap_stale on public.credit_mappings;
create trigger credit_mappings_mark_gap_stale
after insert or update on public.credit_mappings
for each row execute function public.mark_gap_analysis_stale_from_mapping();

drop trigger if exists transcript_courses_mark_gap_stale on public.transcript_courses;
create trigger transcript_courses_mark_gap_stale
after insert or update on public.transcript_courses
for each row execute function public.mark_gap_analysis_stale_from_course();
