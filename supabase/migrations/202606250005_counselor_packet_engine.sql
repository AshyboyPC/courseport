-- Scholaport counselor-ready packet engine.
-- Packets are assembled from saved profile/transcript/mapping/gap/roadmap rows only.

alter table public.counselor_packets alter column status drop default;
alter table public.counselor_packets
  alter column status type text using
    case status::text
      when 'pending' then 'not_started'
      when 'processing' then 'processing'
      when 'completed' then 'ready'
      when 'error' then 'failed'
      else status::text
    end;
alter table public.counselor_packets alter column status set default 'not_started';

alter table public.counselor_packets add column if not exists credit_mapping_run_id uuid references public.credit_mapping_runs(id) on delete set null;
alter table public.counselor_packets add column if not exists gap_analysis_id uuid references public.gap_analyses(id) on delete set null;
alter table public.counselor_packets add column if not exists roadmap_id uuid references public.roadmaps(id) on delete set null;
alter table public.counselor_packets add column if not exists destination_country_id uuid references public.countries(id) on delete set null;
alter table public.counselor_packets add column if not exists destination_jurisdiction_id uuid references public.jurisdictions(id) on delete set null;
alter table public.counselor_packets add column if not exists destination_framework_id uuid references public.destination_graduation_frameworks(id) on delete set null;
alter table public.counselor_packets add column if not exists packet_type text not null default 'counselor_review_packet';
alter table public.counselor_packets add column if not exists packet_version text not null default '2026.06.mvp';
alter table public.counselor_packets add column if not exists title text;
alter table public.counselor_packets add column if not exists summary_text text;
alter table public.counselor_packets add column if not exists disclaimer_text text;
alter table public.counselor_packets add column if not exists packet_snapshot_json jsonb not null default '{}'::jsonb;
alter table public.counselor_packets add column if not exists included_sections_json jsonb not null default '[]'::jsonb;
alter table public.counselor_packets add column if not exists missing_sections_json jsonb not null default '[]'::jsonb;
alter table public.counselor_packets add column if not exists warnings_json jsonb not null default '[]'::jsonb;
alter table public.counselor_packets add column if not exists counselor_questions_json jsonb not null default '[]'::jsonb;
alter table public.counselor_packets add column if not exists source_summary_json jsonb not null default '[]'::jsonb;
alter table public.counselor_packets add column if not exists generated_file_storage_path text;
alter table public.counselor_packets add column if not exists generated_file_mime_type text;
alter table public.counselor_packets add column if not exists generated_file_size_bytes bigint;
alter table public.counselor_packets add column if not exists generated_file_hash text;
alter table public.counselor_packets add column if not exists printable_html_storage_path text;
alter table public.counselor_packets add column if not exists pdf_generation_error text;
alter table public.counselor_packets add column if not exists stale_reason text;
alter table public.counselor_packets add column if not exists updated_at timestamptz not null default now();
alter table public.counselor_packets add column if not exists completed_at timestamptz;

alter table public.counselor_packets
  drop constraint if exists counselor_packets_status_check,
  add constraint counselor_packets_status_check
    check (status in ('not_started', 'processing', 'ready', 'failed', 'needs_review', 'stale', 'html_ready', 'pdf_ready')),
  drop constraint if exists counselor_packets_type_check,
  add constraint counselor_packets_type_check
    check (packet_type in ('counselor_review_packet', 'transfer_credit_preview', 'graduation_planning_packet'));

create table if not exists public.counselor_packet_sections (
  id uuid primary key default gen_random_uuid(),
  packet_id uuid not null references public.counselor_packets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  section_key text not null,
  section_title text not null,
  section_order integer not null default 0,
  section_status text not null default 'included',
  section_snapshot_json jsonb not null default '{}'::jsonb,
  missing_reason text,
  warnings_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint counselor_packet_sections_status_check
    check (section_status in ('included', 'missing_data', 'needs_review', 'not_applicable'))
);

