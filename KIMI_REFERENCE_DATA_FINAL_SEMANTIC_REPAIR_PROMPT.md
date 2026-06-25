# Scholaport reference data — final full semantic research and repair

You are working in Kimi Work/Agent Mode with access to this repository:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

This is the final evidence audit and repair pass for Scholaport's global education reference seed data. Previous passes achieved mechanical CSV validity but did **not** establish that every retained factual claim is supported by a direct, current, scope-matched source.

Do not ask for another intermediate approval or gate. You are authorized to research and repair the allowed reference-data files in one uninterrupted run. Continue until the mechanical validator passes and the semantic completion criteria in this prompt are satisfied.

## Non-negotiable safety boundaries

You may research the public web and edit only the reference-data seed/audit files listed below.

Do **not**:

- connect to Supabase or any database;
- import any seed data;
- deploy anything;
- read, print, copy, or modify `.env`, `.env.local`, `.env.production.local`, `.env.seed.local`, or any secret/key file;
- edit application code, migrations, package files, the validator, generated route files, or deployment configuration;
- weaken or bypass validation;
- create mapping/equivalency rules from inference;
- use Wikipedia, blogs, AI summaries, commercial credential-evaluation sites, search-result snippets, or third-party aggregators as factual authority;
- describe the package as production-ready or comprehensive.

Keep `mapping_rules.csv` header-only unless a current official government/issuing-authority document explicitly states a cross-system equivalency. Do not infer equivalencies from similar course names.

## Read these files before doing anything else

Read completely:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-/KIMI_REFERENCE_DATA_RESEARCH_PROMPT.md
/Users/its_shwindy/Documents/courseport/edubridge-ai-/KIMI_REFERENCE_DATA_REPAIR.md
/Users/its_shwindy/Documents/courseport/edubridge-ai-/scripts/import-reference-data.ts
/Users/its_shwindy/Documents/courseport/edubridge-ai-/RESEARCH_AUDIT.md
/Users/its_shwindy/Documents/courseport/edubridge-ai-/RESEARCH_GAPS.csv
/Users/its_shwindy/Documents/courseport/edubridge-ai-/supabase/seed_templates/README.md
```

Read every CSV in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-/supabase/seeds/
```

Use the files in `supabase/seed_templates/` as the exact schema contract. Preserve all existing stable UUIDs for retained records. Never regenerate country UUIDs.

## Files you may edit

```text
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
RESEARCH_AUDIT.md
RESEARCH_GAPS.csv
```

Also create this evidence file:

```text
SEMANTIC_SOURCE_AUDIT.csv
```

It must have exactly this header:

```csv
country_iso3,table_name,record_id,record_name,field_name,claim_summary,source_url,source_authority,source_section_or_page,direct_support,scope_match,current_as_of_2026_06_22,action_taken,notes
```

Allowed values:

- `direct_support`: `yes`, `partial`, `no`, `not_applicable`
- `scope_match`: `yes`, `partial`, `no`, `not_applicable`
- `current_as_of_2026_06_22`: `yes`, `unclear`, `no`
- `action_taken`: `kept`, `corrected`, `cleared_field`, `downgraded`, `deleted`, `moved_to_research_gap`

Create one audit row for every material factual field or tightly related claim group that you inspect. Include the direct URL and the exact page, section, heading, table, or document clause that supports the claim. A statement such as "official homepage confirms this" is not sufficient.

## Why the previous pass is not accepted

The local validator currently passes because it verifies headers, types, relationships, UUIDs, and the existence of at least one provenance link. It cannot determine whether the source actually says what the CSV claims.

The current package has these systematic problems:

