# Kimi Work prompt — repair and verify Canada only

Work in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

Use **one Agent**, not Agent Swarm. This run covers only Canada (`CAN`), with detailed MVP research limited to the existing Ontario records. Do not research or modify another country. Preserve all verified USA/Georgia and India rows exactly. Do not claim global completion.

You are authorized to research official public sources and edit only Canada-related rows in the allowed reference CSV/audit files. Complete research, repair, and Canada-scoped validation in one uninterrupted run. Do not request intermediate approval.

## Forbidden actions

Do not:

- connect to or import into Supabase;
- deploy anything;
- read or modify `.env*` files;
- edit application code, migrations, package files, or validation scripts;
- edit USA, India, or another country's data/audit rows;
- use search snippets, AI summaries, Wikipedia, blogs, school-marketing pages, commercial credential evaluators, or generic homepages as evidence for detailed requirements;
- invent provincial curricula, diploma names, credit totals, compulsory courses, examinations, programs, equivalencies, authority names, or URLs;
- treat Canada as having a national curriculum or national graduation framework;
- use placeholder evidence such as `Direct official education sources`;
- create cross-system mapping rules;
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
supabase/seeds/data_sources.csv
supabase/seeds/reference_record_sources.csv
SEMANTIC_SOURCE_AUDIT.csv
RESEARCH_AUDIT.md
RESEARCH_GAPS.csv
```

Preserve every existing valid UUID for retained records.

## Exact Canada records in scope

Country:

```text
Canada: 0d0e8809-7a02-4107-b32b-197efdb0ae8a
```

Ontario:

```text
Ontario jurisdiction: 6455ba12-2225-4cb9-847b-e5176ae7240f
Ontario curriculum: b4fde4e9-caa4-4a6a-97cd-e584ae58c720
Ontario OSSD framework: 52bfe3ea-0cd1-4344-a70a-0276011f4cf3
```

Other existing jurisdiction placeholders:

```text
Alberta: d0b9fc8c-de34-4cba-873d-e29146882dec
British Columbia: 674b29e4-61f3-446f-ae02-d739bb6e2051
Manitoba: 0065eeeb-9e96-409c-9d94-8929d9cb4140
New Brunswick: 5576d2f3-d49f-4f40-8776-e4a2854f18ab
Newfoundland and Labrador: 8d054199-4243-4004-a95a-777ce91f748a
Northwest Territories: ff1ed099-50c0-4d36-990f-ba78fba993a2
Nova Scotia: a292e7b7-459a-4460-8a20-ce14bc45ee22
Nunavut: 44ecb910-89d4-4c7f-a774-b503ff3faa18
Prince Edward Island: 19f03746-a38b-46d3-8658-0287abd49182
Quebec: 8294becc-9025-49d6-a11a-7ef73c522615
Saskatchewan: 9e23acd4-5799-4881-b3ef-29c3bce70943
Yukon: b241c6cd-b8bd-4252-b93f-8f018161061f
```

The other 12 provinces/territories remain discovery placeholders. Do not create detailed curricula, frameworks, requirements, programs, or course rows for them in this run. Document their unresolved systems in `RESEARCH_GAPS.csv`.

## Mandatory evidence standard

For every populated material field retained as `partial`, `verified`, or `official`, add a separate row to `SEMANTIC_SOURCE_AUDIT.csv` containing:

1. a real direct official `http://` or `https://` URL;
2. exact issuing authority;
3. exact official document/page title;
4. exact page number, section, heading, table, policy clause, or requirement heading;
5. exact field claim supported;
6. `direct_support=yes` only when the opened source explicitly supports that field;
7. `scope_match=yes` only when the source applies nationally or specifically to Ontario as modeled;
8. `current_as_of_2026_06_22=yes` only after checking current policy and cohort applicability;
9. `action_taken=kept` or `corrected`.

The exact URL must exist in `data_sources.csv`, and every audited record field must have the corresponding `reference_record_sources.csv` link.

If a source supports the record but not an optional field, clear the field. If a detailed record cannot be supported, downgrade or delete it and document the gap.

## Required research and repairs

### A. Canada country profile

Audit separately:

- `primary_languages`
- `education_system_summary`
- `grade_structure`

Use current official national sources such as CMEC, Statistics Canada, Government of Canada legislation/data, or another appropriate Canadian government authority.

Critical rules:

- Education is a provincial/territorial responsibility; Canada has no single national curriculum or national high-school diploma.
- Do not model Ontario's structure as Canada's national structure.
- Quebec's secondary system differs materially and typically ends secondary school before CEGEP; a uniform national grade JSON may therefore be misleading.
- English and French being Canada's official languages is not automatically identical to this schema's `primary_languages` meaning. Use a source that matches the retained claim, or clear the field.
- If no single national grade structure can be accurately modeled, set `grade_structure={}` and explain the provincial/territorial variation in the sourced summary.

Replace generic CMEC-homepage provenance with the direct CMEC overview page or another exact source that states the retained claim.

### B. Province and territory placeholders

Verify the existence, type, code, and current education-authority name for all 13 jurisdictions using an official CMEC directory or the relevant government sites.

Correct structural errors:

- Northwest Territories, Nunavut, and Yukon must use `jurisdiction_type=territory`, not `province`.
- Do not assume every authority is formally named `Ministry of Education`; Canadian governments use varying current department/ministry names.
- If a current authority name or URL is not directly verified, clear it rather than guessing.
- Keep all jurisdictions `needs_research` unless detailed current curriculum/framework evidence is actually added.

