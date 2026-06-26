-- Transcript AI extraction and staged processing diagnostics.
-- Additive follow-up that is safe even when only part of the transcript OCR migration exists.

alter table public.transcripts add column if not exists ocr_status text not null default 'not_started';
alter table public.transcripts add column if not exists ocr_provider text;
alter table public.transcripts add column if not exists ocr_started_at timestamptz;
alter table public.transcripts add column if not exists ocr_completed_at timestamptz;
alter table public.transcripts add column if not exists ocr_error text;
alter table public.transcripts add column if not exists ocr_error_code text;
alter table public.transcripts add column if not exists ocr_error_message text;
alter table public.transcripts add column if not exists ocr_error_stage text;
alter table public.transcripts add column if not exists ocr_raw_text text;
alter table public.transcripts add column if not exists ocr_raw_json jsonb;
alter table public.transcripts add column if not exists ocr_confidence numeric(5,4);
alter table public.transcripts add column if not exists ocr_page_count integer;
alter table public.transcripts add column if not exists ocr_language_codes text[] not null default '{}';
alter table public.transcripts add column if not exists primary_language_code text;
alter table public.transcripts add column if not exists translation_status text not null default 'not_needed';
alter table public.transcripts add column if not exists translation_provider text;
alter table public.transcripts add column if not exists translation_started_at timestamptz;
alter table public.transcripts add column if not exists translation_completed_at timestamptz;
alter table public.transcripts add column if not exists translation_error text;
alter table public.transcripts add column if not exists translated_text_en text;
alter table public.transcripts add column if not exists translation_confidence numeric(5,4);
alter table public.transcripts add column if not exists uploaded_file_path text;
alter table public.transcripts add column if not exists uploaded_file_name text;
alter table public.transcripts add column if not exists uploaded_file_mime_type text;
alter table public.transcripts add column if not exists uploaded_file_size_bytes bigint;
alter table public.transcripts add column if not exists processing_status text not null default 'not_started';
alter table public.transcripts add column if not exists processing_stage text;
alter table public.transcripts add column if not exists processing_error_code text;
alter table public.transcripts add column if not exists processing_error_message text;
alter table public.transcripts add column if not exists processing_started_at timestamptz;
alter table public.transcripts add column if not exists processing_completed_at timestamptz;
alter table public.transcripts add column if not exists requires_manual_entry boolean not null default false;
alter table public.transcripts add column if not exists ai_extraction_status text not null default 'not_started';
alter table public.transcripts add column if not exists ai_extraction_provider text;
alter table public.transcripts add column if not exists ai_extraction_model text;
alter table public.transcripts add column if not exists ai_extraction_error text;
alter table public.transcripts add column if not exists ai_extraction_error_code text;
alter table public.transcripts add column if not exists ai_extraction_error_message text;
alter table public.transcripts add column if not exists ai_extraction_raw_json jsonb;
alter table public.transcripts add column if not exists detected_language_codes text[] not null default '{}';
alter table public.transcripts add column if not exists detected_source_country_id uuid references public.countries(id) on delete set null;
alter table public.transcripts add column if not exists detected_source_jurisdiction_id uuid references public.jurisdictions(id) on delete set null;
alter table public.transcripts add column if not exists detected_source_curriculum_id uuid references public.curricula(id) on delete set null;
alter table public.transcripts add column if not exists detected_source_country text;
alter table public.transcripts add column if not exists detected_source_jurisdiction text;
alter table public.transcripts add column if not exists detected_source_curriculum text;
alter table public.transcripts add column if not exists detected_document_type text;
alter table public.transcripts add column if not exists profile_match_status text not null default 'not_checked';
alter table public.transcripts add column if not exists profile_match_confidence numeric(5,4);
alter table public.transcripts add column if not exists requires_source_confirmation boolean not null default false;
alter table public.transcripts add column if not exists selected_source_country_id uuid references public.countries(id) on delete set null;
alter table public.transcripts add column if not exists selected_source_jurisdiction_id uuid references public.jurisdictions(id) on delete set null;
alter table public.transcripts add column if not exists selected_source_curriculum_id uuid references public.curricula(id) on delete set null;
alter table public.transcripts add column if not exists source_selection_method text not null default 'profile_default';
alter table public.transcripts add column if not exists framework_match_status text not null default 'not_detected';
alter table public.transcripts add column if not exists framework_match_confidence numeric(5,4);
alter table public.transcripts add column if not exists requires_user_confirmation boolean not null default true;
alter table public.transcripts add column if not exists confirmed_at timestamptz;
alter table public.transcripts add column if not exists confirmation_status text not null default 'not_started';

alter table public.transcripts
  drop constraint if exists transcripts_ocr_error_stage_check;