1. All 20 `countries.csv` rows are `partial`, but each country has only one provenance link and that link covers only `education_system_summary`. The populated `primary_languages` and `grade_structure` fields do not have claim-level sources.
2. Several country summaries are linked to an authority with narrower scope than the country. Examples: the United States profile is linked to one Georgia school district; Bangladesh is linked to a technical education board; India is linked to CBSE even though CBSE is only one board.
3. Most curricula, graduation frameworks, and education programs use a ministry/authority homepage. An official homepage proves the organization exists; it does not prove a detailed course list, credit total, required examination, effective year, or availability scope.
4. `reference_record_sources.csv` contains 11 duplicate provenance tuples for the 11 Georgia requirement rows.
5. Current Georgia rows are factually inconsistent: the CSV's numeric requirement rows total 24 credits while the official statewide rule totals 23. The statewide rule combines CTAE and/or Modern Language/Latin and/or Fine Arts into one 3-unit category and combines Health and Physical Education into one 1-unit category. The current CSV incorrectly splits alternatives into simultaneous requirements and includes a statewide Community Service/Civics requirement not present in the rule.
6. The CBSE source URL is for an older curriculum page. The current official academic-year page is 2026-27.
7. Ontario, NSW, Victoria, England, Scotland, France, UAE, Saudi Arabia, Spain, and Italy retain detailed framework claims linked only to broad homepages or collections rather than the direct framework/rule pages.
8. Several `education_programs` rows describe ordinary qualifications as advanced programs or claim local availability using sources that do not establish that scope.

Do not merely change statuses or add more links. Verify or remove each claim.

## Universal evidence rules

Apply these rules to every country and table.

### 1. Direct source rule

For detailed claims, use the direct current source from the government, ministry, curriculum authority, examination board, qualification regulator, or issuing authority. Use the exact curriculum page, syllabus PDF, law, regulation, qualification specification, graduation-requirements page, or official data table.

A generic homepage, navigation page, press homepage, or authority landing page is not enough unless the exact claim is visibly stated on that page.

### 2. Scope rule

The source's legal/administrative scope must match the record:

- a school or district source cannot establish a statewide or national requirement;
- a national coordinating body cannot establish province/state-specific requirements unless it directly republishes the issuing authority's rule;
- a national curriculum authority cannot establish a state senior-secondary certificate controlled by a separate state authority;
- one exam board cannot be used as the source for an entire country's decentralized system;
- a program owner's global page cannot prove that the program is available in a specific jurisdiction.

### 3. Current-date rule

Research the rules that are current on **2026-06-22**. Record academic year, effective year, revision date, and cohort applicability when relevant. Do not reuse archived pages as current evidence. If only an archived rule is available, label that limitation and do not present it as current.

### 4. Claim-level provenance rule

Use `reference_record_sources.field_name` for material claims whenever one source does not directly support the entire row. At minimum, separately source populated high-risk fields:

- countries: `primary_languages`, `education_system_summary`, `grade_structure`;
- curriculum courses: `course_code`, `course_name_english`, `grade_level`, `is_required`, `is_exam_based`, `credits_estimated`, `learning_outcomes_summary` when populated;
- graduation frameworks: `credential_awarded`, `grade_range`, `total_credits_required`, `credit_unit_name`, `has_state_or_national_exams`, `exam_notes`, `effective_year`;
- graduation requirements: `credits_required`, `specific_courses`, `notes`, `requirement_type`;
- education programs: `description`, `availability_scope`, `jurisdiction_id`.

A row-level provenance link with blank `field_name` is allowed only when the direct source clearly supports the complete retained row.

### 5. Unsupported-field rule

If the direct source verifies a record's existence but not a populated optional field, clear that optional field. Do not keep the unsupported detail merely by setting `coverage_status=partial`.

Use nullable fields honestly:

- use blank/null for unknown booleans instead of guessing `true` or `false`;
- clear estimated credits unless the source defines them;
- clear course codes unless the official catalog shows them;
- clear examination claims unless the official rule states them;
- clear effective years unless documented.

### 6. Status rule

- `official`: use only when a current issuing authority directly supports every material retained field.
- `verified`: use only when every material retained field is directly supported by official/high-reliability sources and scope is exact.
- `partial`: some directly supported facts are retained, unsupported optional fields are empty, and limitations are recorded.
- `not_verified`: the record is a candidate but current direct evidence is insufficient. It must not contain detailed claims presented as fact.
- `needs_research`: a placeholder/discovery row only. Remove unsupported authority, URL, framework, course, and rule claims.
- `country_seed_only`: use for a country when detailed country facts cannot be directly sourced. Set `primary_languages=[]`, `education_system_summary` blank, and `grade_structure={}`.

The publisher being an official authority does not automatically make the record's `coverage_status=official`.

### 7. No silent deletion

Every deleted or downgraded record must be added to `RESEARCH_GAPS.csv` if the missing information still matters. Include the country, area, jurisdiction, exact missing fact, why evidence was insufficient, sources attempted, and recommended next source.

### 8. Duplicate and consistency rules

