-- Scholaport probable credit mapping engine.
-- Additive only: mappings remain counselor-ready candidates, not official decisions.

alter table public.credit_mappings add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.credit_mappings add column if not exists transcript_id uuid references public.transcripts(id) on delete cascade;
alter table public.credit_mappings add column if not exists source_country_id uuid references public.countries(id) on delete set null;
alter table public.credit_mappings add column if not exists source_jurisdiction_id uuid references public.jurisdictions(id) on delete set null;
alter table public.credit_mappings add column if not exists source_curriculum_id uuid references public.curricula(id) on delete set null;
alter table public.credit_mappings add column if not exists destination_country_id uuid references public.countries(id) on delete set null;
alter table public.credit_mappings add column if not exists destination_jurisdiction_id uuid references public.jurisdictions(id) on delete set null;
alter table public.credit_mappings add column if not exists destination_framework_id uuid references public.destination_graduation_frameworks(id) on delete set null;
alter table public.credit_mappings add column if not exists destination_requirement_id uuid references public.graduation_requirements(id) on delete set null;
alter table public.credit_mappings add column if not exists original_course_name text;
alter table public.credit_mappings add column if not exists translated_course_name text;
alter table public.credit_mappings add column if not exists normalized_course_name text;
alter table public.credit_mappings add column if not exists source_subject_category text;
alter table public.credit_mappings add column if not exists mapped_subject_category text;
alter table public.credit_mappings add column if not exists probable_destination_equivalent text;
alter table public.credit_mappings add column if not exists requirement_bucket text;
alter table public.credit_mappings add column if not exists possible_credit_value numeric(7,2);
alter table public.credit_mappings add column if not exists credit_unit text;
alter table public.credit_mappings add column if not exists mapping_confidence text;
alter table public.credit_mappings add column if not exists mapping_method text;
alter table public.credit_mappings add column if not exists mapping_status text not null default 'candidate';
alter table public.credit_mappings add column if not exists counselor_review_required boolean not null default true;
alter table public.credit_mappings add column if not exists review_reason text;
alter table public.credit_mappings add column if not exists evidence_summary text;
alter table public.credit_mappings add column if not exists student_note text;
alter table public.credit_mappings add column if not exists counselor_note text;
alter table public.credit_mappings add column if not exists source_evidence_json jsonb not null default '{}'::jsonb;
alter table public.credit_mappings add column if not exists ai_model text;
alter table public.credit_mappings add column if not exists ai_response_json jsonb;
alter table public.credit_mappings add column if not exists confirmed_at timestamptz;

update public.credit_mappings
set
  mapped_subject_category = coalesce(mapped_subject_category, target_subject_category),
  probable_destination_equivalent = coalesce(probable_destination_equivalent, probable_us_equivalent),
  possible_credit_value = coalesce(possible_credit_value, credits_mapped),
  mapping_confidence = coalesce(mapping_confidence, confidence::text),
  mapping_status = case
    when mapping_status is not null then mapping_status
    when status = 'confirmed' then 'student_confirmed'
    else 'candidate'
  end,
  counselor_review_required = coalesce(counselor_review_required, needs_counselor_review),
  evidence_summary = coalesce(evidence_summary, mapping_reason),
  counselor_note = coalesce(counselor_note, counselor_notes)
where true;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'credit_mappings_confidence_check') then
    alter table public.credit_mappings add constraint credit_mappings_confidence_check
      check (mapping_confidence in ('high', 'medium', 'low', 'unclear'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'credit_mappings_method_check') then
    alter table public.credit_mappings add constraint credit_mappings_method_check
      check (mapping_method in ('verified_rule', 'exact_reference_match', 'deterministic_taxonomy', 'vector_similarity', 'structured_ai', 'manual_student', 'counselor_review'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'credit_mappings_status_check') then
    alter table public.credit_mappings add constraint credit_mappings_status_check
      check (mapping_status in ('candidate', 'student_confirmed', 'counselor_review_required', 'counselor_confirmed', 'rejected', 'replaced'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'credit_mappings_credit_unit_check') then
    alter table public.credit_mappings add constraint credit_mappings_credit_unit_check
      check (credit_unit is null or credit_unit in ('credit', 'unit', 'carnegie_unit', 'local_unit', 'unknown'));
  end if;
end $$;

create table if not exists public.credit_mapping_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  destination_framework_id uuid references public.destination_graduation_frameworks(id) on delete set null,
  status text not null default 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  provider_used text,
  total_courses integer not null default 0,
  high_confidence_count integer not null default 0,
  medium_confidence_count integer not null default 0,
  low_confidence_count integer not null default 0,
  unclear_count integer not null default 0,
  counselor_review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_mapping_runs_status_check
    check (status in ('queued', 'processing', 'completed', 'failed', 'needs_review'))
);

create table if not exists public.reference_embeddings (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  text_content text not null,
  embedding vector(1536),
  embedding_model text not null,
  content_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (table_name, record_id, embedding_model, content_hash)
);

create index if not exists credit_mappings_user_transcript_idx
  on public.credit_mappings(user_id, transcript_id, mapping_status);
create index if not exists credit_mappings_course_idx
  on public.credit_mappings(transcript_course_id);
create index if not exists credit_mapping_runs_user_transcript_idx
  on public.credit_mapping_runs(user_id, transcript_id, created_at desc);
create index if not exists reference_embeddings_record_idx
  on public.reference_embeddings(table_name, record_id);

alter table public.credit_mapping_runs enable row level security;
alter table public.reference_embeddings enable row level security;

drop policy if exists "users manage own mapping runs" on public.credit_mapping_runs;
create policy "users manage own mapping runs" on public.credit_mapping_runs
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "public reads reference embeddings" on public.reference_embeddings;
create policy "public reads reference embeddings" on public.reference_embeddings
for select using (true);
