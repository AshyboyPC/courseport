# Codex task — repair and verify Philippines reference data only

Work in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

This is an implementation task. Inspect the repository, research current direct official sources, edit the reference CSV/audit files, and run validation. Do not return only a research report.

Work only on the Philippines (`PHL`). Preserve USA, India, Canada, Australia, the United Kingdom, Germany, China, and Mexico exactly. Do not import into Supabase or deploy anything.

## Objective

Repair the Philippines reference data so every retained material claim has direct, current, scope-matched official evidence and:

```text
npm run seed:reference:check:country -- --country=PHL
```

finishes with equal required/supported claims and `errors=0`.

Prefer a smaller, honest national dataset over unsupported breadth. If a direct official source does not explicitly support an optional field, clear it, downgrade the record, or delete the unsupported record and document the gap. Do not preserve weak legacy claims merely to keep the row count high.

## Hard boundaries

Do not:

- access or modify `.env*` files;
- connect to Supabase or run a live import;
- deploy anything;
- edit application code, migrations, package files, import scripts, or validators;
- edit another country's seed, audit, provenance, source, or research-gap rows;
- change completed-country rows while “cleaning up” shared files;
- use Wikipedia, blogs, news articles, tutoring/review sites, private-school pages, commercial credential evaluators, university admissions summaries, AI summaries, or search-result snippets as evidence;
- use a generic DepEd or TESDA homepage for detailed curriculum, track, credential, assessment, language, or certification claims;
- treat an announcement, press release, FAQ, slide deck, or pilot memo as a final nationwide rule unless the issuing instrument explicitly gives it that force and scope;
- invent grade equivalencies, course names, learning areas, tracks, strands, credentials, assessment requirements, TESDA qualification levels, or completion rules;
- treat the old K to 12 curriculum, MATATAG Curriculum, and any Strengthened Senior High School curriculum as simultaneously applicable to every learner;
- treat pilot implementation as universal implementation;
- treat all private schools, public schools, alternative learning programs, Indigenous Peoples Education, madrasah education, special-needs programs, and Philippine schools overseas as governed identically in every detail;
- treat Junior High School completion, Senior High School graduation, the Philippine Educational Placement Test, the National Achievement Test, admissions tests, and TESDA competency assessments as the same kind of requirement;
- represent TESDA National Certificates as automatically awarded to every TVL learner;
- infer US credits or cross-country equivalencies;
- create `mapping_rules` rows;
- add region, division, district, city, province, school, or specialization rows unless directly required to model a retained national claim;
- edit validators to make unsupported data pass.

## Read completely before editing

```text
KIMI_REFERENCE_DATA_FINAL_SEMANTIC_REPAIR_PROMPT.md
CODEX_ONE_COUNTRY_MEXICO_PROMPT.md
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
SCHOLAPORT_REFERENCE_FOUNDATION_PROGRESS_REPORT.md
```

Before editing, create a temporary byte-level baseline of every non-Philippines row in all ten seed CSVs plus `SEMANTIC_SOURCE_AUDIT.csv` and `RESEARCH_GAPS.csv`. Use it only to prove preservation; do not add the temporary baseline to the repository.

Preserve valid UUIDs for retained records. Use fresh RFC 4122 UUIDs only for genuinely necessary Philippines sources, audit rows, provenance links, or replacement records. Never reuse an existing UUID.

## Existing Philippines records

Country:

```text
Philippines: 3691f38a-e8ba-4451-9acb-9d3f8611fc92
```

Curricula:

```text
DepEd Junior High School (Grades 7-10): 3a5b3899-b243-493a-b600-df0a9dc2588e
DepEd Senior High School - Academic Track: dba3375a-b0ca-4516-8fce-07e6104dd197
DepEd Senior High School - TVL Track: 17bb3948-c60d-4c59-8a22-f3c587904d4b
```

Program:

```text
TESDA Technical-Vocational Certifications: 7570a383-2577-4a82-9621-6690523676b4
```

Existing source records:

```text
Generic DepEd homepage: 741d9fc1-be2d-479d-bff0-fb4d43722d84
Generic TESDA homepage: e10ed735-eb9d-4e8b-8ede-1683e67d8ad4
Republic Act No. 10533: fbc06210-35ae-4436-b671-6e4557a2eedb
TIMSS 2019 Encyclopedia Philippines: 05ed723c-01b4-4bb2-b97b-bedb8eb2757d
```

Current baseline:

```text
country=PHL
required_material_claims=19
supported_material_claims=0
errors=19
```

The required count may decrease if misleading fields are cleared or records are narrowed, downgraded, or deleted. A lower honest count is acceptable. Zero errors is mandatory.

## Evidence contract

For every populated material field retained as `partial`, `verified`, or `official`, create one field-level row in `SEMANTIC_SOURCE_AUDIT.csv` containing:

1. a direct official URL;
2. the exact issuing authority;
3. the exact official instrument/document/page title;
4. the exact Republic Act section, DepEd Order section/annex/page, memorandum provision, curriculum-guide page/table, TESDA circular/regulation, or other pinpoint location;
5. the exact field claim supported;
6. `direct_support=yes` only when the source explicitly supports the stored value;
7. `scope_match=yes` only when national/level/program/cohort scope matches the row;
8. `current_as_of_2026_06_23=yes` only after checking amendments, repeals, replacement curricula, pilot status, phased implementation, transition cohorts, and current school-year applicability;
9. `action_taken=kept` or `corrected` as appropriate; and
10. a note when an English label is a careful descriptive translation rather than an official title.

Every audit URL must exist in `data_sources.csv`. Every audited record/field must have a matching `reference_record_sources.csv` link. Remove provenance attached to cleared/deleted claims. Do not use a source outside its actual legal, program, learner, school-year, or institutional scope.

Use primary official sources in this order where available:

1. Official Gazette of the Republic of the Philippines and enacted Republic Acts;
2. Department of Education official orders, memoranda, curriculum guides, annexes, and official policy pages;
3. TESDA official circulars, training regulations, qualification registries, and competency-assessment rules;
4. other Philippine government agencies only for facts within their authority.

The existing TIMSS document may provide historical/context evidence, but it must not establish a current 2026 curriculum claim when a current DepEd instrument exists.

## Required research and repairs

### A. Determine the controlling curriculum timeline first

Before changing any row, establish the exact current relationship among:

- Republic Act No. 10533 and any current amendments, including language-of-instruction changes;
- the original K to 12 Basic Education Curriculum;
- the MATATAG Curriculum and its official phased implementation schedule;
- the current Junior High School curriculum applicable in school year 2025–26 and upcoming 2026–27;
- the Strengthened Senior High School curriculum, including pilot versus nationwide status, implementation school years, grade/cohort coverage, and transition rules;
- legacy Senior High School tracks/strands that remain applicable to transition cohorts; and
- public/private-school implementation scope.

Search specifically for current official instruments issued in 2023–2026. Do not assume the 2013 Act or an old curriculum guide alone describes the curriculum students actually follow in 2026.

Create a short evidence matrix in working notes before editing. For each existing Philippines row, identify the controlling source, current cohort/school-year scope, fields that can remain, and fields that must be cleared or rewritten.

### B. Philippines country profile

Audit separately if retained:

- `primary_languages`;
- `education_system_summary`;
- `grade_structure`.

Critical rules:

- distinguish official/national language law from medium-of-instruction policy;
- verify the effect and implementation of any amendment concerning mother-tongue instruction rather than repeating older MTB-MLE policy;
- distinguish elementary, Junior High School, and Senior High School precisely;
- verify whether “compulsory Kinder to Grade 12” is the exact current legal statement supported by the cited section;
- do not include credential labels such as “JHS Completion Certificate” or “SHS Diploma” unless a current national issuance rule explicitly supports those exact stored labels;
- distinguish DepEd authority from TESDA authority and from CHED higher-education authority;
- do not state that every SHS learner follows the same four-track system if current reforms changed the structure or if transition cohorts differ;
- clear the JSON and downgrade to `country_seed_only` if one national grade structure cannot accurately capture current transition cohorts.

