# Kimi Work prompt — repair and verify USA/Georgia only

Work in this repository:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

Use **one Agent**, not Agent Swarm. This task covers only the United States country profile and the existing Georgia MVP records. Do not research or modify another country in this run. Do not claim global completion.

You are authorized to research official public sources and edit only the USA/Georgia-related rows in the allowed reference CSV/audit files. Complete the research, repair, and country-scoped validation in one uninterrupted run. Do not ask for intermediate approval.

## Forbidden actions

Do not:

- connect to or import into Supabase;
- deploy anything;
- read or modify `.env*` files;
- edit application code, migrations, package files, or validation scripts;
- edit another country's records;
- use search-result snippets, AI summaries, Wikipedia, blogs, commercial credential evaluators, or generic homepages as evidence for detailed claims;
- invent URLs, authorities, page titles, sections, rules, programs, course names, credit values, or examination requirements;
- use placeholder text such as `Direct official education sources`;
- claim success merely because the mechanical CSV portion passes.

## Read first

Read completely:

```text
KIMI_REFERENCE_DATA_FINAL_SEMANTIC_REPAIR_PROMPT.md
scripts/import-reference-data.ts
scripts/validate-semantic-reference-audit.ts
supabase/seeds/countries.csv
supabase/seeds/jurisdictions.csv
supabase/seeds/curricula.csv
supabase/seeds/destination_graduation_frameworks.csv
supabase/seeds/graduation_requirements.csv
supabase/seeds/education_programs.csv
supabase/seeds/data_sources.csv
supabase/seeds/reference_record_sources.csv
SEMANTIC_SOURCE_AUDIT.csv
RESEARCH_AUDIT.md
RESEARCH_GAPS.csv
```

## Exact records in scope

Country:

```text
USA country id: 73904546-ad7a-49ec-9727-64dafe4918e0
```

Jurisdiction:

```text
Georgia id: 8380fd4a-225c-40ac-a5a8-9af5c9bc1331
```

Detailed records:

```text
Georgia curriculum: 10de8287-b036-4c78-b0ee-8dfd429fa464
Georgia graduation framework: 9708173e-64db-49c5-b83e-721677ef90de
AP program: f586d0da-bcd8-4c24-9e38-31e621758747
Dual Enrollment program: 358c7d8e-369e-4f08-9499-e31f315121b6
```

Georgia requirement records currently associated with framework `9708173e-64db-49c5-b83e-721677ef90de` are also in scope.

The other 49 states and District of Columbia must remain `needs_research`. Do not create their curricula, frameworks, requirements, programs, or mappings in this run.

## Mandatory evidence standard

For every populated material field retained as `partial`, `verified`, or `official`, add a row to `SEMANTIC_SOURCE_AUDIT.csv` containing:

1. the real direct `http://` or `https://` URL;
2. the real issuing authority;
3. exact document title;
4. exact page number, section, heading, table, paragraph, or rule clause;
5. a concise summary of the specific field claim;
6. `direct_support=yes` only when the opened source explicitly supports it;
7. `scope_match=yes` only when the source has the correct national or Georgia scope;
8. `current_as_of_2026_06_22=yes` only after checking current applicability;
9. `action_taken=kept` or `corrected`.

The URL must also exist as an exact `source_url` in `data_sources.csv`. The validator checks this.

Do not put a source URL only in `SEMANTIC_SOURCE_AUDIT.csv`. Add the corresponding `data_sources.csv` record and `reference_record_sources.csv` field-level link.

If evidence supports the existence of a record but not an optional field, clear the optional field. If the record cannot be directly supported, downgrade or delete it and add the exact gap to `RESEARCH_GAPS.csv`.

## Required research and repairs

### A. United States country profile

Research each populated field separately:

- `primary_languages`
- `education_system_summary`
- `grade_structure`

Use appropriate direct federal sources such as the U.S. Department of Education, NCES, Census, official federal law, or official government statistical documentation. One Georgia district cannot source the country profile.

Important cautions:

- The United States has no single national curriculum or national graduation requirement.
- K-5 / 6-8 / 9-12 organization is not completely uniform across every district. If the source does not support that exact nationwide structure, make `grade_structure` more qualified or clear it.
- Do not describe English as a federal official language unless a current federal source explicitly establishes that claim. If `primary_languages=["English"]` cannot be supported under this schema's intended meaning, clear it rather than guessing.
- Replace the current country provenance link to Cherokee County with correct national-scope sources.

Delete and replace the three existing fake USA rows in `SEMANTIC_SOURCE_AUDIT.csv` that use `source_url=Direct official education sources` or authorities such as `United States Ministry of Education`.

### B. Georgia jurisdiction and authority

Confirm the jurisdiction name, code, authority name, and official authority URL. Use the correct official authority name; do not automatically retain `Georgia State Department of Education` if the official name is `Georgia Department of Education`.

