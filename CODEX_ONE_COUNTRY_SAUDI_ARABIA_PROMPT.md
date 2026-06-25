# Codex task — repair and verify Saudi Arabia reference data only

Work in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

This is an implementation task. Inspect the repository, research current direct official sources, edit the reference CSV/audit files, and run validation. Do not return only a research report.

Work only on Saudi Arabia (`SAU`). Preserve USA, India, Canada, Australia, the United Kingdom, Germany, China, Mexico, the Philippines, and Pakistan exactly. Do not import into Supabase or deploy anything.

## Objective

Repair Saudi Arabia's existing reference data so every retained material claim has direct, current, scope-matched official evidence and:

```text
npm run seed:reference:check:country -- --country=SAU
```

finishes with equal required/supported claims and `errors=0`.

Prefer a small, honest national dataset over unsupported breadth. The current seeds appear to use legacy “Tawjihiyah,” Scientific/Literary-track, and unified-national-examination language that may be obsolete, jurisdictionally wrong, or confused with university-admission assessments. Verify the current Saudi secondary pathways system and graduation/certification rules before retaining any such claim.

If a direct official source does not explicitly support an optional field, clear it, downgrade the record, delete the unsupported row, or document the gap. Do not preserve weak legacy claims merely to retain visual breadth.

## Hard boundaries

Do not:

- access or modify `.env*` files;
- connect to Supabase or run a live import;
- deploy anything;
- edit application code, migrations, package files, import scripts, or validators;
- edit another country's seed, audit, provenance, source, or research-gap rows;
- change completed-country rows while cleaning shared files;
- use Wikipedia, blogs, newspapers, study-abroad pages, private-school pages, commercial credential evaluators, university admissions summaries, AI summaries, or search-result snippets as evidence;
- use a generic Ministry of Education, TVTC, ETEC, Qiyas, or Vision 2030 homepage for detailed curriculum, track, credential, examination, assessment, or certification claims;
- treat the General Secondary Certificate, secondary-school completion, Qudurat/GAT, Tahsili/SAAT, university admission, and international examinations as the same thing;
- call an admission assessment a graduation examination unless a current official graduation rule explicitly does so;
- retain “Tawjihiyah” as the current official Saudi credential or curriculum name without direct current Saudi authority;
- retain Scientific/Literary as the current complete track model without verifying the current secondary pathways system and transition cohorts;
- infer universal Grade 10–12 structure, credits, semesters, tracks, course names, pass rules, examinations, or credential titles;
- assume every public, private, international, Qur'anic, special, adult, or overseas Saudi school uses identical curriculum and certification rules;
- conflate Ministry of Education school curriculum authority with TVTC technical/vocational training authority or ETEC assessment authority;
- infer US credits or cross-country equivalencies;
- create `mapping_rules` rows;
- add school-, district-, governorate-, university-, or training-specialty rows in this pass;
- edit validators to make unsupported data pass.

## Read completely before editing

