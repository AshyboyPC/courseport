create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.user_role as enum ('student', 'mentor', 'admin');
create type public.processing_status as enum ('pending', 'processing', 'completed', 'error');
create type public.confidence_level as enum ('high', 'medium', 'low', 'unclear');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  display_name text,
  avatar_url text,
  preferred_language text not null default 'en',
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  origin_country text not null,
  source_curriculum text not null,
  grade_level_at_transfer integer not null check (grade_level_at_transfer between 9 and 12),
  target_country text not null default 'United States',
  target_state text not null,
  target_district text,
  target_school text,
  target_program text,
  expected_graduation_year integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  school_name text,
  school_country text,
  academic_year_start integer,
  academic_year_end integer,
  grade_level integer,
  total_credits_earned numeric(5,2),
  overall_gpa numeric(4,2),
  grading_scale_type text,
  original_language text not null default 'en',
  status public.processing_status not null default 'pending',
  file_urls text[] not null default '{}',
  ocr_provider text,
  ocr_raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transcript_courses (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  course_name_original text not null,
  course_name_translated text,
  course_description text,
  subject_category text,
  credits numeric(4,2) not null default 1,
  grade_original text,
  grade_normalized numeric(5,2),
  grade_level integer,
  academic_year integer,
  semester text,
  mapping_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_mappings (
  id uuid primary key default gen_random_uuid(),
  transcript_course_id uuid not null references public.transcript_courses(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  target_subject_category text not null,
  probable_us_equivalent text,
  credits_mapped numeric(4,2),
  confidence public.confidence_level not null,
  mapping_reason text,
  needs_counselor_review boolean not null default false,
  counselor_notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.us_states (
  id smallserial primary key,
  name text not null unique,
  abbreviation char(2) not null unique,
  total_credits_required numeric(5,2) not null,
  state_testing_name text,
  notes text,
  updated_at timestamptz not null default now()
);

create table public.state_requirements (
  id uuid primary key default gen_random_uuid(),
  state_id smallint not null references public.us_states(id) on delete cascade,
  subject_category text not null,
  credits_required numeric(5,2) not null,
  specific_courses text[] not null default '{}',
  notes text,
  effective_year integer
);

create table public.gap_analyses (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  state_id smallint not null references public.us_states(id),
  total_credits_required numeric(5,2) not null,
  total_credits_mapped numeric(5,2) not null default 0,
  overall_status text not null default 'at_risk',
  analysis_summary text,
  requirements jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  gap_analysis_id uuid not null references public.gap_analyses(id) on delete cascade,
  title text not null default 'Your Academic Roadmap',
  estimated_graduation_date date,
  is_on_track boolean not null default true,
  items jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pathmatch_paths (
  id uuid primary key default gen_random_uuid(),
  origin_country text not null,
  source_curriculum text not null,
  grade_at_transfer integer,
  target_state text not null,
  target_program text,
  credits_transferred jsonb not null default '{}',
  credits_not_transferred jsonb not null default '{}',
  biggest_challenges text[] not null default '{}',
  advice_for_future text,
  graduated_on_time boolean,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.twin_mentors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  origin_country text not null,
  source_curriculum text not null,
  target_state text not null,
  topics_of_expertise text[] not null default '{}',
  is_verified boolean not null default false,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.twin_questions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  mentor_id uuid references public.twin_mentors(id),
  question_text text not null,
  topic text,
  is_anonymous boolean not null default false,
  status text not null default 'pending',
  moderated_at timestamptz,
  response_text text,
  created_at timestamptz not null default now()
);

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  context jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  sources jsonb not null default '[]',
  confidence public.confidence_level,
  model_used text,
  created_at timestamptz not null default now()
);

create table public.counselor_packets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  file_url text,
  status public.processing_status not null default 'pending',
  included_sections jsonb not null default '[]',
  generated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.transcripts enable row level security;
alter table public.transcript_courses enable row level security;
alter table public.credit_mappings enable row level security;
alter table public.gap_analyses enable row level security;
alter table public.roadmaps enable row level security;
alter table public.twin_questions enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.counselor_packets enable row level security;

create policy "profiles own row" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "students own profile" on public.student_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "students own transcripts" on public.transcripts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "students own courses" on public.transcript_courses for all using (exists (select 1 from public.transcripts t where t.id = transcript_id and t.user_id = auth.uid()));
create policy "students own mappings" on public.credit_mappings for all using (exists (select 1 from public.student_profiles s where s.id = student_profile_id and s.user_id = auth.uid()));
create policy "students own analyses" on public.gap_analyses for all using (exists (select 1 from public.student_profiles s where s.id = student_profile_id and s.user_id = auth.uid()));
create policy "students own roadmaps" on public.roadmaps for all using (exists (select 1 from public.student_profiles s where s.id = student_profile_id and s.user_id = auth.uid()));
create policy "students own questions" on public.twin_questions for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "students own chats" on public.chat_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "students own chat messages" on public.chat_messages for all using (exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "students own packets" on public.counselor_packets for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.us_states enable row level security;
alter table public.state_requirements enable row level security;
alter table public.pathmatch_paths enable row level security;
create policy "public states" on public.us_states for select using (true);
create policy "public requirements" on public.state_requirements for select using (true);
create policy "verified paths" on public.pathmatch_paths for select using (is_verified = true);

insert into public.us_states (name, abbreviation, total_credits_required, state_testing_name, notes)
values ('Georgia', 'GA', 23, 'Georgia Milestones', 'District and school requirements may exceed the state minimum.')
on conflict (abbreviation) do nothing;
