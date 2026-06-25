# Kimi Work prompt — repair and verify Australia only

Work in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

Use **one Agent**, not Agent Swarm. This run covers only Australia (`AUS`), with detailed MVP repair limited to the existing New South Wales, Victoria, and South Australia records described below. Do not research or modify another country. Preserve all verified USA/Georgia, India, and Canada/Ontario rows exactly. Do not claim global completion.

You are authorized to perform deep research using official public sources and edit only Australia-related rows in the allowed reference CSV/audit files. Complete research, repair, provenance linking, and Australia-scoped validation in one uninterrupted run. Do not request intermediate approval.

## Core rule

This is a semantic evidence task, not a row-count task. Do not try to keep a row merely because it already exists. Every retained factual field must be explicitly supported by a direct, current, scope-matched official source. If that evidence is unavailable, clear the unsupported optional field, downgrade the record to `needs_research`/`not_verified`, or delete the unsupported detailed record and document the gap.

## Forbidden actions

Do not:

- connect to or import into Supabase;
- deploy anything;
- read or modify `.env*` files;
- edit application code, migrations, package files, import scripts, or validation scripts;
- edit USA, India, Canada, or another country's data/audit rows;
- use search-result snippets, AI summaries, Wikipedia, blogs, news articles, tutoring sites, school marketing pages, university admissions summaries, commercial credential evaluators, or generic authority homepages as evidence for detailed requirements;
- invent credentials, curricula, course names, units, credit totals, examinations, assessment rules, ATAR rules, programs, equivalencies, authority names, or URLs;
- model Australia as having one national senior-secondary diploma or one national graduation framework;
- describe ATAR as a credential, graduation requirement, curriculum, examination, or government-issued school certificate;
- assume an Australian Curriculum F–10 rule automatically applies to state/territory senior-secondary credentials;
- use ACARA as evidence for NSW HSC, Victorian VCE, SACE, or another state/territory certificate unless the exact ACARA source explicitly supports that exact claim and scope;
- create cross-system mapping rules;
- create detailed rows for the other six state/territory senior-secondary systems during this run;
- use placeholder evidence such as `Direct official education sources`;
- mark anything `verified` or `official` merely because an official homepage exists;
- claim success merely because the mechanical CSV check passes.

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

Preserve every existing valid UUID for retained records. Generate valid RFC 4122 UUIDs only if a genuinely supported new source/provenance/audit record requires one.

## Exact Australia records in scope

Country:

```text
Australia: 2caa4d5e-e464-4d8c-8dd2-583456756b4a
```

Jurisdictions:

```text
Australian Capital Territory: 6314d971-d384-4393-9953-a02d749ee395
New South Wales: 7bff5eea-104b-448b-8b58-d1a6aed3a890
Northern Territory: 49f2c475-f3eb-42b8-ba39-21107e3479e0
Queensland: 1181ef87-3b41-46cb-93fa-0133a114dd40
South Australia: f94158d0-91da-49ce-b730-d4344c685e44
Tasmania: 32559e39-26e4-4a39-b130-3a2989954723
Victoria: ae0b176e-5503-463e-8569-21b5257ec9f8
Western Australia: fae5aca0-250f-4f2d-8750-a20578e5cf5b
```

Existing detailed curricula:

```text
NSW Higher School Certificate (HSC): 69dfde97-d4ad-4ade-aa46-ac769caf4bbd
Victorian Certificate of Education (VCE): 1109c79b-84c5-4807-b97b-e2bc613c1d0b
```

Existing detailed graduation frameworks:

```text
NSW Higher School Certificate (HSC): 16f879dc-2289-47fd-a18e-266241850f41
Victorian Certificate of Education (VCE): 4f00a17a-8602-48a7-a79f-636907390e23
```

Existing programs:

```text
VCE Vocational Major (VCE VM): bee7b988-6cab-45bc-a12b-bb90b00fb842
SACE VET Register: 7f44f5b9-65e3-4f23-8065-9765b0c73ea7
```

Existing Australia source:

```text
ACARA homepage: f019ef87-9634-490d-98c3-55645d38622f
```

