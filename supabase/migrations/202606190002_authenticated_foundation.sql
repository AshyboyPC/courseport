-- Scholaport authenticated MVP foundation.
-- This migration upgrades the original prototype schema without inserting fake user-owned academic data.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Student profile fields used by authenticated onboarding.
alter table public.student_profiles add column if not exists first_name text;
alter table public.student_profiles add column if not exists last_name text;
alter table public.student_profiles add column if not exists destination_country text;
alter table public.student_profiles add column if not exists grade_at_transfer integer;
alter table public.student_profiles add column if not exists preferred_language text default 'en';
update public.student_profiles sp
set first_name = coalesce(
      sp.first_name,
      nullif(au.raw_user_meta_data ->> 'first_name', ''),
      nullif(split_part(p.display_name, ' ', 1), '')
    ),
    destination_country = coalesce(destination_country, target_country, 'United States'),
    grade_at_transfer = coalesce(grade_at_transfer, grade_level_at_transfer),
    preferred_language = coalesce(sp.preferred_language, p.preferred_language, 'en')
from auth.users au
left join public.profiles p on p.id = au.id
where au.id = sp.user_id;
do $$
begin
  if not exists (select 1 from public.student_profiles where first_name is null) then
    alter table public.student_profiles alter column first_name set not null;
  end if;
end $$;
alter table public.student_profiles alter column destination_country set not null;
alter table public.student_profiles alter column grade_at_transfer set not null;
alter table public.student_profiles alter column preferred_language set not null;
alter table public.student_profiles alter column grade_level_at_transfer drop not null;

-- Transcript metadata and private storage path.
alter table public.transcripts add column if not exists original_filename text;
alter table public.transcripts add column if not exists file_type text;
alter table public.transcripts add column if not exists storage_path text;
alter table public.transcripts add column if not exists storage_error text;
alter table public.transcripts add column if not exists upload_status text not null default 'uploaded_processing';
alter table public.transcript_courses add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.credit_mappings add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.gap_analyses add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.roadmaps add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.transcript_courses tc
set user_id = t.user_id
from public.transcripts t
where tc.transcript_id = t.id and tc.user_id is null;
update public.credit_mappings cm
set user_id = sp.user_id
from public.student_profiles sp
where cm.student_profile_id = sp.id and cm.user_id is null;
update public.gap_analyses ga
set user_id = sp.user_id
from public.student_profiles sp
where ga.student_profile_id = sp.id and ga.user_id is null;
update public.roadmaps r
set user_id = sp.user_id
from public.student_profiles sp
where r.student_profile_id = sp.id and r.user_id is null;

alter table public.transcript_courses alter column user_id set not null;
alter table public.credit_mappings alter column user_id set not null;
alter table public.gap_analyses alter column user_id set not null;
alter table public.roadmaps alter column user_id set not null;

create table if not exists public.gap_requirements (
  id uuid primary key default gen_random_uuid(),
  gap_analysis_id uuid not null references public.gap_analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_category text not null,
  credits_required numeric(5,2) not null,
  credits_mapped numeric(5,2) not null default 0,
  credits_remaining numeric(5,2) not null,
  status text not null default 'missing' check (status in ('satisfied', 'partial', 'missing', 'unclear')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  notes text,
  suggested_actions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  subject_category text,
  credits_needed numeric(4,2),
  semester_target text,
  priority text not null default 'medium',
  completion_method text,
  suggested_courses text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'skipped')),
  order_index integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pathmatch_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  path_id uuid not null references public.pathmatch_paths(id) on delete cascade,
  similarity_score numeric(5,4),
  match_dimensions jsonb not null default '{}',
  is_helpful boolean,
  created_at timestamptz not null default now(),
  unique (student_profile_id, path_id)
);

alter table public.twin_mentors add column if not exists display_name text;
alter table public.twin_mentors add column if not exists target_program text;
alter table public.twin_mentors alter column user_id drop not null;
update public.twin_mentors set display_name = coalesce(display_name, 'Verified mentor');
alter table public.twin_mentors alter column display_name set not null;

alter table public.twin_questions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.twin_questions add column if not exists selected_prompt text;
alter table public.twin_questions add column if not exists anonymous boolean not null default false;
update public.twin_questions set user_id = student_id where user_id is null;
update public.twin_questions set anonymous = is_anonymous where is_anonymous is true;
alter table public.twin_questions alter column student_id drop not null;
alter table public.twin_questions alter column user_id set not null;