alter table public.counselor_packet_sections enable row level security;
drop policy if exists "users manage own packet sections" on public.counselor_packet_sections;
create policy "users manage own packet sections" on public.counselor_packet_sections
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists counselor_packets_user_transcript_idx
  on public.counselor_packets(user_id, transcript_id, status, created_at desc);
create index if not exists counselor_packets_gap_roadmap_idx
  on public.counselor_packets(gap_analysis_id, roadmap_id);
create index if not exists counselor_packet_sections_packet_idx
  on public.counselor_packet_sections(packet_id, section_order);

create or replace function public.mark_packets_stale_for_transcript(
  target_user_id uuid,
  target_transcript_id uuid,
  reason text
)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.counselor_packets
  set status = 'stale', stale_reason = reason, updated_at = now()
  where user_id = target_user_id
    and transcript_id = target_transcript_id
    and status in ('ready', 'needs_review', 'html_ready', 'pdf_ready');
$$;

create or replace function public.mark_packets_stale_from_transcript()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.mark_packets_stale_for_transcript(new.user_id, new.id, 'transcript metadata changed');
  return new;
end;
$$;

create or replace function public.mark_packets_stale_from_course()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.mark_packets_stale_for_transcript(new.user_id, new.transcript_id, 'transcript courses changed');
  return new;
end;
$$;

create or replace function public.mark_packets_stale_from_mapping()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.mark_packets_stale_for_transcript(new.user_id, new.transcript_id, 'credit mapping changed');
  return new;
end;
$$;

create or replace function public.mark_packets_stale_from_gap()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.mark_packets_stale_for_transcript(new.user_id, new.transcript_id, 'gap analysis changed');
  return new;
end;
$$;

create or replace function public.mark_packets_stale_from_roadmap()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.mark_packets_stale_for_transcript(new.user_id, new.transcript_id, 'roadmap changed');
  return new;
end;
$$;

create or replace function public.mark_packets_stale_from_profile()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.counselor_packets
  set status = 'stale', stale_reason = 'profile destination or timeline changed', updated_at = now()
  where user_id = new.user_id
    and status in ('ready', 'needs_review', 'html_ready', 'pdf_ready')
    and (
      destination_framework_id is distinct from new.destination_framework_id
      or destination_jurisdiction_id is distinct from new.destination_jurisdiction_id
      or destination_country_id is distinct from new.destination_country_id
      or (packet_snapshot_json->'profile'->>'expected_graduation_year') is distinct from coalesce(new.expected_graduation_year::text, '')
      or (packet_snapshot_json->'profile'->>'grade_at_transfer') is distinct from coalesce(new.grade_at_transfer::text, '')
    );
  return new;
end;
$$;

drop trigger if exists transcripts_mark_packet_stale on public.transcripts;
create trigger transcripts_mark_packet_stale
after update on public.transcripts
for each row execute function public.mark_packets_stale_from_transcript();

drop trigger if exists transcript_courses_mark_packet_stale on public.transcript_courses;
create trigger transcript_courses_mark_packet_stale
after insert or update on public.transcript_courses
for each row execute function public.mark_packets_stale_from_course();

drop trigger if exists credit_mappings_mark_packet_stale on public.credit_mappings;
create trigger credit_mappings_mark_packet_stale
after insert or update on public.credit_mappings
for each row execute function public.mark_packets_stale_from_mapping();

drop trigger if exists gap_analyses_mark_packet_stale on public.gap_analyses;
create trigger gap_analyses_mark_packet_stale
after insert or update on public.gap_analyses
for each row execute function public.mark_packets_stale_from_gap();

drop trigger if exists roadmaps_mark_packet_stale on public.roadmaps;
create trigger roadmaps_mark_packet_stale
after insert or update on public.roadmaps
for each row execute function public.mark_packets_stale_from_roadmap();

drop trigger if exists student_profiles_mark_packet_stale on public.student_profiles;
create trigger student_profiles_mark_packet_stale
after update of destination_country_id, destination_jurisdiction_id, destination_framework_id, expected_graduation_year, grade_at_transfer on public.student_profiles
for each row execute function public.mark_packets_stale_from_profile();