The six jurisdictions other than NSW and Victoria remain discovery placeholders. South Australia may be used only to correct and scope the existing SACE VET program. Do not add curricula, graduation frameworks, course catalogs, or graduation requirement rows for ACT, NT, Queensland, South Australia, Tasmania, or Western Australia in this run. Document unresolved systems in `RESEARCH_GAPS.csv`.

## Mandatory evidence standard

For every populated material field retained as `partial`, `verified`, or `official`, add a separate row to `SEMANTIC_SOURCE_AUDIT.csv` containing:

1. a real direct official `https://` URL (use `http://` only if the issuing authority genuinely provides no HTTPS version);
2. exact issuing authority;
3. exact official document/page title;
4. exact page number, section, heading, table, policy clause, syllabus heading, or requirement heading;
5. exact field claim supported;
6. `direct_support=yes` only when the opened source explicitly supports that field;
7. `scope_match=yes` only when the source applies nationally or to the exact state/territory modeled;
8. `current_as_of_2026_06_22=yes` only after checking current applicability, transition arrangements, and cohort/year rules;
9. `action_taken=kept` or `corrected`.

The exact URL must exist in `data_sources.csv`, and every audited record field must have the corresponding `reference_record_sources.csv` link. Do not cite one page for multiple fields unless that page explicitly supports each field and each field has its own audit row.

If an official page links to a PDF, handbook, rule, or curriculum document containing the detailed claim, use the direct document URL for that detailed field. A generic landing page may establish existence or authority but not detailed completion, examination, or subject requirements.

## Required research and repairs

### A. Australia country profile

Australia is currently `country_seed_only` with:

```text
primary_languages=[]
education_system_summary blank
grade_structure={}
```

Keeping it `country_seed_only` is acceptable. Upgrade it only if direct current Australian government or statutory-authority sources support every populated country-level field.

If adding a country summary:

- explain accurately that school education and senior-secondary certification are administered by states and territories;
- distinguish the national Australian Curriculum from state/territory implementation and senior-secondary credentials;
- do not imply that Australia has one national high-school diploma;
- do not model NSW or Victoria as nationally representative;
- do not use English as `primary_languages` without a source matching the schema's intended meaning and acknowledging Australia's linguistic context;
- do not force one uniform national `grade_structure` if state/territory terminology or arrangements make that misleading.

Use ACARA only for claims within ACARA's actual national curriculum/assessment scope. Use an Australian Government source for federal/state responsibility claims where appropriate.

### B. State and territory jurisdiction placeholders

Verify all eight jurisdictions using official state/territory government or education-authority pages.

Correct known structural errors:

- Australian Capital Territory must use `jurisdiction_type=territory`, not `state`;
- Northern Territory must use `jurisdiction_type=territory`, not `state`;
- verify each current education department/authority name rather than mechanically appending `Department of Education`;
- add an official jurisdiction website URL only when directly verified;
- preserve the existing jurisdiction UUIDs;
- keep placeholder coverage as `needs_research` unless the jurisdiction itself is fully defensible and any promoted factual fields meet the audit standard.

Do not infer that the department running schools is always the same statutory authority that awards the senior-secondary credential. For example, distinguish NESA from the NSW Department of Education and VCAA from the Victorian Department of Education.

### C. NSW HSC curriculum record

Use current direct NSW Education Standards Authority (NESA) sources, not the NSW Department of Education homepage and not ACARA.

Audit separately:

- `name`
- `grade_range`
- `authority`
- `description`

Critical rules:

- determine whether this row should be modeled as a curriculum, a credential framework, or both; do not fill the curriculum description with unsupported graduation/ATAR claims;
- verify the current HSC course pattern and unit terminology from NESA rules or current official HSC guidance;
- do not state simply that all HSC courses are `2-unit courses`; NSW has varying unit values and course types;
- do not state that every course has an external HSC examination;
- do not describe ATAR as awarded by NESA or as an HSC completion requirement;
- if mentioning ATAR at all, use an official UAC source and make clear it is a separate tertiary-admission rank with its own eligibility/calculation rules;
- account for current syllabus reforms and effective years where they affect claims.

Do not create NSW course rows in this run unless every populated course field is supported by direct current NESA syllabus evidence and passes the semantic validator. Prefer documenting the course-catalog gap.