create table if not exists public.twin_responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.twin_questions(id) on delete cascade,
  mentor_id uuid references public.twin_mentors(id) on delete set null,
  response_text text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guide_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  category text not null,
  icon_name text,
  reading_time_minutes integer not null default 5,
  order_index integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guide_articles (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.guide_topics(id) on delete cascade,
  language text not null default 'en',
  title text not null,
  content text not null,
  key_takeaways text[] not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, language)
);

alter table public.chat_sessions add column if not exists is_active boolean not null default true;

-- RLS for every user-owned table.
alter table public.gap_requirements enable row level security;
alter table public.roadmap_items enable row level security;
alter table public.pathmatch_matches enable row level security;
alter table public.twin_mentors enable row level security;
alter table public.twin_responses enable row level security;
alter table public.guide_topics enable row level security;
alter table public.guide_articles enable row level security;

drop policy if exists "users manage own gap requirements" on public.gap_requirements;
create policy "users manage own gap requirements" on public.gap_requirements
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own roadmap items" on public.roadmap_items;
create policy "users manage own roadmap items" on public.roadmap_items
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own path matches" on public.pathmatch_matches;
create policy "users manage own path matches" on public.pathmatch_matches
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "verified mentors are readable" on public.twin_mentors;
create policy "verified mentors are readable" on public.twin_mentors
for select using (is_verified = true and is_available = true);

drop policy if exists "users manage own twin questions v2" on public.twin_questions;
create policy "users manage own twin questions v2" on public.twin_questions
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users read approved responses to own questions" on public.twin_responses;
create policy "users read approved responses to own questions" on public.twin_responses
for select using (
  is_approved = true and exists (
    select 1 from public.twin_questions q where q.id = question_id and q.user_id = auth.uid()
  )
);

drop policy if exists "published guide topics are readable" on public.guide_topics;
create policy "published guide topics are readable" on public.guide_topics
for select using (is_published = true);

drop policy if exists "published guide articles are readable" on public.guide_articles;
create policy "published guide articles are readable" on public.guide_articles
for select using (is_published = true);

-- Tighten user-owned access with explicit user_id policies used by the client.
drop policy if exists "users manage own transcript courses v2" on public.transcript_courses;
create policy "users manage own transcript courses v2" on public.transcript_courses
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own mappings v2" on public.credit_mappings;
create policy "users manage own mappings v2" on public.credit_mappings
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own analyses v2" on public.gap_analyses;
create policy "users manage own analyses v2" on public.gap_analyses
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage own roadmaps v2" on public.roadmaps;
create policy "users manage own roadmaps v2" on public.roadmaps
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Keep updated_at accurate.
drop trigger if exists student_profiles_updated_at on public.student_profiles;
create trigger student_profiles_updated_at before update on public.student_profiles
for each row execute function public.set_updated_at();
drop trigger if exists transcripts_updated_at on public.transcripts;
create trigger transcripts_updated_at before update on public.transcripts
for each row execute function public.set_updated_at();
drop trigger if exists roadmap_items_updated_at on public.roadmap_items;
create trigger roadmap_items_updated_at before update on public.roadmap_items
for each row execute function public.set_updated_at();
drop trigger if exists guide_topics_updated_at on public.guide_topics;
create trigger guide_topics_updated_at before update on public.guide_topics
for each row execute function public.set_updated_at();
drop trigger if exists guide_articles_updated_at on public.guide_articles;
create trigger guide_articles_updated_at before update on public.guide_articles
for each row execute function public.set_updated_at();

-- Private transcript storage. Users can only access the folder named with their auth UID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'transcripts',
  'transcripts',
  false,
  52428800,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users upload own transcripts" on storage.objects;
