# Kimi repair instructions — Scholaport reference dataset

You are repairing the Gate 2 reference-data files you created in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-/supabase/seeds/
```

This is a file-repair and validation task only. Do not import into Supabase, connect with a service-role key, deploy, edit application code, read `.env*`, or change external services.

Re-read and obey:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-/KIMI_REFERENCE_DATA_RESEARCH_PROMPT.md
/Users/its_shwindy/Documents/courseport/edubridge-ai-/scripts/import-reference-data.ts
/Users/its_shwindy/Documents/courseport/edubridge-ai-/supabase/seed_templates/
```

Codex ran the authorized local dry run. The package failed and must not be described as ready until every issue below is resolved and the strict validator exits successfully.

## Corrections Codex already made — preserve them

1. `reference_record_sources.csv` now has the correct header:

```csv
id,table_name,record_id,data_source_id,field_name,notes,created_at
```

Do not change it back to `source_id` or `updated_at`.

2. In `curricula.csv`, Ontario, NSW, and Victoria now use the schema-supported `curriculum_type=state_board`. Do not restore the invalid values `province` or `state`.

## Exact mechanical/provenance failures

### 1. Broken source references

`reference_record_sources.csv` contains **25 links pointing to 11 data-source UUIDs that do not exist in `data_sources.csv`**:

```text
272a2b1d-3903-4fc1-b0a8-c5d03bd1a474
324484e9-4c23-4980-8bcd-d9b7434d106d
338f60e0-0de1-467e-9b5f-8c75543feffc
43eae618-6655-46b3-ba85-52fa7b11bea7
52885f91-21be-482f-87e7-b5836ad88e51
61292f80-0ec0-4d7f-86cf-3620fe6fd54a
923217c4-ade9-4086-bd8c-e9b63fea1010
a6b22344-0baf-4218-89d9-dce20918a048
a93bd197-bb59-4521-8935-54ceabdf49d9
ad1a9e02-793d-4e84-9a09-34c091142c4d
e93002ce-4684-4eea-8833-d81ca4dad0ab
```

For each broken link, do exactly one defensible action:

- add the missing `data_sources.csv` row using that exact UUID and a direct source that was actually opened and supports the linked claim; or
- replace the link’s `data_source_id` with an existing source UUID only when that exact existing source directly supports the claim; or
- remove/downgrade the unsupported factual record as instructed below.

Never create a source row merely to satisfy the validator. A generic authority homepage is not evidence for detailed credit, examination, course, or graduation claims.

### 2. Factual rows without any provenance link

The audit found these non-placeholder rows with no `reference_record_sources` entry:

| Table | Unsourced rows |
|---|---:|
| countries | 20 |
| jurisdictions | 3 |
| curriculum_courses | 147 |
| graduation_requirements | 10 |
| education_programs | 31 |

Total: **211 unsourced factual rows**.

Repair rules:

- **Countries:** every `partial` country profile needs direct sources linked to the exact country row, preferably field-level links for `primary_languages`, `education_system_summary`, and `grade_structure`. If you cannot directly source those fields, revert that country to `country_seed_only`, set `primary_languages=[]`, clear `education_system_summary`, and set `grade_structure={}`.
- **Three Indian jurisdictions:** a `not_verified` row still requires a source link. Add a direct official board/government source link or change to `needs_research` and ensure no unsupported factual authority/URL claims remain.
- **147 curriculum courses:** add a provenance link for every retained course using a direct official syllabus/course-catalog URL that supports that course. Do not link all courses to a generic board homepage. Delete course rows that came from memory, inference, a general curriculum description, or an unopened/unavailable syllabus. Do not keep guessed course names as `needs_research`; record missing catalogs in `RESEARCH_GAPS.csv` instead.
- **10 Ontario requirements:** use a current direct Ontario Ministry graduation-requirements source and link each retained requirement, including field-level links for numeric credits, community service, literacy, and online-learning requirements. Otherwise remove unsupported rows.
- **31 education programs:** every retained program needs an official program/regulator source proving both existence and the claimed country/jurisdiction availability scope. `ibo.org` or College Board may establish program identity but does not by itself prove availability in a particular country/state. Remove unsupported availability claims instead of downgrading invented rows.

### 3. Missing jurisdiction relationships

These subnational records incorrectly have blank `jurisdiction_id` values. Populate them with the existing jurisdiction UUIDs below:

