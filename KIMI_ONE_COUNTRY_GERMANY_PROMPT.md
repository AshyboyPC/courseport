# Kimi Work prompt — Germany MVP reference pass only

Work in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

Use **one regular Agent**, not Agent Swarm. Work only on Germany (`DEU`). This is an **MVP national-reference pass**, not an exhaustive research project. Preserve USA, India, Canada, Australia, and the United Kingdom exactly.

Complete the entire task without asking for intermediate approval. Work decisively: use the best direct official national/KMK sources available, remove or downgrade anything those sources do not support, validate, and stop. Do not spend time researching detailed rules for individual German Länder.

## Exact objective

Produce a small, honest, usable Germany MVP dataset that explains:

- Germany's school system is decentralized across 16 Länder;
- KMK coordinates common agreements/standards but does not operate one federal curriculum;
- detailed curricula, school-leaving requirements, and Abitur implementation vary by Land and remain future research.

Do not attempt comprehensive Land-level coverage. Do not create course catalogs, detailed graduation requirements, equivalency mappings, or individual Land curricula/frameworks.

## Read first

Read only the files needed for this task:

```text
scripts/import-reference-data.ts
scripts/validate-semantic-reference-audit.ts
supabase/seeds/countries.csv
supabase/seeds/jurisdictions.csv
supabase/seeds/curricula.csv
supabase/seeds/destination_graduation_frameworks.csv
supabase/seeds/data_sources.csv
supabase/seeds/reference_record_sources.csv
SEMANTIC_SOURCE_AUDIT.csv
RESEARCH_GAPS.csv
```

Do not inspect unrelated application code.

## Existing Germany records

```text
Country: 1c4ec2aa-9b9e-468e-ba8f-f0f933b3feb8
Curriculum: 29bad405-8ab9-4990-9d58-724852fbd74d
Graduation framework: c8fcad61-c9ff-4d90-8155-e91898d3e585
KMK source: 1c2adb65-bce8-4698-9300-eddd8efd3bfa
Germany education-system PDF source: dbf270c8-1c52-4128-8432-4a9f3d3d5f60
```

Preserve these UUIDs for any retained records.

## Strict source rules

Use only direct current official sources from:

- KMK;
- a German federal government authority when the claim is genuinely federal;
- the official German Eurydice/KMK publication already in the dataset.

Do not use search-result snippets, Wikipedia, blogs, school websites, university pages, commercial credential evaluators, or AI summaries.

Do not keep searching indefinitely. For each material claim:

1. Check the appropriate direct official source.
2. If it explicitly supports the claim, retain/correct it and source it.
3. If it does not, clear the optional field or downgrade/delete the detailed record.
4. Record the unresolved issue in `RESEARCH_GAPS.csv`.

Never invent missing facts.

## Required repairs

### 1. Germany country row

Audit these fields separately:

- `primary_languages`
- `education_system_summary`
- `grade_structure`

Keep the summary short and MVP-level. It may state only directly supported national facts about Länder responsibility, KMK coordination, and system variation.

Do not retain a single nationwide grade structure if the official source shows Land variation. In that case use:

```text
grade_structure={}
```

Do not retain `primary_languages=[German]` unless the source directly matches what this schema means. Clearing it to `[]` is acceptable.

Use `coverage_status=partial` only when every populated material field has direct official evidence. Otherwise use `country_seed_only`.

### 2. Existing KMK curriculum row

The existing row may incorrectly imply that KMK operates one national curriculum.

For record:

```text
29bad405-8ab9-4990-9d58-724852fbd74d
```

Either:

- rewrite it narrowly as an exact KMK coordination/common-standards reference supported by an official source; or
- downgrade/delete it if `curricula` cannot represent it honestly.

Do not keep these claims without exact support:

- one national secondary curriculum;
- one universal Grades 5–12/13 range;
- the same school-type structure in all Länder;
- a universal G8/G9 path;
- one national Abitur pathway.

### 3. Existing KMK graduation-framework row

For record:

```text
c8fcad61-c9ff-4d90-8155-e91898d3e585
```

Retain it only if a direct current KMK agreement can be represented honestly as a common coordination framework. Otherwise downgrade/delete it.

Do not claim:

- a federal German diploma;
- a nationally administered Abitur examination;
- one federal credit/point total;
- one universal subject or examination requirement;
- that KMK directly awards the Allgemeine Hochschulreife.

If retained, explicitly state that Länder implement/administer their systems.

### 4. Länder handling

Do **not** research or add 16 detailed Land curricula or frameworks.

Adding 16 jurisdiction placeholders is optional, not required. Only do it if one direct official KMK source provides a clean list and it can be completed quickly. If added:

- use `jurisdiction_type=state`;
- set `coverage_status=needs_research`;
- do not research individual authority names, URLs, curricula, examinations, or requirements;
- do not add semantic-audit claims for placeholder-only rows.

If this would slow the task, skip it and document the 16-Länder work as a future gap.

### 5. Research gaps

Keep the gap list concise. Add or update Germany gaps for:

- detailed curricula and Abitur rules for the 16 Länder;
- G8/G9 variation;
- Land-specific examinations and course requirements;
- non-Abitur school-leaving credentials;
- vocational/dual-system pathways;
- international/IB pathways;
- incoming international-student recognition rules.

Do not research these areas now.

## Provenance and semantic audit

For every populated material field retained as `partial`, add one field-level row to `SEMANTIC_SOURCE_AUDIT.csv` with:

- a real direct official URL;
- exact authority and document/page title;
- exact section, heading, table, or page;
- exact field claim;
- `direct_support=yes`;
- `scope_match=yes`;
- `current_as_of_2026_06_23=yes` only after checking current applicability;
- `action_taken=kept` or `corrected`.

The same URL must exist in `data_sources.csv`, and the record must have the corresponding `reference_record_sources.csv` link.

Remove Germany provenance for deleted/downgraded claims and duplicate Germany provenance tuples. Preserve every non-Germany provenance/audit row exactly.

## Forbidden actions

Do not:

- import into or connect to Supabase;
- deploy anything;
- access `.env*` files;
- edit application code, migrations, package files, import scripts, or validators;
- edit another country's rows;
- create curriculum-course, graduation-requirement, education-program, or mapping-rule rows for Germany;
- run live imports;
- claim Germany is fully researched.

## Required validation

Run:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=DEU
```

Current baseline:

```text
required_material_claims=12
supported_material_claims=0
errors=12
```

The required count may decrease after honest clearing/downgrading/deletion. Finish only when required and supported are equal and `errors=0`.

Then run regressions:

```bash
npm run seed:reference:check:country -- --country=USA
npm run seed:reference:check:country -- --country=IND
npm run seed:reference:check:country -- --country=CAN
npm run seed:reference:check:country -- --country=AUS
npm run seed:reference:check:country -- --country=GBR
```

All must remain at `errors=0`.

## Required final response

Return only:

1. exact Germany rows changed/deleted/downgraded;
2. direct official URLs and exact supporting sections;
3. unsupported claims removed;
4. Germany validator output;
5. five regression outputs;
6. concise remaining Germany research gaps;
7. confirmation that no import, deployment, `.env` access, application-code edit, validator edit, or mapping-rule creation occurred.

Keep the final report factual and concise. Do not claim detailed Land coverage.
