alter table public.student_profiles
  add column if not exists source_jurisdiction_id uuid references public.jurisdictions(id) on delete set null,
  add column if not exists source_jurisdiction_label text;

create index if not exists student_profiles_source_jurisdiction_idx
  on public.student_profiles(source_jurisdiction_id);

create or replace function public.clear_incompatible_student_source_references()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  selected_jurisdiction_country uuid;
  selected_curriculum record;
begin
  if new.source_jurisdiction_id is not null then
    select country_id into selected_jurisdiction_country
    from public.jurisdictions where id = new.source_jurisdiction_id;

    if selected_jurisdiction_country is distinct from new.source_country_id then
      new.source_jurisdiction_id := null;
      new.source_jurisdiction_label := null;
      new.source_curriculum_id := null;
    end if;
  end if;

  if new.source_curriculum_id is not null then
    select country_id, jurisdiction_id into selected_curriculum
    from public.curricula where id = new.source_curriculum_id;

    if selected_curriculum.country_id is distinct from new.source_country_id
      or (
        selected_curriculum.jurisdiction_id is not null
        and selected_curriculum.jurisdiction_id is distinct from new.source_jurisdiction_id
      ) then
      new.source_curriculum_id := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists student_profiles_clear_incompatible_source on public.student_profiles;
create trigger student_profiles_clear_incompatible_source
before insert or update of source_country_id, source_jurisdiction_id, source_curriculum_id
on public.student_profiles
for each row execute function public.clear_incompatible_student_source_references();
