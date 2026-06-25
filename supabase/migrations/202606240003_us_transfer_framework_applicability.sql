-- United States transfer-student framework applicability.
-- Additive only: keeps existing framework/profile rows intact while making
-- destination frameworks explicit about transfer-grade and counselor-review scope.

alter table public.destination_graduation_frameworks
  add column if not exists pathway_type text,
  add column if not exists grade_at_transfer_applicability text,
  add column if not exists transfer_student_notes text,
  add column if not exists international_transfer_notes text,
  add column if not exists counselor_review_required boolean not null default true;

create index if not exists destination_frameworks_transfer_applicability_idx
  on public.destination_graduation_frameworks(
    jurisdiction_id,
    graduation_year_start,
    graduation_year_end,
    counselor_review_required
  );