### D. NSW HSC graduation framework

Use current NESA official rules, credential guidance, or assessment/certification documentation.

Audit every populated framework field:

- `framework_name`
- `credential_awarded`
- `grade_range`
- `total_credits_required` if populated
- `credit_unit_name` if populated
- `has_state_or_national_exams`
- `exam_notes`
- `effective_year` if populated

Requirements must be represented using NESA terminology and current rules. Verify, without guessing:

- Preliminary and HSC course patterns;
- total units required at each stage;
- English requirements;
- Board Developed Courses versus Board Endorsed Courses;
- number of Year 12 units and examination requirements;
- whether a minimum number of units must be Board Developed Courses;
- minimum-standard literacy/numeracy requirements and any exceptions, cohorts, or pathways;
- school-based assessment versus external HSC examination scope.

Do not use `has_state_or_national_exams=true` as a blanket claim without precise `exam_notes`. Australia has no national HSC exam. Describe only the exact NSW external examination/assessment conditions supported by NESA.

You may add NSW graduation requirement rows only if the schema can represent the rules accurately and every field has direct evidence. Do not translate NSW units into invented US-style credits. If the schema cannot safely express course-pattern or cohort complexity, keep the framework partial and document the schema gap instead.

### E. Victorian VCE curriculum record

Use direct current Victorian Curriculum and Assessment Authority (VCAA) sources, not the Victorian Department of Education homepage and not ACARA.

Audit separately:

- `name`
- `grade_range`
- `authority`
- `description`

Critical rules:

- verify current terminology for VCE, VCE VM, units, studies, scored/unscored assessment, and completion;
- do not imply that every student follows exactly Units 1–4 for every study;
- do not imply that every VCE student receives an ATAR;
- do not place VCE VM completion rules inside the general VCE curriculum description unless explicitly and accurately distinguished;
- distinguish VCAA's credential/curriculum role from VTAC's ATAR role;
- account for current transition/effective-year rules.

Do not create Victorian course rows in this run unless direct current VCAA study-design evidence supports every populated course field. Prefer documenting the catalog gap.

### F. Victorian VCE graduation framework

Use direct current VCAA VCE administrative/handbook/completion guidance.

Audit every populated framework field:

- `framework_name`
- `credential_awarded`
- `grade_range`
- `total_credits_required` if populated
- `credit_unit_name` if populated
- `has_state_or_national_exams`
- `exam_notes`
- `effective_year` if populated

Verify the exact current satisfactory-completion rules, including:

- minimum number of units;
- required English-group units/sequences;
- Unit 3–4 sequence rules;
- whether completion requirements differ for VCE and VCE VM;
- external assessment scope and the distinction between achieving the VCE and obtaining study scores/ATAR;
- current cohort/effective-year provisions.

Do not claim that VCE examinations are universally required for the credential unless VCAA explicitly says so. Do not treat ATAR eligibility as identical to VCE completion.

You may add Victorian graduation requirement rows only if the current schema accurately represents them and every field has direct current VCAA evidence. Otherwise keep the framework partial and document the schema limitation.

### G. VCE Vocational Major program

The existing program has no `jurisdiction_id`. Correct it to the existing Victoria jurisdiction UUID if retained:

```text
ae0b176e-5503-463e-8569-21b5257ec9f8
```

Use direct current VCAA VCE VM sources. Audit separately:

- `program_name`
- `description`
- `availability_scope`
- `website_url`

Verify whether `program_type=vocational`, `level=upper_secondary`, and `availability_scope=state` accurately match the source and schema. Do not oversimplify VCE VM as merely “VET-integrated”; accurately state its relationship to VCE and VET only to the extent directly supported.

### H. SACE VET Register program

The existing program has no `jurisdiction_id`. Correct it to the existing South Australia jurisdiction UUID if retained:

```text
f94158d0-91da-49ce-b730-d4344c685e44
```

Use direct current South Australian Certificate of Education Board sources. Audit separately:

- `program_name`
- `description`
- `availability_scope`
- `website_url`

First determine whether “SACE VET Register” is truly an `education_program` or a reference/recognition register. If it is not accurately modeled as a program, delete or downgrade the row and document the gap rather than forcing it into the wrong table. Do not use the generic SACE homepage as proof of detailed VET recognition rules.