- Remove exact duplicate provenance tuples: same `table_name`, `record_id`, `data_source_id`, and `field_name`.
- Numeric graduation requirement totals must reconcile with the framework total while respecting alternatives and double-count rules.
- Alternative requirements must be represented as alternatives in notes or grouped requirements, not added together as simultaneous obligations.
- A course cannot be marked required/exam-based merely because it appears in a catalog.
- A university entrance examination is not automatically a secondary-school graduation examination.
- A state assessment is not automatically a diploma-passing requirement.
- National curriculum coverage must not be confused with local credential-awarding rules.

## Required country-by-country audit

Audit **all 20 countries**. Do not stop after India/CBSE and Georgia.

### Source/emigration countries

#### India (IND)

- A CBSE page cannot support the complete Indian national education-system profile.
- Replace the archived CBSE curriculum URL with the current official **2026-27** curriculum and direct subject/syllabus pages.
- Verify CBSE IX-X and XI-XII subjects, codes, required/optional status, and assessment claims separately. Clear any field not shown in the source.
- Audit CISCE and NIOS curricula using current direct official regulations/syllabi, not homepages.
- Maharashtra, Tamil Nadu, and Uttar Pradesh board rows may remain `needs_research` unless direct current board evidence is obtained.
- Do not imply the three seeded state boards represent all Indian state boards.

#### China (CHN)

- The 2022 Compulsory Education Curriculum Programme may support a national curriculum, but verify each retained subject-by-grade row and every `is_required`/`is_exam_based` claim against the document itself.
- Do not infer exact grade placement from a national subject list if the source does not specify it.
- Separate compulsory education curriculum from provincial upper-secondary/Gaokao variation.
- Do not call Gaokao a single uniform national graduation framework.

#### Mexico (MEX)

- Replace generic SEP/SEMS pages with direct current Plan de Estudio, Marco Curricular Comun, Bachillerato, or qualification documents.
- Verify whether general, technological, and professional-technical pathways are national, subsystem-specific, or state-specific.
- CONALEP claims require a direct CONALEP study-plan/program source, not only a general SEMS page.

#### Philippines (PHL)

- Verify the curriculum current in 2026, including MATATAG/revised K-12 implementation timing and any Senior High School changes.
- Use direct DepEd curriculum guides/orders for Junior High and Senior High tracks.
- TESDA claims require direct qualification/training-regulation evidence and exact scope.
- Do not retain Sports, Arts, TVL, or Academic track details from memory.

#### Pakistan (PAK)

- FBISE cannot support the full decentralized national profile or provincial BISE systems.
- Use federal and relevant provincial authority sources to distinguish national curriculum policy, FBISE, provincial boards, SSC/HSSC, and vocational systems.
- Keep provincial systems as research gaps unless direct board curricula are obtained.

#### Bangladesh (BGD)

- BTEB is a technical board and cannot support the entire national education profile.
- Obtain direct NCTB/general education board evidence for national/general curriculum claims.
- Keep BTEB and Madrasah systems separately scoped with direct official evidence.
- Do not imply technical or Madrasah curricula represent general secondary education.

#### Ukraine (UKR)

- Use current MoES/UCEQA sources for grade structure, New Ukrainian School transition, credentials, and examinations.
- Check whether EIA/ZNO wording is current or whether NMT/current emergency arrangements apply in 2026.
- Distinguish implemented rules from future reform schedules and wartime temporary arrangements.

#### Russia (RUS)

- Use direct current federal standards/orders for FGOS, basic and secondary general education, OGE/EGE, and SPO.
- A ministry homepage alone cannot support course, credential, examination, or grade-structure details.
- Record regional variation without inventing regional curricula.

#### Egypt (EGY)

- Verify grade structure, Thanaweya Amma, technical pathways, Al-Azhar separation, examination rules, and 2024/2025 reform claims with direct current official decisions/documents.
- Do not present proposed reforms as implemented.
- Use Arabic official sources when necessary and record the original title plus an accurate English summary.

#### Nigeria (NGA)

- Use direct NERDC curriculum documents and direct WAEC/NECO/NABTEB specifications for their respective scopes.
- A ministry, NECO, or NABTEB homepage cannot support the entire national profile.
- Verify current implementation status of announced curriculum reforms before retaining dates or subject reductions.
- Keep WAEC, NECO, NABTEB, general curriculum, and technical programs distinct.

### Destination/immigration countries

#### United States (USA)