alter table public.transcripts
  add constraint transcripts_ocr_error_stage_check
  check (
    ocr_error_stage is null
    or ocr_error_stage in (
      'config_validation',
      'storage_download',
      'mime_detection',
      'google_request',
      'google_response',
      'ocr_empty_response',
      'ai_extraction',
      'translation',
      'parser',
      'candidate_save'
    )
  );

alter table public.transcripts
  drop constraint if exists transcripts_processing_stage_check;
alter table public.transcripts
  add constraint transcripts_processing_stage_check
  check (
    processing_stage is null
    or processing_stage in (
      'upload_started',
      'upload_saved',
      'transcript_row_created',
      'file_retrieved',
      'file_validation_failed',
      'google_config_validation_failed',
      'google_ocr_started',
      'google_ocr_failed',
      'google_ocr_completed',
      'translation_started',
      'translation_failed',
      'ai_extraction_started',
      'ai_extraction_failed',
      'ai_extraction_completed',
      'parse_validation_failed',
      'review_ready',
      'manual_entry_required',
      'confirmed'
    )
  );

alter table public.transcripts
  drop constraint if exists transcripts_ai_extraction_status_check;
alter table public.transcripts
  add constraint transcripts_ai_extraction_status_check
  check (ai_extraction_status in ('not_started','processing','succeeded','failed','needs_review','manual_entry','skipped'));

alter table public.transcripts
  drop constraint if exists transcripts_profile_match_status_check;
alter table public.transcripts
  add constraint transcripts_profile_match_status_check
  check (profile_match_status in ('matches_profile','possible_match','mismatch','unknown','not_checked'));

alter table public.transcript_courses add column if not exists course_name_normalized text;
alter table public.transcript_courses add column if not exists original_language_code text;
alter table public.transcript_courses add column if not exists translated_language_code text;
alter table public.transcript_courses add column if not exists grade_scale_original text;
alter table public.transcript_courses add column if not exists max_marks text;
alter table public.transcript_courses add column if not exists credits_or_units text;
alter table public.transcript_courses add column if not exists term_label_original text;
alter table public.transcript_courses add column if not exists term_label_translated text;
alter table public.transcript_courses add column if not exists academic_year_label text;
alter table public.transcript_courses add column if not exists page_number integer;
alter table public.transcript_courses add column if not exists source_text text;
alter table public.transcript_courses add column if not exists translated_source_text text;
alter table public.transcript_courses add column if not exists bounding_box_json jsonb;
alter table public.transcript_courses add column if not exists extraction_confidence numeric(5,4);
alter table public.transcript_courses add column if not exists translation_confidence numeric(5,4);
alter table public.transcript_courses add column if not exists entry_method text not null default 'manual_entry';
alter table public.transcript_courses add column if not exists student_confirmed boolean not null default false;
alter table public.transcript_courses add column if not exists needs_review boolean not null default true;
alter table public.transcript_courses add column if not exists review_reason text;

alter table public.transcript_courses
  drop constraint if exists transcript_courses_entry_method_check;
alter table public.transcript_courses
  add constraint transcript_courses_entry_method_check
  check (entry_method in ('ocr_extracted','ocr_translated','student_edited','manual_entry','profile_template','counselor_added'));

create table if not exists public.transcript_course_candidates (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_name_original text not null,
  course_name_translated text,
  course_name_normalized text,
  original_language_code text,
  translated_language_code text,
  subject_category text,
  grade_original text,
  grade_normalized numeric(7,3),
  grade_scale_original text,
  max_marks text,
  credits_or_units text,
  term_label_original text,
  term_label_translated text,
  academic_year text,
  grade_level integer,
  page_number integer,
  source_text text,
  translated_source_text text,
  bounding_box_json jsonb,
  extraction_confidence numeric(5,4),
  translation_confidence numeric(5,4),
  entry_method text not null default 'ocr_extracted',
  student_confirmed boolean not null default false,
  needs_review boolean not null default true,
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transcript_course_candidates_entry_method_check
    check (entry_method in ('ocr_extracted','ocr_translated','student_edited','manual_entry','profile_template','counselor_added'))
);

alter table public.transcript_course_candidates enable row level security;

drop policy if exists "users manage own transcript candidates" on public.transcript_course_candidates;
create policy "users manage own transcript candidates" on public.transcript_course_candidates
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists transcript_candidates_transcript_idx
  on public.transcript_course_candidates(transcript_id);
create index if not exists transcript_candidates_user_idx
  on public.transcript_course_candidates(user_id);
create index if not exists transcripts_ocr_status_idx
  on public.transcripts(user_id, ocr_status, confirmation_status);

drop trigger if exists transcript_course_candidates_updated_at on public.transcript_course_candidates;
create trigger transcript_course_candidates_updated_at before update on public.transcript_course_candidates
for each row execute function public.set_updated_at();
