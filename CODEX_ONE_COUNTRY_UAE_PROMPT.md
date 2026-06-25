# Codex task — repair and verify United Arab Emirates reference data only

Work in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

This is an implementation task. Inspect the repository, research current direct official sources, edit the reference CSV/audit files, and run validation. Do not return only a research report.

## Start condition

Before editing anything, confirm that the Saudi Arabia (`SAU`) pass has fully completed in this repository with a final reported validator result and that no other agent is still editing Saudi rows. If Saudi is still in progress, stop and report that UAE must wait.

Once Saudi is complete, work only on the United Arab Emirates (`ARE`). Preserve USA, India, Canada, Australia, the United Kingdom, Germany, China, Mexico, the Philippines, Pakistan, Saudi Arabia, and every non-UAE row exactly. Do not import into Supabase or deploy anything.

## Objective

Repair the UAE reference data so every retained material claim has direct, current, scope-matched official evidence and:

```text
npm run seed:reference:check:country -- --country=ARE
```

finishes with equal required/supported claims and `errors=0`.

Prefer a small, honest dataset over unsupported breadth. The current rows likely over-combine federal MOE curriculum, emirate-level private-school regulators, international curricula, mandatory national subjects, and secondary certificate/graduation claims. Narrow, clear, downgrade, or delete rather than pretending one UAE row covers every school type.

## Hard boundaries

Do not:

- access or modify `.env*` files;
- connect to Supabase or run a live import;
- deploy anything;
- edit application code, migrations, package files, import scripts, or validators;
- edit another country's seed, audit, provenance, source, or research-gap rows;
- edit Saudi rows if Saudi is still in progress;
- change completed-country rows while cleaning shared files;
- use Wikipedia, blogs, newspapers, private-school marketing pages, admissions blogs, commercial credential evaluators, university admissions summaries, AI summaries, or search-result snippets as evidence;
- use generic MOE, Emirates Schools Establishment, ADEK, KHDA, SPEA, or emirate-regulator homepages for detailed curriculum, graduation, private-school, inspection, equivalency, or mandatory-subject claims;
- treat UAE public-school curriculum, private-school international curricula, Indian/British/American/IB curricula, and adult/equivalency pathways as one uniform system;
- treat Abu Dhabi ADEK rules as applying to Dubai, Sharjah, or all emirates;
- treat Dubai KHDA rules as applying to Abu Dhabi or all emirates;
- claim ADEK “authorizes international curricula” unless the exact regulatory source supports that wording and scope;
- claim every private school follows the MOE curriculum;
- claim Arabic, Islamic Education, UAE Social Studies, Moral Education, or other national requirements apply to every student without checking exceptions, school type, grade level, nationality/religion scope, and emirate regulator;
- confuse Ministry curriculum examinations, EmSAT, equivalency, university admission, and graduation requirements;
- infer a Grade 10–12 structure, certificate title, exam requirement, pass threshold, credit rule, or graduation framework without direct current authority;
- infer US credits or cross-country equivalencies;
- create `mapping_rules` rows;
- add detailed rows for all emirates, curricula, or private-school systems in this pass;
- edit validators to make unsupported data pass.

## Read completely before editing

