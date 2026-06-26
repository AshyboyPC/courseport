-- Scholaport personalized academic roadmap engine.
-- Roadmaps are generated from saved gap analyses and gap requirements only.

alter table public.roadmaps add column if not exists transcript_id uuid references public.transcripts(id) on delete cascade;
alter table public.roadmaps add column if not exists destination_country_id uuid references public.countries(id) on delete set null;
alter table public.roadmaps add column if not exists destination_jurisdiction_id uuid references public.jurisdictions(id) on delete set null;
alter table public.roadmaps add column if not exists destination_framework_id uuid references public.destination_graduation_frameworks(id) on delete set null;
alter table public.roadmaps add column if not exists destination_program_id uuid references public.education_programs(id) on delete set null;
alter table public.roadmaps add column if not exists expected_graduation_year integer;
alter table public.roadmaps add column if not exists grade_at_transfer integer;
alter table public.roadmaps add column if not exists status text not null default 'not_started';
alter table public.roadmaps add column if not exists roadmap_type text not null default 'transfer_graduation_plan';
alter table public.roadmaps add column if not exists overall_risk_level text not null default 'gray';
alter table public.roadmaps add column if not exists timeline_urgency text not null default 'unknown';
alter table public.roadmaps add column if not exists planning_horizon text;
alter table public.roadmaps add column if not exists total_items integer not null default 0;
alter table public.roadmaps add column if not exists completed_items integer not null default 0;
alter table public.roadmaps add column if not exists critical_items integer not null default 0;
alter table public.roadmaps add column if not exists high_priority_items integer not null default 0;
alter table public.roadmaps add column if not exists medium_priority_items integer not null default 0;
alter table public.roadmaps add column if not exists low_priority_items integer not null default 0;
alter table public.roadmaps add column if not exists counselor_review_items integer not null default 0;
alter table public.roadmaps add column if not exists summary_text text;
alter table public.roadmaps add column if not exists timeline_summary text;
alter table public.roadmaps add column if not exists student_next_steps_json jsonb not null default '[]'::jsonb;
alter table public.roadmaps add column if not exists counselor_questions_json jsonb not null default '[]'::jsonb;
alter table public.roadmaps add column if not exists assumptions_json jsonb not null default '[]'::jsonb;
alter table public.roadmaps add column if not exists warnings_json jsonb not null default '[]'::jsonb;
alter table public.roadmaps add column if not exists source_snapshot_json jsonb not null default '{}'::jsonb;
alter table public.roadmaps add column if not exists stale_reason text;
alter table public.roadmaps add column if not exists completed_at timestamptz;
alter table public.roadmaps add column if not exists generated_at timestamptz;

alter table public.roadmaps
  drop constraint if exists roadmaps_status_check,
  add constraint roadmaps_status_check
    check (status in ('not_started', 'processing', 'active', 'completed', 'failed', 'needs_review', 'stale')),
  drop constraint if exists roadmaps_type_check,
  add constraint roadmaps_type_check
    check (roadmap_type in ('transfer_graduation_plan', 'counselor_meeting_plan', 'credit_recovery_plan', 'course_selection_plan')),
  drop constraint if exists roadmaps_risk_level_check,
  add constraint roadmaps_risk_level_check
    check (overall_risk_level in ('green', 'yellow', 'red', 'gray')),
  drop constraint if exists roadmaps_timeline_urgency_check,
  add constraint roadmaps_timeline_urgency_check
    check (timeline_urgency in ('low', 'medium', 'high', 'urgent', 'unknown'));

alter table public.roadmap_items add column if not exists student_profile_id uuid references public.student_profiles(id) on delete cascade;
alter table public.roadmap_items add column if not exists gap_requirement_id uuid references public.gap_requirements(id) on delete set null;
alter table public.roadmap_items add column if not exists destination_requirement_id uuid references public.graduation_requirements(id) on delete set null;
alter table public.roadmap_items add column if not exists credit_mapping_id uuid references public.credit_mappings(id) on delete set null;
alter table public.roadmap_items add column if not exists action_type text not null default 'manual_task';
alter table public.roadmap_items add column if not exists timing_bucket text not null default 'unknown';
alter table public.roadmap_items add column if not exists suggested_term text;
alter table public.roadmap_items add column if not exists suggested_grade_level integer;
alter table public.roadmap_items add column if not exists due_window_label text;
alter table public.roadmap_items add column if not exists required_before text;
alter table public.roadmap_items add column if not exists requirement_category text;
alter table public.roadmap_items add column if not exists risk_level text not null default 'gray';
alter table public.roadmap_items add column if not exists counselor_review_required boolean not null default false;
alter table public.roadmap_items add column if not exists counselor_question text;
alter table public.roadmap_items add column if not exists student_instructions text;
alter table public.roadmap_items add column if not exists evidence_note text;
alter table public.roadmap_items add column if not exists completion_note text;
alter table public.roadmap_items add column if not exists display_order integer not null default 0;
alter table public.roadmap_items add column if not exists completed_at timestamptz;

