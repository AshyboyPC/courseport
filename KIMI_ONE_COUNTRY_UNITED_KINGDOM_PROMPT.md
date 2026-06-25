# Kimi Work prompt — repair and verify the United Kingdom only

Work in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

Use **one Agent**, not Agent Swarm. This run covers only the United Kingdom (`GBR`), with detailed repair limited to the existing England and Scotland records. Wales and Northern Ireland remain discovery/jurisdiction placeholders except for correcting their jurisdiction metadata and documenting research gaps. Do not research or modify another country. Preserve USA, India, Canada, and Australia exactly. Do not claim global completion.

You are authorized to research direct official public sources and edit only United Kingdom-related rows in the allowed reference CSV/audit files. Complete the research, repair, provenance linking, and country-scoped validation in one uninterrupted run. Do not request intermediate approval.

## Core rule

The United Kingdom does **not** have one unified school curriculum, one unified graduation framework, or one universal school-leaving credential. England, Scotland, Wales, and Northern Ireland have materially different systems. Every claim must match the exact constituent-country scope and current policy. If an existing claim cannot be directly supported, clear it, downgrade/delete the detailed record, and document the gap.

## Forbidden actions

Do not:

- connect to or import into Supabase;
- deploy anything;
- read or modify `.env*` files;
- edit application code, migrations, package files, import scripts, or validators;
- edit USA, India, Canada, Australia, or another country's data/audit rows;
- use search snippets, AI summaries, Wikipedia, blogs, school pages, university admissions pages, commercial credential evaluators, tutoring sites, or generic authority homepages as detailed evidence;
- model England's National Curriculum as UK-wide;
- model GCSEs or A levels as a single UK-wide graduation credential;
- apply Ofqual rules to Scotland, Wales, or Northern Ireland;
- apply SQA/Qualifications Scotland rules to England, Wales, or Northern Ireland;
- call GCSE or A level a “programme” merely because an unsupported row already exists;
- treat BTEC as a government-wide school programme or use a generic national-curriculum page as evidence for Pearson qualifications;
- invent subject requirements, qualification sizes, grades, examinations, awarding bodies, compulsory status, equivalencies, authority names, transition dates, or URLs;
- create cross-system mapping rules;
- create detailed Wales or Northern Ireland curriculum/framework/course rows during this run;
- use placeholder evidence such as `Direct official education sources`;
- mark a record `verified` or `official` merely because an official homepage exists;
- claim success only because the mechanical CSV validator passes.

## Read first

Read completely:

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

Preserve all existing valid UUIDs for retained records.

## Exact records in scope

Country:

```text
United Kingdom: 63281867-0f28-4c45-94fc-ef735309c189
```

Jurisdictions:

```text
England: 1a0b3343-dda2-4010-8f6c-a058df1fd851
Northern Ireland: 32ffcbfa-493e-4e23-a521-fdee7f1b83da
Scotland: 4c3caa53-dba1-4298-a312-b2f43e354bc9
Wales: db2aa9fd-d45a-461f-aa3a-498ccb2f80b9
```

Curricula:

```text
England - GCSE and A-Level: 792c968d-f2c1-4851-9032-5968d169f8a3
Scotland - National Qualifications: c45d24b6-58dc-49e7-96e8-9241def547c7
```

Graduation frameworks:

```text
England Key Stage 4 and 5 Qualifications: e6095753-16d1-4ab1-be15-3faab98c53ee
Scotland National Qualifications: 87152d71-5f76-4a88-aa5f-f7a4d7c501a6
```

Programs:

```text
A-Level Programme: 9f97b83a-59bd-4c61-b17b-2cb088c75898
GCSE Programme: ca35b86f-78a7-4e96-a5ec-cd1f2dd57688
BTEC / Vocational Awards: 443d8fae-e2d9-46cc-ac24-ee0744fe8693
```

Existing UK sources include:

```text
DfE national curriculum collection: f197e2fe-bc74-4231-97e2-824e1801ea48
SQA homepage: 0460aa9b-6b7b-46cd-8787-d5a6debca952
Guide to Scottish Qualifications PDF: 1fad6782-20ad-450e-aab9-00b68016fbc9
```

## Mandatory evidence standard

For every populated material field retained as `partial`, `verified`, or `official`, add a separate `SEMANTIC_SOURCE_AUDIT.csv` row with:

1. a real direct official URL;
2. exact issuing authority;
3. exact official document/page title;
4. exact page, section, heading, table, statutory clause, qualification condition, or policy paragraph;
5. the exact field claim supported;
6. `direct_support=yes` only when the opened source explicitly supports the field;
7. `scope_match=yes` only when it applies to the exact constituent country and qualification modeled;
8. `current_as_of_2026_06_23=yes` only after checking current policy, reforms, transition arrangements, and qualification year;
9. `action_taken=kept` or `corrected`.

The exact URL must exist in `data_sources.csv`, and each audited record field must have a corresponding `reference_record_sources.csv` link. Generic collections/homepages may establish authority or existence only; detailed qualification and assessment claims require the direct official specification, handbook, regulatory page, or government guidance.