```text
KIMI_REFERENCE_DATA_FINAL_SEMANTIC_REPAIR_PROMPT.md
CODEX_ONE_COUNTRY_PAKISTAN_PROMPT.md
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

Before editing, create a temporary byte-level baseline of every non-Saudi row in all ten seed CSVs plus `SEMANTIC_SOURCE_AUDIT.csv` and `RESEARCH_GAPS.csv`. Use it only to prove preservation; do not add the temporary baseline to the repository.

Preserve valid UUIDs for retained records. Use fresh RFC 4122 UUIDs only for genuinely necessary Saudi sources, audit rows, provenance links, or replacement records. Never reuse an existing UUID.

## Existing Saudi Arabia records

Country:

```text
Saudi Arabia: b792b01d-9769-4700-bfb9-d8ada6226a63
```

Curriculum:

```text
General Secondary (Tawjihiyah): 7c58c0c3-6e3b-46b3-982b-f6294fb195a5
```

Graduation framework:

```text
Saudi General Secondary Education: 0b61635a-8c62-4289-af2c-7fcf0fb81d62
```

Program:

```text
TVTC Technical and Vocational Training: 9c7f7d80-188a-4ac5-9f83-df3a4b7d1799
```

Existing sources:

```text
Generic Ministry homepage: 95ab9acc-d62f-4afe-b780-ce5ac031f37f
TIMSS 2023 Saudi Arabia report: 4f3a6638-e9f6-4b43-867f-caf621dba18d
```

Current baseline:

```text
country=SAU
required_material_claims=16
supported_material_claims=0
errors=16
```

The required count may decrease if misleading fields are cleared or records are narrowed, downgraded, replaced, or deleted. A lower honest count is acceptable. Zero errors is mandatory.

## Evidence contract

For every populated material field retained as `partial`, `verified`, or `official`, create one field-level row in `SEMANTIC_SOURCE_AUDIT.csv` containing:

1. a direct official URL;
2. the exact issuing authority in Arabic and, where useful, a careful English description;
3. the exact official Arabic instrument/document/page title;
4. the exact regulation, ministerial decision, curriculum-plan page/table, implementation guide section, assessment rule, or official heading;
5. the exact field claim supported;
6. `direct_support=yes` only when explicitly supported;
7. `scope_match=yes` only when national/institutional/school-type/level/cohort scope matches;
8. `current_as_of_2026_06_24=yes` only after checking replacements, current academic-year plans, phased reforms, transition cohorts, and effective dates;
9. `action_taken=kept` or `corrected`; and
10. a note whenever English wording is a descriptive translation rather than an official translation.

Every audit URL must exist in `data_sources.csv`. Every audited record/field must have a matching `reference_record_sources.csv` link. Remove provenance attached to cleared/deleted claims. Do not use a source outside its actual authority or scope.

Use primary official Saudi sources in this order where available:

1. Ministry of Education official decisions, regulations, secondary pathways plans, implementation guides, curriculum plans, and official document repositories;
2. Saudi government legislation/regulation portals and official cabinet/ministerial decisions;
3. Education and Training Evaluation Commission and Qiyas only for claims within their assessment authority;
4. Technical and Vocational Training Corporation regulations, program catalogs, and qualification documents only for TVTC scope;
5. official Vision 2030/Human Capability Development Program documents only for the exact claims they state.

Arabic primary sources are expected. A TIMSS report can provide context, but it must not establish a current 2026 curriculum, pathway, credential, or examination rule when a controlling Saudi instrument exists.

## Required research and repairs

### A. Establish the current secondary-system timeline first

Before editing, identify the exact current relationship among:

- the legacy secondary system and any older Scientific/Literary division;
- the current `مسارات المرحلة الثانوية` secondary pathways system;
- the common first year and subsequent pathway structure, if current official documents support those terms;
- pathway names and whether all are nationally available or school-dependent;
- implementation years and transition cohorts;
- the current academic-year/semester structure relevant to the retained row;
- course plans, completion requirements, and certificate issuance;
- public versus private/international school scope; and
- current 2025–26 and 2026–27 applicability.

Do not rely on old English overview pages. Build a short evidence matrix in working notes showing each existing Saudi row, its controlling source, current learner/school scope, fields that can remain, and fields that must be cleared.

### B. Saudi Arabia country profile

Audit separately if retained:

- `primary_languages`;
- `education_system_summary`;
- `grade_structure`.

Critical rules:

- distinguish official/national language, instructional language, and foreign-language teaching;
- do not store `[Arabic, English]` merely because both appear in education;
- verify compulsory-education scope from current law/regulation rather than a secondary source;
- do not call the whole system centralized without explaining private/international and TVTC boundaries;
- do not include `Tawjihiyah`, Scientific/Literary tracks, unified examinations, or a credential in the JSON unless current official documents directly support those exact claims;
- downgrade to `country_seed_only` with empty optional fields if the static schema cannot safely represent current pathways and school types.

### C. General-secondary curriculum row

Determine whether the existing row should be:

- renamed to the current Saudi secondary pathways system;
- narrowed to an MOE public-school pathway plan;
- modeled as a curriculum or an education program;
- retained only as a transition shell; or
- deleted because the current schema cannot represent it accurately.

Audit separately if retained:

- `name`;
- `grade_range`;
- `authority`;
- `description`.

Critical rules:

- use the exact current Arabic title plus a clearly marked descriptive English translation;
- do not retain `Tawjihiyah` without proof that it is the current official Saudi label;
- do not retain only Scientific/Literary tracks if the current pathway model differs;
- verify the exact number and names of pathways, common-year structure, and rollout scope before mentioning them;
- distinguish nationally designed pathways from actual school-level availability;
- do not add course rows unless current official course-plan tables support every field and the schema represents semesters, pathway specialization, electives, and credits faithfully;
- clear grade range if mapping Saudi years to `10-12` is not directly supported by the retained source.

### D. Graduation framework row

Treat the existing framework as highly suspect. Research the current official requirements for obtaining the relevant Saudi general-secondary certificate under the current pathways system.

Audit separately if retained:

- `framework_name`;
- `credential_awarded`;
- `grade_range`;
- `total_credits_required` if populated;
- `credit_unit_name` if populated;
- `has_state_or_national_exams`;
- `exam_notes`;
- `effective_year` if populated.

Critical rules:

- do not call the credential `Tawjihiyah` unless a current official issuing rule uses that term for Saudi Arabia;
- do not claim a unified national graduation examination without direct current evidence;
- separate school completion/continuous assessment/final examinations from Qudurat/GAT and Tahsili/SAAT university-admission assessments;
- do not infer a credit total from course-plan periods or hours;
- do not infer credential issuance from curriculum descriptions;
- do not create `graduation_requirements` rows unless each requirement is explicit, current, nationally scoped, and representable without inventing equivalence;
- delete or downgrade the framework if current official graduation rules cannot be proven precisely.

### E. ETEC/Qiyas assessment boundary

Research current official scope for relevant assessments, but retain claims only where they belong.

Explicitly distinguish:

- school-based or MOE completion assessment;
- national learning assessments;
- General Aptitude Test/Qudurat;
- Achievement Test/Tahsili;
- university admission uses;
- professional/licensure assessments; and
- international assessments such as TIMSS.

Do not place an admissions or system-monitoring assessment into a graduation framework unless the controlling graduation rule requires it.

### F. TVTC program row

The existing row incorrectly uses the MOE website and may conflate an authority with a program.

Determine whether it represents:

- the Technical and Vocational Training Corporation;
- secondary industrial institutes;
- colleges of technology;
- vocational training institutes;
- a specific diploma/qualification pathway; or
- the broader TVET system.

Audit separately if retained:

- `program_name`;
- `description`;
- `availability_scope`;
- `website_url`.

Critical rules:

- use direct TVTC sources;
- do not model the corporation itself as one student program unless the table can accurately express that scope;
- do not claim every institute offers the same credential, level, duration, or specialty;
- do not claim national availability means universal local availability;
- distinguish secondary institutes, postsecondary colleges, training programs, qualifications, and certification;
- if one safe national program row cannot be supported, delete/downgrade it and document separate research gaps.

### G. Private, international, special, and regional delivery

Do not add detailed rows in this pass. Add or repair concrete `RESEARCH_GAPS.csv` rows for:

- private schools using the MOE curriculum;
- international schools and British, American, IB, Indian, and other curricula;
- mandatory Saudi subjects in international/private schools;
- Qur'anic schools and institutes;
- adult, continuing, special, gifted, and inclusive education;
- regional/school-level availability of secondary pathways;
- girls'/boys' provision where rules or implementation differ;
- exact course plans by pathway and cohort;
- school completion, failed-course recovery, attendance, conduct, and certificate rules;
- Qudurat/Tahsili relationship to university admission rather than graduation;
- TVTC institution/program/qualification catalogs;
- credentials and document verification;
- incoming international-student placement and recognition;
- Saudi students returning with foreign credentials; and
- transition cohorts from legacy tracks to the pathways system.

Do not convert these gaps into speculative seed rows.

### H. Provenance cleanup

- Remove generic MOE homepage links from detailed claims.
- Remove or narrow TIMSS provenance where it does not establish current curriculum rules.
- Add direct current Saudi Arabic instruments and official attached plans.
- Remove provenance for deleted, cleared, or downgraded claims.
- Add field-level provenance for every retained material Saudi claim.
- Remove duplicate Saudi provenance tuples and orphaned source/audit links.
- Remove unused Saudi sources only if no retained Saudi record uses them.
- Preserve every non-Saudi row exactly.
- Keep `mapping_rules.csv` header-only.

## Validation and preservation gates

Run:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=SAU
```