The 50-state/DC discovery rows remain `needs_research`; they are not required to receive detailed semantic audit rows in this run.

### C. Georgia graduation framework

Use the current direct Georgia State Board/GaDOE sources, including:

```text
https://apps.gadoe.org/peaboardrules
https://apps.gadoe.org/sboe/SBOE%20Rules/160-4-2-.48.pdf
```

Verify every populated framework field separately:

- `framework_name`
- `credential_awarded`
- `grade_range`
- `total_credits_required`
- `credit_unit_name`
- `has_state_or_national_exams`
- `exam_notes`
- `effective_year`

Rule 160-4-2-.48 supports a minimum total of 23 units and defines a unit, but do not assume it proves every current examination statement.

Open and review the current Rule 160-3-1-.07 directly. Determine whether it requires assessment participation, a passing score for diploma issuance, or something else for the relevant cohort. A Georgia Milestones/EOC assessment is not automatically a pass-to-graduate examination. If the current source does not justify `has_state_or_national_exams=true` under the schema's meaning, set it to blank/null and rewrite or clear `exam_notes`.

### D. Georgia graduation requirements

Verify and audit every populated field for every retained requirement row.

The statewide category totals in Rule 160-4-2-.48 are:

- English/Language Arts: 4
- Mathematics: 4
- Science: 4
- Social Studies: 3
- CTAE and/or Modern Language/Latin and/or Fine Arts combined: 3
- Health and Physical Education combined: 1
- Electives: 4
- Total minimum: 23

Preserve the fourth-science double-count note exactly where supported.

Correct remaining problems:

- The current English row says `Tenth Grade Literature/Composition II`; Rule 160-4-2-.48 instead identifies American Literature/Composition and Ninth-Grade Literature/Composition. Use the exact current rule/course-list wording.
- Verify current mathematics course names. Do not keep historical GPS/GSE names as current unless the active rule/course list supports them for the applicable cohort.
- Verify every item in `specific_courses`; remove names that are inferred, obsolete, or not directly supported.
- The 3-unit CTAE/language/fine-arts category is an alternative combined category, not three CTAE units required of every student. Give the row a neutral subject-category name that accurately represents the combined choice.
- Health and Physical Education is one combined unit; label it accurately.
- Do not retain a separate `Exam` graduation requirement unless the current assessment rule directly establishes a diploma requirement. Otherwise delete that requirement and document why.

Ensure requirement totals and alternative/double-count logic reconcile with the 23-unit framework.

### E. Georgia curriculum record

The curriculum record currently cites a Cherokee County district page and generic GaDOE homepage. Replace them with direct state sources that support each populated field.

Verify:

- record name;
- curriculum type;
- level;
- grade range;
- authority;
- website URL;
- description.

Do not call the graduation rule a complete Georgia course curriculum. If no direct current state curriculum/course-list source is available, narrow the record description, clear unsupported fields, downgrade it, or remove it.

### F. AP and Georgia Dual Enrollment

For AP:

- College Board may establish AP program identity, but a generic College Board homepage does not prove statewide Georgia availability or that AP automatically satisfies specific graduation requirements.
- Obtain a direct current Georgia/College Board source that supports every retained Georgia-specific claim, or clear/delete unsupported claims.

For Dual Enrollment:

- Use the direct current official Georgia program page from the responsible Georgia authority.
- Verify simultaneous high-school/college credit, eligibility, funding/tuition language, level, and statewide availability separately.
- A generic `gadoe.org` homepage is not evidence.

### G. Provenance cleanup

- Remove every USA/Georgia provenance link that uses Cherokee County for a national or statewide claim outside the district source's scope.
- Keep the direct Georgia state rule source record with its existing UUID when accurate.
- Add exact field-level links for every retained material claim.
- Remove duplicate USA/Georgia provenance tuples.
- Do not delete another country's source or link.

## Required validation

Run exactly:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=USA
```

The command must exit with code 0. It runs both the mechanical validator and the new country-scoped semantic validator.

Do not edit either validator to make it pass.

If it fails, read each rejection and continue researching, correcting, clearing, downgrading, or deleting USA/Georgia claims until it exits 0.

Do not run the live import command.

## Required final response

Return:

1. exact USA/Georgia rows changed, deleted, or downgraded;
2. every actual direct official URL used;
3. exact section/page/clause supporting every retained material field;
4. number of USA semantic audit rows before and after;
5. number of USA material claims required and supported;
6. complete output and exit code from `npm run seed:reference:check:country -- --country=USA`;
7. unresolved USA/Georgia gaps;
8. confirmation that no other country was edited;
9. confirmation that no database import, deployment, `.env` access, application-code edit, migration edit, package edit, or validator edit occurred.

Do not say `verified`, `ready`, `passed`, or `complete` unless the country-scoped command exits 0 with `supported_material_claims` equal to `required_material_claims` and `errors=0`.