- Source the country-level decentralized-system statement from a federal/official national source, not Cherokee County.
- Retain 50 states plus DC as `needs_research` jurisdictions only if their existence/names are sourced from an official federal/state directory; otherwise add the missing jurisdiction source gap.
- Replace the Cherokee County source for statewide Georgia claims with the current official Georgia State Board/GaDOE rules.
- Correct Georgia Rule 160-4-2-.48 exactly: 23 total units; 4 ELA; 4 Math; 4 Science; 3 Social Studies; 3 combined CTAE and/or Modern Language/Latin and/or Fine Arts; 1 combined Health and Physical Education; 4 Electives. Preserve the rule's fourth-science double-count note. Do not add a statewide community-service requirement.
- Audit current Rule 160-3-1-.07 separately. Do not equate taking Georgia Milestones/EOC assessments with a universal pass-to-graduate requirement unless the current rule explicitly says so.
- AP availability requires correct College Board/state evidence; Georgia Dual Enrollment requires its direct official state program page. Do not source either from a district graduation page.
- Keep the other 49 states and DC without detailed frameworks until direct state sources are researched.

#### Germany (DEU)

- KMK may support national coordination and common agreements, but not individual Land curricula.
- Verify the Abitur/common upper-secondary framework using the current direct KMK agreement/resolution.
- Keep all 16 Lander curricula/frameworks as `needs_research` until their own ministry sources are obtained.
- Record G8/G9 and school-type variation only where directly supported.

#### Saudi Arabia (SAU)

- Replace the ministry homepage with direct current curriculum/pathway/credential/assessment documents.
- Verify whether "Tawjihiyah," scientific/literary tracks, unified national examinations, and grade structure are current terminology/rules in 2026.
- TVTC programs require direct TVTC evidence rather than a Ministry of Education homepage.

#### United Kingdom (GBR)

- Treat England, Scotland, Wales, and Northern Ireland as separate education jurisdictions.
- A DfE England national-curriculum collection cannot support a UK-wide profile or Scottish/Welsh/Northern Irish claims.
- Use direct Ofqual/DfE qualification pages for England, direct current Scottish authority/specifications for Scotland, Qualifications Wales for Wales, and CCEA/Department of Education NI for Northern Ireland.
- GCSE and A-Level are qualifications, not generic "advanced programs." Model them in curricula/frameworks unless the schema has a defensible program use.
- BTEC claims require direct current qualification-regulator/awarding-body evidence and must not be sourced to the national-curriculum collection.

#### United Arab Emirates (ARE)

- Separate federal MOE public-school curriculum/credential rules from emirate regulators and international private-school curricula.
- Use direct MOE assessment/graduation documents for Thanaweya/secondary certificate claims.
- Use direct ADEK/KHDA/SPEA rules for emirate-specific private-school claims.
- Do not generalize an emirate or public-school rule to every UAE school.

#### France (FRA)

- Replace the ministry homepage with direct current official pages/decrees for college, lycee, Baccalaureat General/Technologique/Professionnel, examinations, and reform dates.
- Verify exact grade mapping, pathways, examination status, and effective years.
- Do not retain counts of specialties/series unless a current official source states them.

#### Canada (CAN)

- CMEC can support the decentralized provincial/territorial structure but cannot support Ontario's detailed OSSD rules.
- Use a direct current Ontario Ministry graduation-requirements page for the OSSD framework and each numeric/assessment/community/online-learning claim, or delete/downgrade those fields.
- Keep the other 12 provinces/territories as `needs_research` until their own ministry frameworks are obtained.
- Do not imply a national Canadian graduation framework exists.

#### Australia (AUS)

- ACARA supports the Australian Curriculum within its scope, not state senior-secondary certificates.
- NSW HSC requires direct NESA sources; VCE/VCE-VM requires direct VCAA sources; SACE/VET requires direct SACE Board sources.
- Verify subject, examination, ATAR, certification, and VET claims separately. ATAR is an admissions rank, not the certificate itself.
- Keep unresearched states/territories as `needs_research` without detailed framework claims.

#### Spain (ESP)

- Use direct current national laws/royal decrees and ministry pages for ESO and Bachillerato under LOMLOE.
- Separate secondary-school completion/graduation from EBAU university-access assessment.
- Verify `has_state_or_national_exams` carefully; a university entrance exam is not a leaving exam.
- Autonomous-community curricula need their own authority sources; the national minimum framework does not prove every regional implementation detail.

