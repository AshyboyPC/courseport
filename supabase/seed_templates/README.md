# Scholaport reference-data collection

Google Sheets is a temporary research and review workspace only. The live Scholaport application reads reference data from Supabase, never directly from Google Sheets.

## Workflow

1. Create one Google Sheet tab per template in this directory.
2. Keep the header names exactly as provided.
3. Review factual rows and attach each record to a row in `data_sources` through `reference_record_sources`.
4. Export each completed tab as CSV.
5. Place exported files in `supabase/seeds/` using the table name, for example `curricula.csv`.
6. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in a local `.env.seed.local` file.
7. Run `pnpm seed:reference`.

Run `pnpm seed:reference:check` first to validate local CSV/JSON files without connecting to Supabase.

The service-role key is server/admin-only. Never prefix it with `VITE_`, commit it, or place it in frontend code.

## Provenance rules

- Every factual row must have a linked `reference_record_sources` row whose `data_source_id` points to a real `data_sources` record.
- `data_sources.source_url` must point to the reviewed source.
- Unsourced rows intended for import must use `coverage_status=needs_research`; `not_verified` rows still require a linked source so the team can see what was reviewed but not confirmed.
- The 20 priority-country shell records may use `coverage_status=country_seed_only` with empty summaries and grade structures.
- Do not label data `verified` or `official` without a reviewed source and appropriate reliability level.
- JSON/array cells must contain valid JSON, such as `{}` or `["English","French"]`.
- Use ISO dates (`YYYY-MM-DD`) for verification dates.

## U.S. destination-framework additions

The United States destination model uses additional additive columns and optional tables introduced after the original global reference foundation:

- `jurisdictions.is_selectable_for_planning`
- `jurisdictions.identity_verification_status`
- `jurisdictions.detail_coverage_status`
- `jurisdictions.controls_statewide_graduation_requirements`
- `jurisdictions.local_requirements_may_exceed`
- `jurisdictions.statewide_course_catalog_status`
- expanded `destination_graduation_frameworks` cohort, school-sector, authority, diploma, and local-override fields
- expanded `graduation_requirements` structural fields
- `graduation_requirement_groups`
- `graduation_requirement_options`
- expanded `education_programs` framework/program relationship fields
- `jurisdiction_course_catalogs`
- `jurisdiction_courses`

For the United States, keep jurisdiction identity and detailed framework coverage separate. A state/DC may be selectable for planning with `identity_verification_status=verified` while its detailed graduation framework remains `detail_coverage_status=research_pending`.

Run the U.S.-specific validator after editing U.S. destination data:

```bash
npm run validate:us
```

Use strict mode only when claiming the complete United States foundation is done:

```bash
node --experimental-strip-types scripts/validate-us-reference-foundation.ts --require-complete
```
