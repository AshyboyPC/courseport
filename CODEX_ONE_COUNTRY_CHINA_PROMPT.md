# Codex task — repair and verify China reference data only

Work in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

This is an implementation task. Inspect the repository, research current direct official sources, edit the CSV/audit files, and run validation. Do not merely produce a research report.

Work only on China (`CHN`). Preserve USA, India, Canada, Australia, the United Kingdom, and Germany exactly. Do not import into Supabase or deploy anything.

## Objective

Repair China's existing reference data so every retained material claim has direct, current, scope-matched official evidence and:

```text
npm run seed:reference:check:country -- --country=CHN
```

finishes with equal required/supported claims and `errors=0`.

Prefer a smaller honest dataset over a large speculative one. Do not spend unlimited time finding evidence for an optional field: when a direct official source does not explicitly support it, clear it, downgrade the record, or delete the unsupported row and document the gap.

## Hard boundaries

Do not:

- access or modify `.env*` files;
- connect to Supabase or run a live import;
- deploy anything;
- edit application code, migrations, package files, import scripts, or validators;
- edit another country's data, audit, provenance, or research-gap rows;
- use Wikipedia, blogs, tutoring sites, commercial credential evaluators, school-marketing pages, university admissions pages, AI summaries, or search-result snippets as evidence;
- invent Chinese course names, translations, grade placement, required status, examination status, credits, credentials, curriculum structures, Gaokao rules, Zhongkao rules, or provincial policies;
- use the generic MOE homepage for detailed claims;
- treat Gaokao as a graduation requirement or senior-high diploma requirement;
- treat Zhongkao rules as nationally uniform;
- treat provincially administered examinations or subject-selection models as one national rule;
- create mapping rules or equivalencies;
- add provincial curricula/frameworks in this pass;
- edit validators to make bad data pass.

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

Preserve all valid UUIDs for retained records. Use fresh valid UUIDs only for genuinely necessary new sources, audit records, or provenance links.

## Existing China records

Country:

```text
China: f2a00835-5b0a-4be3-89be-157b77cc2916
```

Curricula:

```text
MOE Compulsory Education (Junior Secondary, Grades 7-9): af5a90f4-d179-42c1-89cd-8ef1bc2fc854
MOE Senior High School (Grades 10-12): f4333a05-02bb-4df8-9b5c-9fd73c67e187
MOE Secondary Vocational Education: 6dc3b7cd-cfcf-4e86-8fd6-8ad3309124df
```

Existing sources:

```text
Generic PRC Ministry of Education homepage: 00410b9f-8dad-43fa-98ce-4149d4f93930
Compulsory Education Curriculum Programme and Standards (2022): e08959c3-5d49-4ec7-8592-5b8b4b942482
General High School Curriculum Program, 2017 Edition / 2020 Revision: 30bf962b-b07a-42d8-8ac9-ad6b7c492691
```

There are currently 28 course rows under curriculum `af5a90f4-d179-42c1-89cd-8ef1bc2fc854`. There are no course rows for the other two curricula.

Current baseline:

```text
country=CHN
required_material_claims=183
supported_material_claims=0
errors=183
```

The high baseline is not a target. It is caused by unsupported repeated fields. It may legitimately drop substantially.

## Evidence contract

For every populated material field on a `partial`, `verified`, or `official` record, create one field-level row in `SEMANTIC_SOURCE_AUDIT.csv` with:

1. direct official URL;
2. exact issuing authority;
3. exact Chinese and/or official English document title;
4. exact page, section, table, heading, or clause;
5. exact claim supported;
6. `direct_support=yes` only when explicitly supported;
7. `scope_match=yes` only when national/provincial/curriculum/grade scope matches;
8. `current_as_of_2026_06_23=yes` only after checking current applicability;
9. `action_taken=kept` or `corrected`.

Every audit URL must exist in `data_sources.csv`. Every audited record/field must have a matching `reference_record_sources.csv` link. Use field-level links, not a single vague row-level link.

Chinese-language official sources are valid and preferred when they are the direct authority. Record a careful English description/translation in audit notes, but do not pretend an unofficial translation is an official English title.

## Required repairs

### A. China country profile

Audit separately:

- `primary_languages`
- `education_system_summary`
- `grade_structure`

Current claims must not be kept automatically. Verify with direct current PRC laws, State Council material, or Ministry of Education documents.

Rules:

- distinguish the national nine-year compulsory-education system from local school-year organization;
- do not assume one universal 6+3 structure if official policy permits local variations;
- distinguish general senior high school, secondary vocational education, and technical/skilled-worker schools under potentially different administrative systems;
- do not call Gaokao a nationally administered MOE examination if provinces organize key aspects;
- do not imply Gaokao is required for senior-high graduation;
- `primary_languages=[Chinese]` is too vague unless a source matches the schema meaning; distinguish Standard Spoken and Written Chinese, minority-language education, and language of instruction where relevant;
- use `{}` for `grade_structure` if the schema cannot honestly represent variations;
- downgrade the country to `country_seed_only` if the remaining material profile cannot be directly supported.

### B. Compulsory education / junior-secondary curriculum

Use the direct official 2022 compulsory-education curriculum programme and the actual official subject-standard documents or attachments. Do not rely only on the MOE announcement page when the detailed claim appears in an attached document.

Audit separately if retained:

- curriculum `name`;
- `grade_range`;
- `authority`;
- `description`.

Use the exact official title and scope. Avoid implying that the entire nine-year curriculum is only a junior-secondary curriculum unless the row is explicitly scoped to the junior-secondary portion.