#### Italy (ITA)

- Use direct current MIM pages/decrees for lower/upper secondary structure, Licei, technical/professional institutes, and Esame di Stato.
- Verify grade ranges, credential terminology, exam rules, and current year.
- IeFP is regional; do not mark a national or generic availability scope without direct regional/national framework evidence.

## Required repair workflow

### Phase 1 — Freeze and inspect

1. Record current row counts and status counts for every seed CSV.
2. Record duplicate provenance tuples.
3. Build an inventory of every populated factual field and its linked source.
4. Do not rely on `RESEARCH_AUDIT.md` counts; compute counts by parsing the CSVs.

### Phase 2 — Research and evidence audit

1. Open every source URL used by a retained `partial`, `verified`, or `official` record.
2. Confirm the page exists and inspect its actual content.
3. Search official issuing-authority sites for direct current replacements.
4. Populate `SEMANTIC_SOURCE_AUDIT.csv` as you work.
5. For non-English sources, retain the original official title and add a careful English summary; do not substitute an English third-party source.

### Phase 3 — Repair

For each claim:

- keep and link it if directly supported;
- correct it if the official source contradicts it;
- clear the unsupported optional field if the record itself is valid;
- downgrade the record if only limited facts remain;
- delete it and move it to `RESEARCH_GAPS.csv` if no defensible factual record remains.

Update `data_sources.csv` with direct URLs and accurate metadata. A `last_verified_at` date means the exact page was opened and reviewed on that date.

Update `reference_record_sources.csv` with exact field-level links where necessary. Preserve stable UUIDs for retained rows and use new valid UUIDs only for genuinely new source/link records.

### Phase 4 — Validation and consistency

Run from:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

Command:

```bash
npm run seed:reference:check
```

It must exit with code 0. Do not edit `scripts/import-reference-data.ts`.

Then independently check:

1. no duplicate provenance tuples;
2. no missing foreign keys;
3. no `partial`, `verified`, or `official` factual row without direct evidence for every retained material claim;
4. every field-level link points to a source that actually states that field's claim;
5. source country/jurisdiction scope matches the record;
6. every exact graduation-credit total reconciles with its requirement rows and alternative/double-count rules;
7. no entrance exam is mislabeled as a graduation exam;
8. no program availability is inferred;
9. no archived academic-year source is represented as current;
10. all counts in `RESEARCH_AUDIT.md` exactly match parsed CSVs.

## Semantic completion criteria

You may report completion only when all of these are true:

- All 20 country rows have either direct claim-level sources for their populated profile fields or have been honestly reduced to `country_seed_only`.
- Every retained detailed curriculum/course/framework/requirement/program row has direct current scope-matched evidence.
- Generic homepages are not used to support facts they do not state.
- The current CBSE academic-year source is used.
- Georgia is corrected against the direct current state rules.
- All 11 duplicate Georgia provenance tuples are removed.
- Decentralized countries are not represented as having national graduation rules that do not exist.
- `mapping_rules.csv` contains no inferred equivalencies.
- `SEMANTIC_SOURCE_AUDIT.csv` makes the result independently auditable.
- The validator exits 0 without modification.

If full detailed coverage for a country cannot be verified in this pass, that is acceptable. Preserve the country seed, downgrade/clear unsupported details, and document the exact gap. Honest limited coverage is required; invented completeness is forbidden.

## Required final response

Return one final report only after the work is complete. Include:

1. exact files changed;
2. exact before/after row count and status count per CSV;
3. a 20-country matrix showing, for each country:
   - country-profile evidence status;
   - jurisdictions retained;
   - curricula retained;
   - course rows retained;
   - graduation frameworks/requirements retained;
   - programs retained;
   - direct source count;
   - remaining gaps;
4. every record deleted, corrected, cleared, or downgraded, grouped by country and table;
5. every generic/outdated source replaced and its direct replacement URL;
6. duplicate provenance count before and after;
7. exact source reliability counts;
8. the complete `npm run seed:reference:check` summary and exit code;
9. any semantic limitation that remains;
10. explicit confirmation that no database import, deployment, environment-file access, application-code edit, migration edit, validator edit, or external service mutation occurred.

Do not say "all sources are official," "semantic audit passed," "ready for import," or "complete coverage" without the evidence matrix required above. Stop before any database import.