Jurisdiction placeholders do not need semantic audit rows unless promoted to `partial`, `verified`, or `official`, but any populated factual fields must still be defensible.

### C. Ontario curriculum

Use direct current Ontario Ministry curriculum pages/documents—not the generic Ministry homepage and not CMEC.

Audit separately:

- `name`
- `grade_range`
- `authority`
- `description`

The curriculum description must describe curriculum scope only. Remove OSSD credit totals, community-involvement hours, literacy requirements, and online-learning requirements from the curriculum description; those belong in the graduation framework/requirements.

Do not create Ontario course rows unless every course field can be directly sourced and pass the semantic validator.

### D. Ontario OSSD framework

Use the direct current Ontario Ministry policy source, including the current `Ontario Schools, Kindergarten to Grade 12: Policy and Program Requirements` diploma section and any linked current policy pages.

Audit every populated framework field:

- `framework_name`
- `credential_awarded`
- `grade_range`
- `total_credits_required`
- `credit_unit_name`
- `has_state_or_national_exams`
- `exam_notes`
- `effective_year` if populated

Critical cohort/version rules:

- Verify whether the current 30-credit composition is 17 compulsory + 13 optional or 18 compulsory + 12 optional for the relevant cohort.
- Record the Grade 9 entry cohort/effective date when requirements differ.
- Verify the 40-hour community-involvement requirement.
- Verify the literacy graduation requirement and all accepted methods of satisfying it; do not imply the OSSLT is the only possible route if Ontario policy allows alternatives such as the OSSLC or adjudication.
- Verify the two online-learning-credit requirement and accurately represent any parent/guardian or adult-student opt-out provision.
- `has_state_or_national_exams=true` is too broad unless the field is explicitly interpreted and explained as Ontario's provincial literacy assessment/requirement. Rewrite `exam_notes` precisely.
- Do not combine non-credit requirements into the 30-credit numeric total.

Use field-level source links. A single row-level link is insufficient for this framework.

### E. Ontario graduation requirements

`graduation_requirements.csv` currently contains no Ontario rows.

You may add Ontario requirement rows only when:

- the current official Ontario policy gives the exact requirement;
- the cohort/effective-year distinction is represented accurately;
- each populated field has a real semantic-audit row and provenance link;
- new records use valid UUIDs;
- compulsory-credit categories, optional credits, literacy, community involvement, and online learning are not incorrectly added together as if all were credit categories.

If cohort complexity cannot be represented safely in the current schema, keep the framework partial, avoid creating misleading requirement rows, and document the exact schema/research gap.

### F. Non-unified and special pathways

Following the user's standing rule, add relevant Canadian formats or pathways to `RESEARCH_GAPS.csv` instead of seeding unsupported records. At minimum evaluate and document when applicable:

- the remaining 12 provincial/territorial graduation frameworks;
- Quebec secondary credentials and CEGEP transition;
- French-language and English-language school systems where provincial rules differ;
- Indigenous-controlled/local education systems where authority and curriculum scope vary;
- IB programmes in Canadian schools;
- AP offerings in Canada;
- vocational, trades, dual-credit, and specialist programs that are provincial, board-specific, or school-specific;
- mature-student/adult-secondary credentials;
- province-specific online-learning or literacy requirements.

Do not add any of these as `partial`, `verified`, or `official` unless directly researched with exact jurisdiction scope. Do not create one national Canadian row for a non-unified program.

### G. Provenance cleanup

- Remove Canada links that use CMEC merely to support Ontario-specific details.
- Link Ontario claims only to direct Ontario authority sources.
- Add field-level sources for every retained material Canada/Ontario claim.
- Remove duplicate Canada provenance tuples.
- Remove newly added but unused Canada sources when they serve no retained record or documented gap.
- Preserve every USA and India audit/provenance row exactly.
- Keep `mapping_rules.csv` header-only.

## Required validation

Run exactly:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=CAN
```

Current baseline:

```text
country=CAN
required_material_claims=14
supported_material_claims=0
errors=14
```

The command must end with equal required/supported claims and `errors=0`. Do not edit either validator. If it fails, continue researching, correcting, clearing, downgrading, or deleting Canada claims until it passes.

Then rerun regression checks:

```bash
npm run seed:reference:check:country -- --country=USA
npm run seed:reference:check:country -- --country=IND
```

Both must remain at `errors=0`.

Do not run the live import command.

## Required final response

Return:

1. exact Canada/Ontario rows changed, added, deleted, cleared, or downgraded;
2. every real direct official URL used;
3. exact section/page/policy clause supporting each retained material field;
4. exact corrections to province versus territory types and current authority names;
5. Ontario framework/requirement rows before and after;
6. Canada semantic-audit rows before and after;
7. required/supported material-claim totals;
8. complete output and exit code from the Canada command;
9. USA and India regression outputs;
10. unresolved Canadian research gaps, including non-unified formats/tracks;
11. confirmation that no other country was edited;
12. confirmation that no database import, deployment, `.env` access, application-code edit, migration edit, package edit, or validator edit occurred.

Do not say `verified`, `ready`, `passed`, or `complete` unless the Canada command exits 0 with equal required/supported claims and `errors=0`, and both regression checks still pass.