### C. The 28 junior-secondary course rows

Audit these rows as a set, but validate each populated material field individually.

Important repairs:

- `course_name_local` currently contains English text. Replace it with the exact official Chinese subject name when directly sourced, or clear it.
- `course_name_english` may contain a careful translation only when the underlying official subject is established; keep translations consistent and note translation status.
- do not duplicate a subject into Grades 7, 8, and 9 unless the official curriculum programme explicitly shows it in each grade/year;
- a subject appearing in the curriculum does not prove `is_required=true` for every learner in every listed grade;
- a subject having assessment standards does not prove `is_exam_based=true`;
- national curriculum inclusion does not prove a uniform provincial Zhongkao examination requirement;
- clear `is_exam_based` unless the exact national claim is explicitly supported. Provincial exam participation belongs in future provincial research;
- clear generic one-word descriptions that add no independently sourced information;
- do not invent credits;
- verify subject start grades carefully, especially Physics, Chemistry, Biology/Science, History, Geography, Arts, Physical Education and Health, Information Technology, Labor Education, and Moral and Rule-of-Law Education;
- use the exact current subject name. For example, do not preserve “Moral and Political Education” if the official 2022 compulsory-education subject title differs;
- check whether Arts is integrated or divided by stage and whether separate Music/Fine Arts rows would be required; do not invent replacements in this pass;
- delete duplicate grade rows when the official source supports only a grade span rather than individual grade placement and the current schema cannot express it honestly.

Efficiency rule: open the official curriculum programme/table first. Build a source-to-field matrix from that table. Retain only the fields it directly proves. Do not open dozens of subject PDFs merely to keep generic descriptions.

### D. General senior-high curriculum

Use the direct official current General Senior High School Curriculum Programme and current revision documents.

Audit separately if retained:

- `name`;
- `grade_range`;
- `authority`;
- `description`.

Rules:

- verify the exact effective edition/revision and whether it remains current in 2026;
- distinguish compulsory, selective compulsory, and elective curriculum components only if the direct document supports the terminology;
- do not convert subject modules, credits, or academic proficiency tests into US-style credits;
- do not describe one universal “general academic track” if the official framework uses different language;
- do not add course rows unless every field is directly supported;
- do not add Gaokao subject-selection claims because province/cohort models vary.

### E. Secondary vocational curriculum

Determine whether the existing row is defensible as one curriculum.

Rules:

- use direct current MOE vocational-education curriculum programme/standards;
- distinguish secondary vocational schools administered under education authorities from skilled-worker schools administered under human-resources authorities;
- remove the statement that the curriculum includes “skilled worker schools” unless a direct scope-matched source explicitly does so;
- do not combine specialized secondary schools, vocational high schools, adult secondary specialized schools, and skilled-worker schools without exact official scope;
- if one row cannot represent the systems accurately, narrow and rename it, downgrade it, or delete it and document the gap;
- do not add vocational course rows in this pass.

### F. Provincial and examination gaps

Do not create provincial rows. Expand `RESEARCH_GAPS.csv` with concrete future work for:

- province-specific Zhongkao policies and examination subjects;
- province-specific Gaokao models, subject combinations, scoring, and reform cohorts;
- high-school academic proficiency examinations and graduation requirements by province;
- Beijing, Shanghai, Guangdong, Jiangsu, Zhejiang, Shandong, Sichuan, Henan, Hubei, and other major provincial curriculum implementation differences;
- autonomous-region language-medium and curriculum implementation;
- Hong Kong and Macao as separate education systems outside this mainland-China record scope;
- international curricula in Chinese schools;
- secondary vocational programme/specialty catalogs;
- technical/skilled-worker school pathways under human-resources authorities;
- exact credential names and local graduation certification;
- current subject-specific curriculum standards not fully modeled in this pass.

### G. Provenance cleanup

- Remove the generic MOE homepage from detailed claims.
- Use direct MOE/State Council/legal documents and their direct attachments.
- Remove provenance for deleted, cleared, or downgraded claims.
- Add field-level provenance for every retained material claim.
- Remove duplicate China provenance tuples and unused sources.
- Preserve all completed-country provenance and audit rows exactly.
- Keep `mapping_rules.csv` header-only.

## Validation

Run:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=CHN
```

Continue correcting, clearing, downgrading, or deleting China claims until required equals supported and `errors=0`. Do not edit the validator.

Then run regressions for every completed country currently present. At minimum:

```bash
npm run seed:reference:check:country -- --country=USA
npm run seed:reference:check:country -- --country=IND
npm run seed:reference:check:country -- --country=CAN
npm run seed:reference:check:country -- --country=AUS
npm run seed:reference:check:country -- --country=GBR
```

If Germany has already been completed when this task starts, also run:

```bash
npm run seed:reference:check:country -- --country=DEU
```

Run the full mechanical dry-run through the country command. Do not run a live import.

## Required final response

Report:

1. exact China rows changed, added, deleted, cleared, or downgraded by file;
2. exact final number of retained China course rows;
3. every direct official URL used;
4. exact section/table/page supporting each retained field;
5. unsupported claims removed and why;
6. exact final row counts for modified CSVs;
7. China validator output and exit code;
8. completed-country regression outputs and exit codes;
9. exact additions to `RESEARCH_GAPS.csv`;
10. confirmation that no import, deployment, `.env` access, app-code edit, validator edit, or mapping-rule creation occurred.

Do not say “fully verified China.” State exactly what national curriculum claims are supported and what provincial/examination details remain `needs_research`.