```text
KIMI_REFERENCE_DATA_FINAL_SEMANTIC_REPAIR_PROMPT.md
CODEX_ONE_COUNTRY_SAUDI_ARABIA_PROMPT.md
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

Before editing, create a temporary byte-level baseline of every non-UAE row in all ten seed CSVs plus `SEMANTIC_SOURCE_AUDIT.csv` and `RESEARCH_GAPS.csv`. Use it only to prove preservation; do not add the temporary baseline to the repository.

Preserve valid UUIDs for retained records. Use fresh RFC 4122 UUIDs only for genuinely necessary UAE sources, audit rows, provenance links, or replacement records. Never reuse an existing UUID.

## Existing UAE records

Country:

```text
United Arab Emirates: 485c97e0-e212-47ed-af2a-3d0b7f246c2b
```

The country profile is already an honest shell:

```text
primary_languages=[]
education_system_summary=null
grade_structure={}
coverage_status=country_seed_only
```

Do not expand it unless every populated material field receives current direct official field-level evidence and accurately distinguishes federal, emirate, public, private, and international-school scope.

Jurisdiction:

```text
Abu Dhabi: e062ea25-7d1a-49e5-9b0c-9aa8db6e0edf
```

Curricula:

```text
UAE National Curriculum (MOE): af919951-892d-40f5-b40c-6ee2f7e4f22c
Abu Dhabi ADEK Regulated Curricula: c281de15-6784-48e1-9ea4-9c3e8704a557
```

Graduation framework:

```text
UAE National Secondary Curriculum: 46562fd7-ff72-4cc2-be87-ceab9decc8f7
```

Existing sources:

```text
Generic UAE Ministry of Education homepage: c57834ca-e518-429f-b6c7-b67e5e6f785f
Generic ADEK homepage: fecc0208-1824-4481-b1ff-effe9e6d64c5
```

Current baseline observed before this prompt was created:

```text
country=ARE
required_material_claims=13
supported_material_claims=0
errors=13
```

The required count may change if Saudi's final pass modified shared counts, or if UAE rows are narrowed/deleted. A lower honest count is acceptable. Zero errors is mandatory.

## Evidence contract

For every populated material field retained as `partial`, `verified`, or `official`, create one field-level row in `SEMANTIC_SOURCE_AUDIT.csv` containing:

1. a direct official URL;
2. the exact issuing authority;
3. the exact official Arabic or English document/page title;
4. the exact regulation, circular, policy section, inspection-framework page, curriculum page/table, equivalency rule, assessment rule, or official heading;
5. the exact field claim supported;
6. `direct_support=yes` only when explicitly supported;
7. `scope_match=yes` only when federal/emirate/school-type/curriculum/grade/student scope matches;
8. `current_as_of_2026_06_24=yes` only after checking current academic-year applicability, replacements, reforms, transition rules, and effective dates;
9. `action_taken=kept` or `corrected`; and
10. a note whenever English wording is a descriptive translation rather than an official translation.

Every audit URL must exist in `data_sources.csv`. Every audited record/field must have a matching `reference_record_sources.csv` link. Remove provenance attached to cleared/deleted claims. Do not use a source outside its actual authority or scope.

Use direct official sources in this order where available:

1. UAE Ministry of Education regulations, curriculum pages, assessment/certificate/equivalency rules, and official PDFs;
2. Emirates Schools Establishment only for claims within its school-operation authority;
3. emirate regulators such as ADEK, KHDA, SPEA, and other official regulators only for claims within that emirate;
4. official inspection frameworks, private-school policies, and mandatory-subject rules;
5. official documents from examination/curriculum bodies only if the row is explicitly about those curricula.

Arabic sources are acceptable and often expected. Generic public-facing pages are not enough for detailed fields.

## Required research and repairs

### A. Establish UAE education-governance scope first

Before editing, determine the current relationship among:

- UAE Ministry of Education;
- Emirates Schools Establishment;
- emirate regulators, especially ADEK, KHDA, and SPEA;
- public schools using the UAE/MOE curriculum;
- private schools using MOE or international curricula;
- mandatory national subjects for private/international schools;
- school inspection and curriculum-approval rules;
- Grade 12 certificates, equivalency, and university-admission assessments; and
- current academic-year applicability.

Create a short evidence matrix in working notes showing each existing UAE row, controlling source, exact authority/scope, fields that can remain, and fields that must be cleared.

### B. UAE country profile

The current `country_seed_only` shell is acceptable and should remain minimal unless direct evidence supports a precise country-level description.

If considering population of any country field, audit separately:

- `primary_languages`;
- `education_system_summary`;
- `grade_structure`.

Critical rules:

- do not collapse official language, instructional language, mandatory Arabic, Islamic Education, UAE Social Studies, and English-medium private schooling into one `primary_languages` field;
- do not claim a single national curriculum for all schools;
- do not place private/international curricula into one country JSON;
- do not insert certificate names or exams without current federal and school-type support;
- preserve `country_seed_only` if the schema cannot express federal/emirate/private-school complexity safely.

### C. UAE National Curriculum / MOE curriculum row

Determine whether the existing row should represent:

- UAE Ministry curriculum in public schools;
- MOE curriculum in private schools that choose/are licensed for it;
- the Emirates Schools Establishment public-school model;
- a secondary-cycle pathway; or
- a placeholder/research shell.

Audit separately if retained:

- `name`;
- `grade_range`;
- `authority`;
- `description`.

Critical rules:

- use the exact current official name and authority;
- do not state `10-12` unless the official source explicitly supports that secondary-cycle scope;
- do not claim Arabic-medium instruction universally if English or bilingual/subject-specific instruction is part of the official model;
- do not list mandatory Arabic, Islamic Studies, Social Studies, or Moral Education unless scope, grade, and student exceptions are supported;
- do not call it a federal national curriculum for all UAE schools;
- do not add course rows unless exact current official course/subject tables are sourced and schema-safe.

### D. Abu Dhabi ADEK row

Treat the existing row as suspicious because it mixes regulation, curricula, private-school licensing, and international curricula.

Audit separately if retained:

- `name`;
- `grade_range`;
- `authority`;
- `description`.

Critical rules:

- use ADEK sources only for Abu Dhabi;
- distinguish licensing/inspection/regulation from curriculum ownership;
- do not state ADEK “authorizes” British, American, IB, Indian, and other curricula unless a direct ADEK policy uses that scope;
- do not imply one Abu Dhabi curriculum for all private schools;
- do not use ADEK to prove Dubai, Sharjah, or federal rules;
- if the row cannot be represented as a curriculum, downgrade/delete it and document Abu Dhabi private-school regulation as a research gap.

### E. UAE graduation framework row

Treat the existing framework as highly suspect.

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

- verify the exact certificate name for MOE-curriculum students;
- do not retain `Thanaweya` unless the current UAE source uses that exact label/scope;
- separate school-leaving certificate rules from EmSAT and university admission;
- distinguish public/MOE curriculum from private international curricula;
- do not claim Scientific/Literary tracks without current direct evidence;
- do not claim unified national examinations without direct current evidence;
- do not create `graduation_requirements` rows unless every requirement is current, official, and scope-safe;
- delete or downgrade the framework if exact current completion/certificate rules cannot be proven.

### F. Mandatory national subjects and private/international schools

Research but do not over-model:

- Arabic language requirements;
- Islamic Education scope and exemptions;
- UAE Social Studies / Moral Education requirements;
- grade levels and nationality/religion applicability;
- emirate-specific regulator requirements;
- curriculum-specific inspection rules.

Retain claims only if the table row can represent the exact scope. Otherwise add concrete research gaps.

### G. Add/repair research gaps

Do not add detailed rows for every emirate or curriculum in this pass. Add concrete `RESEARCH_GAPS.csv` rows for:

- Dubai KHDA private-school curriculum and mandatory-subject rules;
- Abu Dhabi ADEK private-school regulatory requirements;
- Sharjah SPEA and other emirate regulators;
- MOE public-school current secondary curriculum and certificate rules;
- Emirates Schools Establishment public-school operations;
- Grade 12 certificate and equivalency rules;
- EmSAT or replacement assessment relationship to graduation/admission;
- international curricula in UAE schools;
- Indian, British, American, IB, French, Pakistani, Philippine, and other school systems;
- mandatory Arabic, Islamic Education, UAE Social Studies, and Moral Education by grade/student type;
- private-school inspection frameworks;
- adult/evening/home/continuing education;
- special and inclusive education;
- credential attestation/equivalency;
- incoming international-student placement and recognition; and
- transition rules for any current reform.

Do not convert these gaps into speculative seed rows.

### H. Provenance cleanup

- Remove generic MOE and ADEK homepage links from detailed claims.
- Add direct current official pages/PDFs/policies.
- Remove provenance for deleted, cleared, or downgraded claims.
- Add field-level provenance for every retained material UAE claim.
- Remove duplicate UAE provenance tuples and orphaned source/audit links.
- Remove unused UAE sources only if no retained UAE record uses them.
- Preserve every non-UAE row exactly.
- Keep `mapping_rules.csv` header-only.

## Validation and preservation gates

Run:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=ARE
```