### C. Junior High School curriculum row

Determine whether the existing row should represent:

- the old K to 12 JHS curriculum;
- the MATATAG Curriculum for Grades 7–10;
- only the grades/cohorts actually implemented by 2025–26; or
- a transition record that the current schema cannot accurately model.

Audit separately if retained:

- `name`;
- `grade_range`;
- `authority`;
- `description`.

Critical rules:

- use the exact official curriculum name and implementation scope;
- do not label all Grades 7–10 as MATATAG unless the official phase schedule makes that true for the relevant school year;
- do not use a generic DepEd homepage;
- do not claim “core subjects plus electives” without a direct curriculum instrument and a schema-faithful representation;
- do not claim a completion credential in the description unless directly supported;
- do not add individual `curriculum_courses` rows in this pass unless exact current subject names, grade/cohort scope, and status are supported by direct official guides.

If the row cannot faithfully represent the transition, narrow it, clear optional fields, downgrade it, or replace it with a better-scoped record while documenting the limitation.

### D. Senior High School Academic Track row

Determine whether the existing Academic Track/strand model remains current for all learners or only legacy/transition cohorts, and whether the Strengthened SHS curriculum replaces or restructures it.

Audit separately if retained:

- `name`;
- `grade_range`;
- `authority`;
- `description`.

Critical rules:

- verify the exact current status of STEM, ABM, HUMSS, and GAS;
- verify whether “Academic Track” remains the controlling official category for the cohort represented;
- distinguish pilot schools from national implementation;
- distinguish Grade 11 and Grade 12 implementation dates/cohorts;
- do not call a pilot curriculum nationwide;
- do not claim a universal diploma or graduation outcome from a curriculum guide alone;
- clear grade range or description fields if current transition scope cannot be represented accurately.

### E. Senior High School TVL row

Determine whether the TVL row remains a current national curriculum category, a legacy transition category, or a set of specializations that must be modeled differently under the strengthened curriculum.

Audit separately if retained:

- `name`;
- `grade_range`;
- `authority`;
- `description`.

Critical rules:

- verify current names and status of Agri-Fishery Arts, Home Economics, Industrial Arts, and ICT rather than copying an old overview;
- distinguish DepEd curriculum authority from TESDA qualification and assessment authority;
- do not say that TVL automatically produces NC I or NC II;
- do not represent every specialization, school, and learner as offering or earning the same qualification;
- do not add specialization course rows without direct current curriculum guides and training regulations.

### F. TESDA education-program row

Determine whether `TESDA Technical-Vocational Certifications` is a valid `education_program` row or an inaccurate conflation of:

- the TESDA agency;
- Philippine TVET;
- competency standards/training regulations;
- assessment and certification;
- National Certificates; and
- SHS TVL pathways.

Audit separately if retained:

- `program_name`;
- `description`;
- `availability_scope`;
- `website_url`.

Critical rules:

- use an exact official program/system/qualification label rather than a generic invented title;
- use direct TESDA rules or registries, not its homepage;
- do not state “NC I/II certifications within SHS TVL track and standalone” unless every part is explicitly supported and accurately scoped;
- do not claim national availability means every school offers every qualification;
- do not claim completion of training automatically results in certification;
- distinguish training, competency assessment, and certificate issuance;
- if the row cannot be represented honestly as one program, downgrade/delete it and create explicit research gaps instead.

### G. Language policy

Research the current legal and policy status of:

- Filipino and English;
- regional languages;
- mother-tongue-based instruction;
- any statutory amendment to Section 4 of Republic Act No. 10533;
- exceptions for monolingual classes or other officially defined cases; and
- implementation timing.

Do not populate `primary_languages` merely because Filipino and English are commonly used. The stored field must have a clearly defined meaning supported by the cited authority. If the schema cannot distinguish national language, official languages, and instructional languages, clear the field and document the schema/research gap.

### H. Assessments, credentials, alternative pathways, and local variation

Do not create a national graduation framework unless current official rules support every populated field and the schema accurately represents it.