## Required research and repairs

### A. United Kingdom country profile

Audit separately:

- `primary_languages`
- `education_system_summary`
- `grade_structure`

The current profile is overgeneralized. Critical rules:

- state that education is devolved and distinguish all four systems;
- do not represent school years using one UK-wide grade structure;
- do not describe England's Key Stages as applying to Scotland;
- do not list GCSE/A level/National 5/Higher as one unified credential ladder;
- `primary_languages=[English]` requires a source matching the schema meaning and must not erase Welsh, Gaelic, Irish, or other language-medium contexts;
- if a faithful national `grade_structure` cannot be represented, set it to `{}`;
- if all country-level populated fields cannot be directly supported, downgrade to `country_seed_only` rather than forcing a misleading profile.

Use UK government/devolution sources for country-level responsibility. Do not use an England DfE curriculum page as a UK-wide source.

### B. Four jurisdiction placeholders

Verify the existence, code, jurisdiction type, current authority name, and official website for England, Scotland, Wales, and Northern Ireland.

- Keep `jurisdiction_type=region` unless the schema has an already-used, allowed, more accurate type; do not invent a new enum value.
- England's authority is the Department for Education, not “England Department of Education.”
- Scotland's government education directorate, Education Scotland, the qualifications regulator, and the qualifications awarding body are different entities; do not conflate them.
- Wales's Welsh Government education function, Qualifications Wales, and WJEC are different entities.
- Northern Ireland's Department of Education and CCEA have different roles.
- Verify current 2026 institutional changes, especially the transition from SQA to Qualifications Scotland and any regulator changes. Do not use a future or abolished name outside its effective date.
- Keep Wales and Northern Ireland `needs_research` after metadata correction.

### C. England curriculum row

Use direct current Department for Education and Ofqual sources. Audit separately:

- `name`
- `grade_range`
- `authority`
- `description`

Critical semantic repair:

- GCSE and A level are qualifications, not themselves one curriculum;
- England's National Curriculum applies through Key Stage 4 with specific statutory/non-statutory scope, while post-16 A levels are regulated qualifications;
- Key Stage 4 and post-16/Key Stage 5 must not be merged into a fictitious single curriculum without qualification;
- verify whether the existing row can accurately remain in `curricula`; if not, rename/rewrite narrowly, downgrade, or delete it and document the schema gap;
- WJEC is not simply an England awarding body; if referencing Eduqas/WJEC, use exact regulated brand/jurisdiction scope;
- do not imply all pupils take the same GCSE subjects or all post-16 learners take A levels.

Do not add course rows unless direct current subject content/specifications support every populated course field.

### D. England qualification framework row

Determine first whether “England Key Stage 4 and 5 Qualifications” and credential `GCSE and A-Level` accurately represent a graduation framework. England does not award one high-school diploma and has no universal graduation credit total.

Audit every retained field:

- `framework_name`
- `credential_awarded`
- `grade_range`
- `total_credits_required` if populated
- `credit_unit_name` if populated
- `has_state_or_national_exams`
- `exam_notes`
- `effective_year` if populated

Critical rules:

- GCSEs and A levels are separate subject qualifications, not a combined credential;
- distinguish statutory study requirements from qualification award requirements;
- external assessment varies by qualification and subject; do not claim one universal GCSE/A-level examination rule;
- distinguish awarding organisations (for example AQA, OCR, Pearson, Eduqas) from the regulator Ofqual and from DfE;
- account for current grading, assessment, and qualification-reform rules only when directly supported;
- do not invent a graduation requirement, credit total, or mandatory number of GCSEs/A levels.

If this table cannot faithfully represent England's subject-qualification model, downgrade/delete the row and document the schema gap. Do not preserve it merely to retain a framework count.

### E. Scotland curriculum row

Use direct current official Scottish Government, Education Scotland, and current qualifications-authority sources with exact role matching.

Audit separately:

- `name`
- `grade_range`
- `authority`
- `description`

Critical rules:

- distinguish Curriculum for Excellence from National Qualifications;
- National 4, National 5, Higher, and Advanced Higher are qualifications, not the entire Scottish curriculum;
- do not impose England year/Key Stage labels on Scotland;
- verify current Senior Phase terminology and typical school-year scope without turning typical practice into a universal requirement;
- verify the authority/awarding-body name effective on 2026-06-23, including SQA reform/transition status.

If the row is fundamentally a qualifications row mislabeled as curriculum, correct, narrow, downgrade, or delete it.

### F. Scotland qualification framework row

Audit every retained field using current direct official sources:

- `framework_name`
- `credential_awarded`
- `grade_range`
- `total_credits_required` if populated
- `credit_unit_name` if populated
- `has_state_or_national_exams`
- `exam_notes`
- `effective_year` if populated

Critical rules:

- National 4, National 5, Higher, and Advanced Higher are separate qualifications at different SCQF levels, not one credential;
- National 4 assessment differs materially from National 5/Higher/Advanced Higher; do not say all have external examinations;
- external assessment can vary by course; use direct current qualification guidance;
- do not claim the qualifications authority is the “sole awarding body” unless a current direct source explicitly supports that exact scope and date;
- Scottish Baccalaureate must not be casually presented as universally available or part of every learner's National Qualifications pathway;
- do not invent a national graduation credit total or required subject combination.

If the schema cannot accurately model a portfolio of separate qualifications, keep only defensible fields or downgrade/delete the framework and document the limitation.

### G. Existing program rows

Audit the three existing program rows semantically before trying to source them.

#### GCSE Programme and A-Level Programme

These descriptions already say they are “not an additional program.” Therefore they are likely misclassified.

- Do not keep them as `education_programs` merely to preserve rows.
- GCSEs and A levels belong in qualification/curriculum/framework modeling, not as generic national programs.
- Delete or downgrade these program rows unless an official source establishes a distinct program matching the schema.
- If retained, add `jurisdiction_id=England` and prove every field individually.

#### BTEC / Vocational Awards

- BTEC is a Pearson qualification brand, not a generic UK government programme.
- Do not use the DfE national-curriculum collection as evidence.
- Do not combine BTEC with unnamed “other vocational qualifications” in one factual record.
- Verify exact qualification family, awarding body, level, scope, approval/funding status, and current availability through direct Pearson and official regulated-qualification sources.
- If that cannot be represented accurately in this run, delete/downgrade the row and place BTEC/vocational qualification research in `RESEARCH_GAPS.csv`.

### H. Wales and Northern Ireland research gaps

Do not create detailed records, but expand `RESEARCH_GAPS.csv` with concrete future work. At minimum include:

- Curriculum for Wales and post-16 qualification reforms/effective cohorts;
- Qualifications Wales, WJEC, and awarding-body role distinctions;
- Welsh-medium qualification pathways;
- GCSE, AS and A level reforms in Wales;
- Northern Ireland Curriculum at Key Stages 3–4;
- CCEA GCSE, AS/A level, Essential Skills, and vocational qualifications;
- Northern Ireland awarding-body/regulatory distinctions;
- current transition dates and legacy qualifications.

### I. Additional non-unified pathways and formats

Add research gaps rather than unsupported rows for:

- T levels in England;
- apprenticeships and vocational technical qualifications;
- International GCSEs and international A levels, which are not equivalent to assuming domestic school scope;
- IB programmes in UK schools;
- Cambridge Technicals and other awarding-organisation-specific qualifications;
- Scotland Foundation Apprenticeships, National Progression Awards, Skills for Work, and Scottish Baccalaureates;
- alternative provision, adult qualifications, and home-country-specific school-leaving measures;
- university admissions measures that are not school credentials;
- exact course/specification catalogs by awarding organisation.

### J. Provenance cleanup

- Remove England DfE sources used for UK-wide, Scottish, Welsh, or Northern Irish claims.
- Remove the generic SQA homepage from detailed claims when a direct specification/handbook is required.
- Link each England claim only to a direct DfE, Ofqual, or exact awarding-organisation source matching its scope.
- Link each Scotland claim only to direct Scottish Government, Education Scotland, qualifications authority, or SCQF sources matching the field.
- Remove sources for deleted records unless retained for a documented gap.
- Add field-level provenance for every retained material claim.
- Remove duplicate UK provenance tuples.
- Preserve USA, India, Canada, and Australia audit/provenance rows exactly.
- Keep `mapping_rules.csv` header-only.

## Required validation

Run exactly:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=GBR
```

Current baseline:

```text
country=GBR
required_material_claims=33
supported_material_claims=0
errors=33
```

The required count may legitimately decrease when misleading fields are cleared or misclassified records are deleted/downgraded. The final result must have equal required/supported claims and `errors=0`. Do not edit either validator.

Then run regressions:

```bash
npm run seed:reference:check:country -- --country=USA
npm run seed:reference:check:country -- --country=IND
npm run seed:reference:check:country -- --country=CAN
npm run seed:reference:check:country -- --country=AUS
```

All must remain at `errors=0` with their existing supported claims intact. Do not run the live import command.

## Required final response

Return:

1. exact UK rows changed, added, deleted, cleared, or downgraded by file;
2. every direct official URL used, grouped by constituent country and authority;
3. exact section/page/policy clause supporting every retained material field;
4. all unsupported or misclassified claims removed;
5. all jurisdiction and authority-name corrections;
6. exact final row counts for every modified CSV;
7. UK semantic validator output and exit code;
8. USA, India, Canada, and Australia regression outputs and exit codes;
9. exact `RESEARCH_GAPS.csv` additions;
10. confirmation that no import, deployment, `.env` access, application-code edit, validator edit, or mapping-rule creation occurred.

Do not say “fully verified United Kingdom.” State exactly which England/Scotland claims are supported and which Wales/Northern Ireland or pathway areas remain research gaps.