Continue correcting, clearing, narrowing, downgrading, or deleting UAE claims until required equals supported and `errors=0`. Do not edit the validator.

Then run every completed-country regression. Include Saudi only after its final pass is complete:

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
npm run seed:reference:check:country -- --country=SAU
```

All must remain at `errors=0` with their supported-claim totals intact. Known protected totals before the Saudi final are:

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

Add Saudi's final supported-claim total after the Saudi pass completes.

The UAE command must also complete the full mechanical dry run with zero rejected rows.

After validation, compare current files with the temporary baseline and prove:

- all non-UAE rows in all ten seed CSVs are byte-for-byte unchanged;
- all non-UAE semantic-audit rows are byte-for-byte unchanged;
- all non-UAE research-gap rows are byte-for-byte unchanged;
- no duplicate UUIDs exist;
- no duplicate provenance tuple exists;
- no provenance or audit row points to a deleted record/source; and
- `mapping_rules.csv`, import scripts, validator scripts, migrations, app code, package files, and `.env*` files are unchanged.

Do not run a live import or deployment.

## Required final response

Report all of the following:

1. exact UAE rows changed, added, deleted, cleared, or downgraded by file;
2. every direct official URL used;
3. exact policy/regulation/page/table supporting every retained material field;
4. the exact relationship among federal MOE, ESE, emirate regulators, public schools, private schools, international curricula, and mandatory national subjects;
5. unsupported, obsolete, generic, emirate-overbroad, admissions-only, or mistranslated claims removed and why;
6. whether the MOE curriculum row, ADEK row, and graduation framework were retained, renamed, narrowed, downgraded, replaced, or deleted;
7. whether Thanaweya, Scientific/Literary, mandatory-subject, and unified-exam claims survived, with exact evidence if they did;
8. exact final row counts for every modified CSV;
9. UAE validator output and exit code;
10. every completed-country regression output and exit code;
11. exact additions/repairs in `RESEARCH_GAPS.csv`;
12. byte-level non-UAE preservation results;
13. duplicate UUID/provenance and orphan-link checks; and
14. confirmation that no Supabase import, deployment, `.env` access, app/package/migration/import-script/validator edit, or mapping-rule creation occurred.

Do not say “fully verified UAE.” State the exact federal/emirate/school-type/curriculum/certificate scope supported. Clearly list what remains `needs_research`, especially private-school regulation by emirate, international curricula, mandatory subjects, certificate/equivalency rules, EmSAT/admissions boundaries, and incoming-student recognition.