create policy "users upload own transcripts" on storage.objects
for insert to authenticated
with check (bucket_id = 'transcripts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users read own transcripts" on storage.objects;
create policy "users read own transcripts" on storage.objects
for select to authenticated
using (bucket_id = 'transcripts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users update own transcripts" on storage.objects;
create policy "users update own transcripts" on storage.objects
for update to authenticated
using (bucket_id = 'transcripts' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'transcripts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users delete own transcripts" on storage.objects;
create policy "users delete own transcripts" on storage.objects
for delete to authenticated
using (bucket_id = 'transcripts' and (storage.foldername(name))[1] = auth.uid()::text);

-- Georgia reference requirements from the Scholaport technical specification.
insert into public.us_states (name, abbreviation, total_credits_required, state_testing_name, notes)
values ('Georgia', 'GA', 23, 'Georgia Milestones', 'State minimum; district and school requirements may add requirements.')
on conflict (abbreviation) do update set
  total_credits_required = excluded.total_credits_required,
  state_testing_name = excluded.state_testing_name,
  notes = excluded.notes;

insert into public.state_requirements (id, state_id, subject_category, credits_required, specific_courses, notes, effective_year)
select values_data.id, s.id, values_data.subject_category, values_data.credits_required, values_data.specific_courses, values_data.notes, 2026
from public.us_states s
cross join (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'English / Language Arts', 4.0::numeric, array['English 9', 'English 10', 'English 11', 'English 12']::text[], 'Confirm local course-sequence requirements.'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'Mathematics', 4.0::numeric, array[]::text[], 'Includes required mathematics sequence.'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'Science', 4.0::numeric, array[]::text[], 'Includes laboratory science requirements.'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'Social Studies', 3.0::numeric, array['United States History', 'World History', 'American Government', 'Economics']::text[], 'Specific course requirements must be confirmed by the receiving school.'),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'Health / Physical Education', 1.0::numeric, array[]::text[], 'Health and physical education requirement.'),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'CTE / World Language / Fine Arts', 3.0::numeric, array[]::text[], 'Pathway requirement.'),
  ('10000000-0000-4000-8000-000000000007'::uuid, 'Electives', 4.0::numeric, array[]::text[], 'Credits completing the 23-credit state minimum.')
) as values_data(id, subject_category, credits_required, specific_courses, notes)
where s.abbreviation = 'GA'
on conflict (id) do update set
  credits_required = excluded.credits_required,
  specific_courses = excluded.specific_courses,
  notes = excluded.notes,
  effective_year = excluded.effective_year;

-- PathMatch and mentor tables intentionally remain empty until verified records are supplied.
-- The application never presents invented students or mentors as real people.

insert into public.guide_topics (id, slug, title, description, category, icon_name, reading_time_minutes, order_index, is_published)
values
  ('40000000-0000-4000-8000-000000000001', 'credits', 'Credits, decoded', 'How a U.S. credit works and why one class can count differently.', 'Academic', 'Stamp', 5, 1, true),
  ('40000000-0000-4000-8000-000000000002', 'gpa', 'GPA without the mystery', 'Weighted, unweighted, class rank, and what actually matters.', 'Academic', 'Chart', 6, 2, true),
  ('40000000-0000-4000-8000-000000000003', 'counselor', 'Your counselor is an ally', 'What to ask, what to bring, and how to follow up.', 'Getting settled', 'People', 4, 3, true),
  ('40000000-0000-4000-8000-000000000004', 'ap-ib', 'AP, IB, Honors, Regular', 'Choose challenge without compressing your graduation plan.', 'Planning', 'Book', 7, 4, true),
  ('40000000-0000-4000-8000-000000000005', 'school-day', 'The American school day', 'Schedules, attendance, assignments, and teacher expectations.', 'Culture', 'Calendar', 5, 5, true),
  ('40000000-0000-4000-8000-000000000006', 'college', 'College starts here', 'A calm first look at activities, testing, and applications.', 'College prep', 'Flag', 8, 6, true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  reading_time_minutes = excluded.reading_time_minutes,
  is_published = excluded.is_published;

insert into public.guide_articles (id, topic_id, language, title, content, key_takeaways, is_published)
select gen_random_uuid(), t.id, 'en', t.title,
  case t.slug
    when 'credits' then 'A full-year U.S. high-school class is often worth 1.0 credit and a semester class 0.5 credit, but district rules vary. Transfer evaluation can consider content, duration, assessment, and local graduation rules—not only the translated title.'
    when 'gpa' then 'An unweighted GPA commonly uses a 4.0 scale. Weighted GPA may add points for advanced classes. Receiving schools decide whether and how international grades appear in GPA and class-rank calculations.'
    when 'counselor' then 'Bring original documents, translations, course syllabi, and a concise list of questions. Ask the counselor to distinguish confirmed credit decisions from items still under review.'
    when 'ap-ib' then 'Advanced programs can add rigor, but transfer timing matters. Check prerequisites and required graduation courses before committing to a compressed AP or IB schedule.'
    when 'school-day' then 'Schedules, attendance rules, assignment systems, and teacher communication vary by school. Ask where assignments are posted and how students request academic help.'
    else 'College planning can begin with consistent coursework, activities that matter to you, and understanding the application timeline at your school.'
  end,
  array['School and district rules can differ.', 'Confirm official decisions with the receiving school counselor.'],
  true
from public.guide_topics t
where t.id in (
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000003',
  '40000000-0000-4000-8000-000000000004',
  '40000000-0000-4000-8000-000000000005',
  '40000000-0000-4000-8000-000000000006'
)
on conflict (topic_id, language) do update set
  title = excluded.title,
  content = excluded.content,
  key_takeaways = excluded.key_takeaways,
  is_published = excluded.is_published;