### I. ATAR treatment

Perform a dedicated semantic check of every Australia row for the word `ATAR`.

- NSW ATAR information must use current official Universities Admissions Centre (UAC) evidence and NSW scope.
- Victorian ATAR information must use current official Victorian Tertiary Admissions Centre (VTAC) evidence and Victorian scope.
- do not use UAC for Victoria or VTAC for NSW;
- do not describe ATAR as a certificate, curriculum, exam, or graduation requirement;
- do not imply all students receive one;
- remove ATAR text from a record if it is not necessary to describe that record accurately.

### J. Non-unified credentials and pathways

Following the user's standing rule, add missing formats and unresolved pathways to `RESEARCH_GAPS.csv` instead of seeding unsupported records. At minimum evaluate and document, with exact scope and next research source:

- ACT Senior Secondary Certificate;
- Queensland Certificate of Education (QCE);
- South Australian Certificate of Education (SACE), including Northern Territory use/relationship where applicable;
- Tasmanian Certificate of Education (TCE);
- Western Australian Certificate of Education (WACE);
- state/territory-specific VET and school-based apprenticeship pathways;
- IB Diploma Programme in Australian schools;
- Cambridge/other international curricula where school-specific;
- Indigenous community-controlled, remote, or local education pathways where rules and authority vary;
- adult/re-engagement senior-secondary credentials;
- state-specific literacy/numeracy minimum standards;
- full NSW and Victorian official course/study catalogs;
- ATAR authorities and rules by jurisdiction;
- schema limitations for unit patterns, cohort transitions, and non-credit completion requirements.

Do not add these as `partial`, `verified`, or `official` records unless they are within the narrow existing-record scope above and fully researched. Do not create a national row for a non-unified credential or program.

### K. Provenance cleanup

- Remove the generic ACARA homepage link from any NSW HSC, Victorian VCE, VCE VM, or SACE VET claim.
- Retain ACARA only for exact national-scope fields it directly supports.
- Link NSW records to direct NESA sources.
- Link Victorian records to direct VCAA sources.
- Link SACE VET material only to direct SACE Board sources.
- Link ATAR claims only to the correct direct UAC or VTAC source.
- Add field-level source links for every retained material Australia claim.
- Remove duplicate Australia provenance tuples.
- Remove newly added but unused Australia sources when they support no retained record or documented gap.
- Preserve every USA, India, and Canada audit/provenance row exactly.
- Keep `mapping_rules.csv` header-only.

## Required validation

Run exactly:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=AUS
```

Current baseline:

```text
country=AUS
required_material_claims=26
supported_material_claims=0
errors=26
```

The command must end with equal required/supported claims and `errors=0`. The required count may legitimately decrease if unsupported fields are cleared or records are downgraded/deleted. Do not edit either validator. If validation fails, continue researching, correcting, clearing, downgrading, or deleting Australia claims until it passes.

Then rerun regression checks:

```bash
npm run seed:reference:check:country -- --country=USA
npm run seed:reference:check:country -- --country=IND
npm run seed:reference:check:country -- --country=CAN
```

All three must remain at `errors=0` with their previously supported material claims intact.

Do not run the live import command. Do not connect to Supabase.

## Required final response

Return a precise report containing:

1. exact Australia rows changed, added, deleted, cleared, or downgraded, grouped by file;
2. every direct official URL used, grouped by issuing authority;
3. exact page/section/heading/policy clause supporting every retained material field;
4. a separate list of unsupported claims removed or cleared;
5. all jurisdiction type, authority, and jurisdiction-ID corrections;
6. exact final row counts for every modified CSV;
7. Australia semantic validator output: audit rows, required claims, supported claims, errors, and exit code;
8. USA, India, and Canada regression outputs and exit codes;
9. exact additions/updates made to `RESEARCH_GAPS.csv`;
10. explicit confirmation that no Supabase import, deployment, `.env` access, app-code edit, validator edit, or mapping-rule creation occurred.

Do not say “fully verified Australia.” Say exactly which Australia/NSW/Victoria/South Australia claims are supported and which remain `needs_research`.
