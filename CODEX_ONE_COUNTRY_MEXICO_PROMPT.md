# Codex task — repair and verify Mexico reference data only

Work in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

This is an implementation task. Inspect the repository, research current direct official sources, edit the reference CSV/audit files, and run validation. Do not return only a research report.

Work only on Mexico (`MEX`). Preserve USA, India, Canada, Australia, the United Kingdom, Germany, and China exactly. Do not import into Supabase or deploy anything.

## Objective

Repair Mexico's existing reference data so every retained material claim has direct, current, scope-matched official evidence and:

```text
npm run seed:reference:check:country -- --country=MEX
```

finishes with equal required/supported claims and `errors=0`.

Prefer a smaller, honest dataset over unsupported breadth. When a direct official source does not explicitly support an optional field, clear it, downgrade the record, or delete the unsupported record and document the gap. Do not spend excessive time preserving weak legacy claims.

## Hard boundaries

Do not:

- access or modify `.env*` files;
- connect to Supabase or run a live import;
- deploy anything;
- edit application code, migrations, package files, import scripts, or validators;
- edit another country's data, audit, provenance, or research-gap rows;
- use Wikipedia, blogs, news articles, tutoring sites, school pages, commercial credential evaluators, university admissions summaries, AI summaries, or search snippets as evidence;
- use a generic SEP/SEMS homepage for detailed curriculum or credential claims;
- invent course names, credits, grades, required subjects, examination rules, credentials, subsystem coverage, state implementation, or equivalencies;
- treat all Educación Media Superior institutions as one uniform three-year curriculum;
- treat General Bachillerato, Bachillerato Tecnológico, CONALEP, Telebachillerato, and autonomous/state systems as identical;
- claim compulsory education ends at lower secondary without checking current constitutional and statutory law;
- translate school years mechanically into US grades unless the official source directly establishes the equivalence represented;
- create mapping rules;
- add 32 state/federal-entity curricula or frameworks in this pass;
- edit validators to make unsupported data pass.

## Read completely before editing

```text
KIMI_REFERENCE_DATA_FINAL_SEMANTIC_REPAIR_PROMPT.md
scripts/import-reference-data.ts
scripts/validate-semantic-reference-audit.ts
supabase/seeds/countries.csv
supabase/seeds/jurisdictions.csv
supabase/seeds/curricula.csv
supabase/seeds/curriculum_courses.csv
supabase/seeds/destination_graduation_frameworks.csv
supabase/seeds/graduation_requirements.csv
supabase/seeds/education_programs.csv
supabase/seeds/mapping_rules.csv
supabase/seeds/data_sources.csv
supabase/seeds/reference_record_sources.csv
SEMANTIC_SOURCE_AUDIT.csv
RESEARCH_AUDIT.md
RESEARCH_GAPS.csv
```

Preserve valid UUIDs for retained records. Use fresh valid UUIDs only for genuinely necessary new sources, audit rows, or provenance links.

## Existing Mexico records

Country:

```text
Mexico: eef7cfe5-6a58-404f-8958-32c03a4d2c2c
```

Curricula:

```text
SEP Lower Secondary (Secundaria, Grades 7-9): ef490297-7fc8-48a1-be99-e8eb9fde7812
SEMS Upper Secondary (MCCEMS, Grades 10-12): 4f7111a6-7c89-4bd1-8459-f218e054b01f
```

Program:

```text
CONALEP Technical Professional Education: 1d5056bf-1717-4198-98b7-14653e84a0c1
```

Existing sources:

```text
Generic SEP homepage: c2a3c0c0-8582-46cb-8cac-5e386d6ee626
Old SEMS Sistema Nacional de Bachillerato page: d20098ed-9673-4f33-afa0-22b9fe07c2b2
ACUERDO 17/08/22 MCCEMS: c6f0984a-8c2b-4c8d-87b2-bb44daa60c68
Plan de Estudios para la Educación Secundaria: 7a3269e9-fd7e-4046-bdf1-fc3162f11071
```

Current baseline:

```text
country=MEX
required_material_claims=15
supported_material_claims=0
errors=15
```

The required count may decrease when misleading fields are cleared or records are narrowed/deleted.

## Evidence contract

For every populated material field retained as `partial`, `verified`, or `official`, create one field-level row in `SEMANTIC_SOURCE_AUDIT.csv` with:

1. direct official URL;
2. exact issuing authority;
3. exact official Spanish document/page title;
4. exact article, transitory provision, page, section, table, heading, agreement number, or clause;
5. exact field claim supported;
6. `direct_support=yes` only when explicitly supported;
7. `scope_match=yes` only when national/state/subsystem/level scope matches;
8. `current_as_of_2026_06_23=yes` only after checking amendments, abrogation, replacement instruments, implementation dates, and cohorts;
9. `action_taken=kept` or `corrected`.

Every audit URL must exist in `data_sources.csv`, and every audited record/field must have a matching `reference_record_sources.csv` link. Prefer Diario Oficial de la Federación (DOF), Cámara de Diputados legislation, SEP, SEMS, and direct CONALEP sources. A generic portal homepage is not evidence for detailed fields.

Spanish official sources are expected. English values may be careful descriptive translations, but audit notes must clearly state when the English text is not an official translation.

## Required repairs

### A. Mexico country profile

Audit separately:

- `primary_languages`
- `education_system_summary`
- `grade_structure`

Critical rules:

- verify compulsory education using the current Political Constitution, General Education Law, and current implementing framework;
- the existing statement that compulsory education ends after lower secondary is likely outdated or wrong—do not retain it without current legal support;
- distinguish educación básica from educación media superior;
- distinguish federal normative authority from state operation/implementation and autonomous institutions;
- do not state that SEP sets every curriculum identically across every subsystem;
- distinguish general, technological, professional-technical, community, distance, state, federal, and autonomous upper-secondary provision only when directly supported;
- `primary_languages=[Spanish]` is too simplistic unless a source fits the field meaning and addresses Indigenous-language rights/education;
- do not force one grade JSON if Mexican levels, school years, modalities, and credentials cannot be represented faithfully;
- do not assert exact credential names without direct issuing rules;
- downgrade to `country_seed_only` if the profile cannot be represented accurately with field-level evidence.

### B. Basic education and secundaria curriculum

Use the current official `Plan de Estudio para la educación preescolar, primaria y secundaria` and its DOF/SEP issuance instrument, including the 2022 Nueva Escuela Mexicana framework and any current modifications or implementation provisions.

Audit separately if retained:

- `name`;
- `grade_range`;
- `authority`;
- `description`.

Critical rules:

- the existing row is labeled as a standalone Grades 7–9 national curriculum, but the official plan may cover preschool, primary, and secondary through phases/campos formativos;
- use the exact official title and scope rather than inventing an English “SEP Lower Secondary” curriculum name;
- verify how secundaria and Phase 6 are expressed in the current plan;
- distinguish general, technical, telesecundaria, community, and other services only when directly supported;
- do not assert free textbook provision as a curriculum-description fact unless necessary and directly sourced;
- do not add individual course rows in this pass unless every field is explicitly supported by the current plan/programmes and the schema represents campos formativos, disciplinas, phases, and grades accurately;
- do not translate phases automatically into US grade numbers.

If the existing row cannot faithfully represent the official integrated basic-education plan, rename/narrow it, clear unsupported fields, or downgrade/delete it and document the schema gap.

### C. Upper-secondary MCCEMS curriculum

Research the current governing instrument for the `Marco Curricular Común de la Educación Media Superior` as of 2026-06-23.

Start with `ACUERDO 17/08/22`, but verify whether it has been modified, replaced, supplemented, or superseded by later DOF agreements, SEP/SEMS reforms, or 2025–2026 implementation documents. Use the current controlling instrument, not automatically the 2022 version.

Audit separately if retained:

- `name`;
- `grade_range`;
- `authority`;
- `description`.

Critical rules:

- use the exact official MCCEMS title and authority;
- do not assert universal Grades 10–12 if duration and organization vary across services/subsystems;
- distinguish the common curricular framework from individual subsystem study plans;
- distinguish fundamental curriculum, extended curriculum, resources/areas/ambits, or current official categories only when directly supported;
- do not claim General, Technological, and Professional-Technical subsystems implement an identical curriculum;
- do not add course, credit, or graduation-requirement rows without direct current subsystem-specific evidence;
- do not confuse `Sistema Nacional de Bachillerato` legacy terminology with the current MCCEMS framework.

If later official reforms make the old row inaccurate, update the record and source rather than keeping obsolete 2022 wording.

### D. CONALEP program

Use direct current official CONALEP sources, not the generic SEMS homepage.

First determine whether the row is accurately modeled as an `education_program` and whether it represents:

- the institution/system;
- the `Profesional Técnico-Bachiller` educational model;
- individual career programmes; or
- a broader professional-technical pathway.

Audit separately if retained:

- `program_name`;
- `description`;
- `availability_scope`;
- `website_url`.

Critical rules:

- use CONALEP's exact current official programme/model name;
- do not use the malformed phrase `professional-technica`;
- verify whether scope is national and whether state colleges/organisms have implementation distinctions;
- distinguish `Profesional Técnico` and `Profesional Técnico-Bachiller` credentials only when direct current CONALEP regulations support the distinction;
- do not claim every CONALEP programme has one duration, credential, or curriculum without evidence;
- do not add career rows in this pass.

If the existing row conflates the institution with a programme and cannot be safely narrowed, downgrade/delete it and add the correct research gap.

### E. State and subsystem gaps

Do not create state rows in this pass. Correct the existing “31 states” language in `RESEARCH_GAPS.csv`: Mexico has 32 federal entities when Mexico City is included, and research scope should be described accordingly using an official geographic/administrative source if a factual count is retained.

Expand concrete gaps for:

- state-level implementation of basic education;
- all 32 federal entities, including Mexico City;
- state upper-secondary systems and autonomous universities operating bachillerato;
- Dirección General del Bachillerato study plans;
- Bachillerato Tecnológico and DGETI/DGETAyCM services;
- CONALEP career plans and state-college variations;
- Colegio de Bachilleres;
- Telebachillerato Comunitario and distance/online services;
- `Prepa en Línea-SEP`;
- Indigenous, intercultural, bilingual, and community education;
- exact secundaria and media-superior credentials;
- upper-secondary completion/certification requirements by subsystem;
- current MCCEMS transition years/cohorts;
- professional-technical and vocational qualifications;
- international curricula in Mexican schools;
- incoming international-student placement and revalidation rules.

Do not add unsupported detailed records for these areas.

### F. Examinations and credentials

Mexico does not fit a single national school-leaving-examination model. Do not create a graduation framework unless a current official source and the schema can represent its exact scope.

Document gaps for:

- subsystem-specific completion requirements;
- certificate issuance;
- state/institutional admissions examinations;
- higher-education entrance processes that are not upper-secondary graduation requirements;
- equivalence/revalidation procedures for foreign studies.

Do not infer credentials or examination requirements from curriculum documents.

### G. Provenance cleanup

- Remove generic SEP and old SEMS homepage links from detailed claims.
- Remove obsolete Sistema Nacional de Bachillerato provenance unless still required for a precisely historical claim.
- Use direct DOF agreements, official attached plans, legislation, and direct CONALEP documents.
- Remove provenance for deleted, cleared, or downgraded claims.
- Add field-level provenance for every retained material Mexico claim.
- Remove duplicate Mexico provenance tuples and unused sources.
- Preserve all completed-country provenance and audit rows exactly.
- Keep `mapping_rules.csv` header-only.

## Validation

Run:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=MEX
```

Continue correcting, clearing, narrowing, downgrading, or deleting Mexico claims until required equals supported and `errors=0`. Do not edit the validator.

Then run every completed-country regression:

```bash
npm run seed:reference:check:country -- --country=USA
npm run seed:reference:check:country -- --country=IND
npm run seed:reference:check:country -- --country=CAN
npm run seed:reference:check:country -- --country=AUS
npm run seed:reference:check:country -- --country=GBR
npm run seed:reference:check:country -- --country=DEU
npm run seed:reference:check:country -- --country=CHN
```

All must remain at `errors=0` with their supported claims intact. The country command must also complete the full mechanical dry-run with zero rejected rows. Do not run a live import.

## Required final response

Report:

1. exact Mexico rows changed, added, deleted, cleared, or downgraded by file;
2. every direct official URL used;
3. exact article/agreement/section/page supporting each retained material field;
4. unsupported or outdated claims removed and why;
5. whether the two curriculum rows and CONALEP row were retained, narrowed, downgraded, or deleted;
6. exact final row counts for modified CSVs;
7. Mexico validator output and exit code;
8. every completed-country regression output and exit code;
9. exact additions/repairs in `RESEARCH_GAPS.csv`;
10. confirmation that no import, deployment, `.env` access, app-code edit, validator edit, migration edit, or mapping-rule creation occurred.

Do not say “fully verified Mexico.” State exactly what national/basic/MCCEMS/CONALEP scope is supported and what remains `needs_research` at the state, subsystem, credential, and examination levels.