update public.roadmap_items
set display_order = coalesce(nullif(display_order, 0), order_index)
where true;

alter table public.roadmap_items
  drop constraint if exists roadmap_items_action_type_check,
  add constraint roadmap_items_action_type_check
    check (action_type in (
      'counselor_question',
      'course_planning',
      'credit_review',
      'missing_credit',
      'assessment_requirement',
      'local_policy_check',
      'transcript_followup',
      'summer_option',
      'online_option',
      'credit_recovery_option',
      'program_pathway_check',
      'elective_planning',
      'informational',
      'manual_task'
    )),
  drop constraint if exists roadmap_items_priority_check,
  add constraint roadmap_items_priority_check
    check (priority in ('critical', 'high', 'medium', 'low', 'informational')),
  drop constraint if exists roadmap_items_status_check,
  add constraint roadmap_items_status_check
    check (status in ('todo', 'in_progress', 'done', 'blocked', 'skipped', 'needs_counselor', 'waiting_for_school', 'pending', 'completed')),
  drop constraint if exists roadmap_items_timing_bucket_check,
  add constraint roadmap_items_timing_bucket_check
    check (timing_bucket in (
      'immediately',
      'before_course_registration',
      'current_semester',
      'next_semester',
      'summer',
      'senior_year',
      'before_graduation',
      'ongoing',
      'counselor_meeting',
      'unknown'
    )),
  drop constraint if exists roadmap_items_risk_level_check,
  add constraint roadmap_items_risk_level_check
    check (risk_level in ('green', 'yellow', 'red', 'gray'));

create index if not exists roadmaps_user_transcript_idx
  on public.roadmaps(user_id, transcript_id, status, created_at desc);
create index if not exists roadmaps_gap_analysis_idx
  on public.roadmaps(gap_analysis_id, status);
create index if not exists roadmap_items_user_roadmap_idx
  on public.roadmap_items(user_id, roadmap_id, display_order);
create index if not exists roadmap_items_gap_requirement_idx
  on public.roadmap_items(gap_requirement_id);

create or replace function public.mark_roadmaps_stale_for_transcript(
  target_user_id uuid,
  target_transcript_id uuid,
  reason text
)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.roadmaps
  set status = 'stale', stale_reason = reason, updated_at = now()
  where user_id = target_user_id
    and transcript_id = target_transcript_id
    and status in ('active', 'needs_review', 'completed');
$$;

create or replace function public.mark_roadmaps_stale_from_gap()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.mark_roadmaps_stale_for_transcript(new.user_id, new.transcript_id, 'gap analysis changed');
  return new;
end;
$$;

create or replace function public.mark_roadmaps_stale_from_mapping()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.mark_roadmaps_stale_for_transcript(new.user_id, new.transcript_id, 'credit mapping changed');
  return new;
end;
$$;

create or replace function public.mark_roadmaps_stale_from_course()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.mark_roadmaps_stale_for_transcript(new.user_id, new.transcript_id, 'transcript courses changed');
  return new;
end;
$$;

create or replace function public.mark_roadmaps_stale_from_profile()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.roadmaps
  set status = 'stale', stale_reason = 'profile destination or timeline changed', updated_at = now()
  where user_id = new.user_id
    and status in ('active', 'needs_review', 'completed')
    and (
      destination_framework_id is distinct from new.destination_framework_id
      or expected_graduation_year is distinct from new.expected_graduation_year
      or grade_at_transfer is distinct from new.grade_at_transfer
    );
  return new;
end;
$$;

drop trigger if exists gap_analyses_mark_roadmap_stale on public.gap_analyses;
create trigger gap_analyses_mark_roadmap_stale
after insert or update on public.gap_analyses
for each row execute function public.mark_roadmaps_stale_from_gap();

drop trigger if exists credit_mappings_mark_roadmap_stale on public.credit_mappings;
create trigger credit_mappings_mark_roadmap_stale
after insert or update on public.credit_mappings
for each row execute function public.mark_roadmaps_stale_from_mapping();

drop trigger if exists transcript_courses_mark_roadmap_stale on public.transcript_courses;
create trigger transcript_courses_mark_roadmap_stale
after insert or update on public.transcript_courses
for each row execute function public.mark_roadmaps_stale_from_course();

drop trigger if exists student_profiles_mark_roadmap_stale on public.student_profiles;
create trigger student_profiles_mark_roadmap_stale
after update of destination_framework_id, expected_graduation_year, grade_at_transfer on public.student_profiles
for each row execute function public.mark_roadmaps_stale_from_profile();
