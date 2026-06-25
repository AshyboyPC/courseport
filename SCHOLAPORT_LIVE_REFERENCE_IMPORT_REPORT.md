# Scholaport Live Reference Import Report

**Date:** 2026-06-24  
**Import status:** MVP-safe package imported and verified live

## Live package

| Table | Imported seed rows | Matched live | Total live | Missing | Conflicting | Unexpected |
|---|---:|---:|---:|---:|---:|---:|
| countries | 20 | 20 | 20 | 0 | 0 | 0 |
| jurisdictions | 82 | 82 | 82 | 0 | 0 | 0 |
| data_sources | 26 | 26 | 26 | 0 | 0 | 0 |
| curricula | 14 | 14 | 14 | 0 | 0 | 0 |
| curriculum_courses | 39 | 39 | 39 | 0 | 0 | 0 |
| destination_graduation_frameworks | 1 | 1 | 1 | 0 | 0 | 0 |
| graduation_requirements | 8 | 8 | 8 | 0 | 0 | 0 |
| education_programs | 3 | 3 | 3 | 0 | 0 | 0 |
| mapping_rules | 0 | 0 | 0 | 0 | 0 | 0 |
| reference_record_sources | 234 | 234 | 234 | 0 | 0 | 0 |

The MVP-safe mode preserves all 20 country identities, converts non-MVP countries to honest `country_seed_only` shells for import, and imports detailed rows only for the ten validated MVP countries when their status is `partial`, `verified`, or `official`. Only provenance and sources required by retained records are imported.

The import used stable UUID upserts and was repeated. A transient jurisdiction update failed during the first repeat, but a complete comparison showed no duplicate or inconsistent state. A retry-enabled confirmation run completed, and the final comparison found every ID/value exact with unchanged totals.

## Security and schema verification

The live schema exposes all ten reference tables and the five student-profile reference UUID columns. Disposable-user tests confirmed:

- authenticated reference SELECT access;
- reference INSERT, UPDATE, and DELETE blocked by RLS;
- users can read and update only their own `student_profiles` row;
- repeated profile upserts retain one row and one ID; and
- disposable users and test data were removed.

The effects required from all three repository migrations are present. No migration, reset, truncation, broad cleanup, or deployment was performed.

## Onboarding and coverage data

- Source allowlist: IND, CHN, MEX, PHL, PAK
- Destination allowlist: USA, DEU, SAU, GBR, ARE
- Live supported source curriculum counts: IND 2 (Tamil Nadu only in live database), CHN 3, MEX 2, PHL 2, PAK 2
- Local package now has IND 4 (Tamil Nadu SSLC + HSC, Andhra Pradesh SSC + Intermediate)
- UAE stores seven emirate placeholders and zero curriculum, framework, or program detail.
- Onboarding exposes only directly sourced jurisdictions: Georgia for the United States, and England and Scotland for the United Kingdom. `needs_research` jurisdiction placeholders remain hidden.
- Selecting the United States auto-selects Georgia and its sourced 23-unit graduation framework because each is the sole supported option.
- Canada, Australia, and every future country are hidden by the centralized allowlist.
- Live coverage counts preserve zeros and label MVP visibility separately from evidence status.

A complete browser-authenticated onboarding run remains blocked because this checkout has no browser-safe Supabase anon/publishable key. The server-only service credential was not used as a `VITE_` variable or included in the browser bundle.

## Validation

- Full mechanical seed validation: zero rejected rows
- MVP-safe mechanical validation: zero rejected rows
- Ten MVP country semantic validators: zero errors
- Mapping rules: empty
- Focused tests: passed
- Typecheck: passed
- Lint: zero errors; pre-existing Fast Refresh warnings remain
- Production client and SSR build: passed

No credential value is recorded in this report.

## Local Andhra Pradesh addition not yet live-imported

After the live import described above, the repository received an additional local Andhra Pradesh source curriculum addition alongside the existing Tamil Nadu data. That local package is newer than the live counts in this report.

Local-only changes now include:

- Andhra Pradesh jurisdiction created as `partial` with verified identity fields;
- Andhra Pradesh SSC (Class 9-10) curriculum with 7 mandatory subjects;
- Andhra Pradesh Intermediate (Class 11-12) curriculum with 14 subjects;
- 42 Andhra Pradesh curriculum courses with official state-board subject names;
- 4 Andhra Pradesh data sources (BSEAP, BIEAP, SCERT AP, CSE AP);
- 53 Andhra Pradesh provenance links;
- 8 Andhra Pradesh semantic audit rows;
- 6 Andhra Pradesh research gaps documented;
- MVP scope updated to allow both Tamil Nadu and Andhra Pradesh as verified India source paths;
- 17/17 tests passing (9 Tamil Nadu + 8 Andhra Pradesh);
- all 12 completed-country regressions passed with 0 errors.

This local Andhra Pradesh package has **not** been imported into live Supabase in this pass. Therefore the live counts at the top of this report remain historical for the previous MVP-safe import and should not be read as proof that the Andhra Pradesh data is live.

Before any future live import, rerun:

```bash
node --experimental-strip-types scripts/import-reference-data.ts --dry-run
node --experimental-strip-types scripts/import-reference-data.ts --dry-run --mvp-safe
npm run validate:tn
npm run validate:ap
```

## Local U.S. correction not yet live-imported

After the live import described above, the repository received an additional local United States destination-state correction. That local package is newer than the live counts in this report.

Local-only changes now include:

- 51 U.S. planning jurisdictions selectable from seed data;
- DC modeled as `federal_district`;
- additional U.S. jurisdiction identity data sources;
- 255 field-level U.S. jurisdiction identity provenance links;
- expanded Georgia framework metadata;
- onboarding and profile persistence fixes for state-scoped framework selection;
- Andhra Pradesh source curriculum (SSC and Intermediate) with 42 courses, 4 data sources, 53 provenance links, and 8 semantic audit rows;
- MVP scope updated to allow both Tamil Nadu and Andhra Pradesh as verified India source paths.

This local U.S. package has **not** been imported into live Supabase in this pass. Therefore the live counts at the top of this report remain historical for the previous MVP-safe import and should not be read as proof that the local U.S. correction is live.

Before any future live import, rerun:

```bash
node --experimental-strip-types scripts/import-reference-data.ts --dry-run
node --experimental-strip-types scripts/import-reference-data.ts --dry-run --mvp-safe
npm run validate:us
node --experimental-strip-types scripts/validate-us-reference-foundation.ts --require-complete
```

The final strict command is expected to fail until the remaining 50 state/DC detailed frameworks are researched and sourced. Do not begin India or claim the United States is complete until it passes.