| Jurisdiction | UUID |
|---|---|
| England | 1a0b3343-dda2-4010-8f6c-a058df1fd851 |
| Scotland | 4c3caa53-dba1-4298-a312-b2f43e354bc9 |
| Abu Dhabi | e062ea25-7d1a-49e5-9b0c-9aa8db6e0edf |
| Ontario | 6455ba12-2225-4cb9-847b-e5176ae7240f |
| New South Wales | 7bff5eea-104b-448b-8b58-d1a6aed3a890 |
| Victoria | ae0b176e-5503-463e-8569-21b5257ec9f8 |

Affected `curricula.csv` rows:

```text
792c968d-f2c1-4851-9032-5968d169f8a3  England - GCSE and A-Level
c45d24b6-58dc-49e7-96e8-9241def547c7  Scotland - National Qualifications
c281de15-6784-48e1-9ea4-9c3e8704a557  Abu Dhabi ADEK Regulated Curricula
b4fde4e9-caa4-4a6a-97cd-e584ae58c720  Ontario Secondary School Curriculum
69dfde97-d4ad-4ade-aa46-ac769caf4bbd  NSW Higher School Certificate (HSC)
1109c79b-84c5-4807-b97b-e2bc613c1d0b  Victorian Certificate of Education (VCE)
```

Affected `destination_graduation_frameworks.csv` rows:

```text
52bfe3ea-0cd1-4344-a70a-0276011f4cf3  Ontario Secondary School Diploma
16f879dc-2289-47fd-a18e-266241850f41  NSW Higher School Certificate
4f00a17a-8602-48a7-a79f-636907390e23  Victorian Certificate of Education
e6095753-16d1-4ab1-be15-3faab98c53ee  England Key Stage 4 and 5 Qualifications
87152d71-5f76-4a88-aa5f-f7a4d7c501a6  Scotland National Qualifications
```

Also audit every other curriculum/framework/program name for subnational scope and populate `jurisdiction_id` when appropriate. Do not limit the repair to this detected list.

## Source-quality repair

The generated package uses many generic homepages and marks them `official`. An official domain proves the authority exists; it does not prove every detailed claim.

For detailed rows, replace generic homepages with direct current pages or PDFs. This is especially mandatory for:

- course lists and course requirements;
- credit totals and credit units;
- mandatory subjects;
- graduation/examination requirements;
- effective years;
- program availability by country/state/province;
- compulsory-education ages and grade structures.

Do not use an authority homepage to justify a detailed curriculum summary unless the exact facts appear on that page.

Re-check `last_verified_at`. It means the exact URL was opened and reviewed on that date—not merely discovered or assumed to work.

## Semantic issues to re-audit

1. The audit report claims 34 source rows but has 11 additional source UUIDs referenced but absent.
2. `RESEARCH_AUDIT.md` claims 14 destination frameworks while the file has 13.
3. `RESEARCH_AUDIT.md` claims 100+ provenance links while the file has 75.
4. `RESEARCH_AUDIT.md` describes jurisdiction statuses as mixed partial/needs-research/not-verified, but the actual file contains 118 `needs_research`, 3 `not_verified`, and 0 `partial`.
5. Do not describe the package as containing only “verified official syllabi” while all 147 course rows lack row-level links.
6. Re-check country claims for current accuracy. For example, compulsory education and current reform statements must use current direct government evidence, not a landscape summary.
7. Re-check Georgia requirements against a current Georgia state authority. Cherokee County is a district source and cannot establish current statewide implementation beyond what it directly and accurately cites.

Update `RESEARCH_AUDIT.md` row counts and status counts from the actual final CSVs. Do not use estimates such as `~147`, `100+`, or `50+`.

## Validation sequence

After repairing the data, run from the project root:

```bash
npm run seed:reference:check
```

The command must exit with code 0 and report zero rejected rows. Do not weaken, bypass, or edit the validator to make the dataset pass.

Then perform a second semantic audit:

- every retained factual row has a direct supporting source;
- source scope matches record jurisdiction;
- no source is used beyond what it states;
- no inferred mappings or course lists exist;
- all subnational rows use the correct jurisdiction ID;
- all counts in `RESEARCH_AUDIT.md` equal actual parsed CSV row counts.

## Required final response

Return:

1. exact files changed;
2. exact final row count per file;
3. exact number of rows removed, downgraded, newly sourced, and linked;
4. exact number of official/high/medium/low/unverified sources;
5. validator command and complete summary;
6. remaining research gaps;
7. confirmation that no database import, deployment, environment access, or application-code edits occurred.

Do not claim “ready for import” unless the validator passes and the semantic audit above is complete. Stop before any live import.