Continue correcting, clearing, narrowing, downgrading, or deleting Saudi claims until required equals supported and `errors=0`. Do not edit the validator.

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
npm run seed:reference:check:country -- --country=PHL
npm run seed:reference:check:country -- --country=PAK
```

All must remain at `errors=0` with these supported-claim totals intact:

```text
USA 58
IND 86
CAN 14
AUS 21
GBR 11
DEU 3
CHN 36
MEX 14
PHL 8
PAK 8
```

The Saudi command must also complete the full mechanical dry run with zero rejected rows.

After validation, compare current files with the temporary baseline and prove:

- all non-Saudi rows in all ten seed CSVs are byte-for-byte unchanged;
- all non-Saudi semantic-audit rows are byte-for-byte unchanged;
- all non-Saudi research-gap rows are byte-for-byte unchanged;
- no duplicate UUIDs exist;
- no duplicate provenance tuple exists;
- no provenance or audit row points to a deleted record/source; and
- `mapping_rules.csv`, import scripts, validator scripts, migrations, app code, package files, and `.env*` files are unchanged.

Do not run a live import or deployment.

## Required final response

Report all of the following:

1. exact Saudi rows changed, added, deleted, cleared, or downgraded by file;
2. every direct official URL used;
3. exact decision/regulation/guide/page/table supporting every retained material field;
4. the exact current relationship among legacy secondary tracks, the pathways system, current cohorts, and school-level availability;
5. unsupported, obsolete, generic, mistranslated, admissions-only, or over-broad claims removed and why;
6. whether the curriculum, graduation framework, and TVTC rows were retained, renamed, narrowed, downgraded, replaced, or deleted;
7. whether `Tawjihiyah`, Scientific/Literary tracks, and unified-national-examination claims survived, with exact evidence if they did;
8. exact final row counts for every modified CSV;
9. Saudi validator output and exit code;
10. every completed-country regression output and exit code;
11. exact additions/repairs in `RESEARCH_GAPS.csv`;
12. byte-level non-Saudi preservation results;
13. duplicate UUID/provenance and orphan-link checks; and
14. confirmation that no Supabase import, deployment, `.env` access, app/package/migration/import-script/validator edit, or mapping-rule creation occurred.

Do not say “fully verified Saudi Arabia.” State the exact MOE curriculum/pathway, school type, cohort, credential, and assessment scope supported. Clearly list what remains `needs_research`, especially graduation/certification rules, pathway availability, private/international schools, ETEC admissions assessments, TVTC qualifications, and foreign-student recognition.
