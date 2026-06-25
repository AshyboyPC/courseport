-- United States jurisdiction correction.
-- Additive/safe: expands the existing jurisdiction type check so the
-- District of Columbia does not need to be misclassified as a state.

alter table public.jurisdictions
  drop constraint if exists jurisdictions_type,
  add constraint jurisdictions_type check (
    jurisdiction_type in (
      'country',
      'state',
      'province',
      'territory',
      'region',
      'district',
      'federal_district',
      'school_board',
      'exam_board',
      'curriculum_board',
      'school'
    )
  );