Add concrete `RESEARCH_GAPS.csv` rows, as necessary, for:

- current JHS completion and SHS graduation/certification rules;
- National Achievement Test scope and its relationship, if any, to completion;
- Philippine Educational Placement Test and Alternative Learning System pathways;
- Strengthened SHS pilot/transition cohorts and nationwide rollout;
- public versus private school implementation;
- regional/division implementation differences;
- Indigenous Peoples Education, madrasah, special education, and language-policy implementation;
- Sports and Arts and Design pathways under current SHS reform;
- exact Academic/Technical-Professional pathway offerings;
- TVL specializations and current curriculum guides;
- TESDA qualification-by-qualification training regulations and assessment rules;
- Philippine Schools Overseas;
- international curricula offered by schools in the Philippines;
- foreign-student placement, recognition, accreditation, validation, and equivalency procedures; and
- any credential or examination claim that cannot be represented safely now.

Do not convert these gaps into speculative seed rows.

### I. Provenance cleanup

- Remove generic DepEd and TESDA homepage links from detailed claims.
- Remove or narrow historical TIMSS provenance when it does not establish current 2026 policy.
- Remove provenance for deleted, cleared, or downgraded claims.
- Add field-level provenance for every retained material Philippines claim.
- Remove duplicate Philippines provenance tuples and orphaned source/audit links.
- Remove unused Philippines sources only when no retained Philippines record uses them.
- Preserve every non-Philippines row exactly.
- Keep `mapping_rules.csv` header-only.

## Validation and preservation gates

Run:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=PHL
```

Continue correcting, clearing, narrowing, downgrading, or deleting Philippines claims until required equals supported and `errors=0`. Do not edit the validator.

Then run every completed-country regression:

```bash
npm run seed:reference:check:country -- --country=USA
npm run seed:reference:check:country -- --country=IND
npm run seed:reference:check:country -- --country=CAN
npm run seed:reference:check:country -- --country=AUS
npm run seed:reference:check:country -- --country=GBR
npm run seed:reference:check:country -- --country=DEU
npm run seed:reference:check:country -- --country=CHN
npm run seed:reference:check:country -- --country=MEX
```

All must remain at `errors=0` with their existing supported-claim totals intact. The PHL command must also complete the full mechanical dry run with zero rejected rows.

After validation, compare the current files with the temporary baseline and prove:

- all non-Philippines rows in all ten seed CSVs are byte-for-byte unchanged;
- all non-Philippines semantic-audit rows are byte-for-byte unchanged;
- all non-Philippines research-gap rows are byte-for-byte unchanged;
- no duplicate UUIDs exist;
- no duplicate provenance tuple exists;
- no provenance or audit row points to a deleted record/source; and
- `mapping_rules.csv`, import scripts, validator scripts, migrations, app code, and `.env*` files are unchanged.

Do not run a live import or deployment.

## Required final response

Report all of the following:

1. exact Philippines rows changed, added, deleted, cleared, or downgraded by file;
2. every direct official URL used;
3. exact Act/section, DepEd Order/memorandum/annex/page, TESDA regulation, or official heading supporting every retained material field;
4. the exact current relationship among RA 10533, any amendments, MATATAG, legacy K to 12, and Strengthened SHS;
5. unsupported, obsolete, pilot-only, or over-broad claims removed and why;
6. whether each of the three curriculum rows and the TESDA row was retained, renamed, narrowed, downgraded, replaced, or deleted;
7. exact final row counts for every modified CSV;
8. Philippines validator output and exit code;
9. every completed-country regression output and exit code;
10. exact additions/repairs in `RESEARCH_GAPS.csv`;
11. byte-level non-Philippines preservation results;
12. duplicate UUID/provenance and orphan-link checks; and
13. confirmation that no Supabase import, deployment, `.env` access, app-code edit, validator logic edit, migration edit, or mapping-rule creation occurred.

Do not say “fully verified Philippines.” State the exact national curriculum/cohort/program scope supported and clearly list what remains `needs_research`, especially implementation transitions, local delivery, credentials, assessments, and TESDA qualification detail.
