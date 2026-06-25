You are working inside the existing Scholaport repository.

Your job is to audit the unfinished Codex work and then finish the United States destination academic-framework foundation for MVP 1.

Do not start from scratch.
Do not ignore existing work.
Do not begin India yet.
Do not work on Germany, Saudi Arabia, UK, UAE, OCR, AI/RAG, Pori, transcript conversion, roadmap generation, counselor packets, mobile, deployment, or MVP 2.

This task is only:
AUDIT CURRENT U.S. WORK -> FIX/COMPLETE U.S. DESTINATION FRAMEWORK DATA -> VALIDATE ONBOARDING.

Important product context:
Scholaport is building a student-owned academic passport for international students transferring into U.S. high school. The app must know the student’s destination state/DC, expected graduation year, current grade at transfer, diploma/pathway, and applicable state graduation framework.

The previous Codex work partially completed the foundation:
- All 50 states + DC are now selectable.
- DC is modeled as a federal_district.
- Georgia no longer leaks as a fallback framework for other states.
- Georgia is still the only detailed graduation framework.
- The other 49 states + DC still need official detailed graduation-framework research.
- Strict U.S. validation intentionally fails because 50 jurisdictions are missing detailed frameworks.
- India must not begin until the U.S. strict validator passes.

Current known state:
- Georgia has one partial detailed framework:
  - 23 total units
  - English/Language Arts: 4
  - Mathematics: 4
  - Science: 4
  - Social Studies: 3
  - CTAE / World Language / Fine Arts: 3
  - Health & PE: 1
  - Electives: 4
  - EOC assessment participation row
- Georgia currently references “students entering 9th grade in 2008-09 and subsequent.”
- That is not enough by itself. Scholaport must support transfer students entering grade 9, 10, 11, or 12 from another country.
- The database must support expected graduation year and transfer grade, not just one old cohort phrase.

First: audit the repo
Before editing, inspect the current working tree and read all relevant files.

Read these if they exist:
- US_ACADEMIC_FRAMEWORK_MODEL.md
- US_STATE_COVERAGE.csv
- US_STATE_VALIDATION_REPORT.md
- US_ONBOARDING_E2E_REPORT.md
- SCHOLAPORT_REFERENCE_FOUNDATION_PROGRESS_REPORT.md
- SCHOLAPORT_LIVE_REFERENCE_IMPORT_REPORT.md
- RESEARCH_GAPS.csv
- RESEARCH_AUDIT.md
- supabase/migrations/*
- supabase/seeds/jurisdictions.csv
- supabase/seeds/data_sources.csv
- supabase/seeds/destination_graduation_frameworks.csv
- supabase/seeds/graduation_requirements.csv
- supabase/seeds/education_programs.csv
- supabase/seeds/reference_record_sources.csv
- scripts/import-reference-data.ts
- scripts/validate-us-reference-foundation.ts
- src/lib/reference-api.ts
- src/lib/scholaport-api.ts
- src/lib/mvp-reference-scope.ts
- src/routes/onboarding.tsx
- src/routes/profile.tsx
- tests/us-reference-foundation.test.ts
- any other reference/onboarding/profile tests

Run:
- git status
- npm test -- --run
- npm run seed:reference:check -- --country=USA
- node --experimental-strip-types scripts/import-reference-data.ts --dry-run
- node --experimental-strip-types scripts/import-reference-data.ts --dry-run --mvp-safe
- node --experimental-strip-types scripts/validate-us-reference-foundation.ts --require-complete
- npm run typecheck
- npm run lint
- npm run build

Audit requirements:
Create/update a clear audit section in US_STATE_VALIDATION_REPORT.md before continuing.

The audit must identify:
1. Which states/DC already have detailed frameworks.
2. Which states/DC are still identity-only/selectable-only.
3. Which framework rows lack source provenance.
4. Which requirement rows lack source provenance.
5. Whether any state uses Georgia’s framework incorrectly.
6. Whether any framework is too cohort-specific and not usable for transfer students.
7. Whether onboarding captures:
   - destination country
   - destination state/DC
   - expected graduation year
   - grade_at_transfer
   - destination framework
8. Whether stale state/framework/program selections clear correctly.
9. Whether reference coverage honestly reports partial vs complete status.

Core product requirement:
Scholaport must support students transferring into U.S. high school from another country during:
- grade 9
- grade 10
- grade 11
- grade 12

The database must support:
- selected U.S. state/DC
- expected graduation year
- grade_at_transfer
- applicable framework effective years
- applicable cohort years where states use cohort language
- diploma type/pathway
- state-level requirements
- local/district/school override notes
- transfer-student notes
- international-transfer/counselor-review notes
- future comparison between completed foreign credits and remaining required credits

Do not implement transcript conversion yet.
Only make the reference database and onboarding model ready for that future work.

Important academic modeling rule:
Do not create a fake national U.S. graduation framework.

The correct Scholaport model is:
United States
-> state/DC jurisdiction
-> state graduation framework
-> diploma/pathway/program if applicable
-> subject/credit requirements
-> assessment/non-course requirements
-> transfer/local-control notes
-> source/provenance

Georgia must never appear as a fallback for any other state.

Research task:
Research official public sources and complete the detailed graduation-framework data for all 50 states + DC.

For every state/DC, add or update a detailed destination_graduation_frameworks row for the standard public high school diploma or the official state/local-control framework.

For each state/DC collect, where officially available:
1. Official education authority name
2. Official graduation requirements source URL
3. Official statutory/admin-code/source URL if relevant
4. Framework name
5. Credential awarded
6. Diploma type
7. Pathway type if applicable
8. School sector/scope, usually public high school
9. Authority level:
   - state
   - district/local
   - state minimum plus local additions
10. Effective start year
11. Effective end year if applicable
12. Cohort start year if applicable
13. Cohort end year if applicable
14. Graduation year start if applicable
15. Graduation year end if applicable
16. Credit/unit system:
   - credits
   - units
   - Carnegie units
   - years
   - local units
   - competency-based
17. Total credits/units required if state-defined
18. Subject requirements:
   - English/Language Arts
   - Mathematics
   - Science
   - Social Studies
   - U.S. History
   - World History
   - Civics/Government
   - Economics
   - World Language
   - Fine Arts/Arts
   - Career/Technical/CTE/CTAE
   - Health
   - Physical Education
   - Technology/Computer Science
   - Financial Literacy/Personal Finance
   - Electives
   - Local/district-required credits
19. Specific required courses where official:
   - Algebra I
   - Geometry
   - Biology
   - U.S. History
   - Government
   - Economics
   - Civics
   - Personal Finance
   - state-specific required courses
20. Assessment requirements:
   - end-of-course exams
   - exit exams
   - state tests
   - civics exam
   - participation-only requirements
   - substitute/waiver pathways
21. Non-course graduation requirements:
   - CPR
   - FAFSA/completion requirement
   - financial literacy
   - service learning
   - graduation project
   - career plan
   - portfolio
   - work-based learning
   - other official requirements
22. Transfer student rules:
   - out-of-state transfer
   - international/foreign transfer if mentioned
   - students entering during grade 9/10/11/12
   - local credit evaluation
   - district equivalency determination
   - waiver/exception rules
23. Local-control notes:
   - districts may add requirements
   - state sets minimum only
   - local board determines equivalencies
   - local board determines course placement
24. Course catalog/course-code status:
   - statewide course catalog exists
   - statewide course code list exists
   - state standards only
   - district-specific only
   - not found
25. Counselor review flags:
   - true when foreign transcript equivalency is local/district-determined
   - true when official source does not define international transfer treatment
   - true when pathway/waiver depends on district/school decision

Important course-offering rule:
Do not claim every course offered for every semester in every state unless an official statewide source says so.

Most states do not define actual semester-by-semester course offerings for every high school. If the state only publishes graduation requirements or course codes, store exactly that:
- graduation requirements
- subject requirements
- official course codes/catalog if available
- local/district-specific availability note

Do not invent school-level course availability.

Source standards:
Use official or highly authoritative sources only:
- state department of education pages
- state board of education rules
- state administrative code
- state statutes
- official graduation requirement PDFs
- official course catalog/code documents
- official assessment requirement pages
- official transfer-student policy pages

Do not use:
- random blogs
- generic AI summaries
- unofficial counselor pages
- school marketing pages as statewide evidence
- Wikipedia as primary evidence
- district pages generalized to the whole state

District/local pages may only be used to document a local example, not a statewide rule.

Data integrity rules:
Do not fabricate anything.
Do not generalize one state to another.
Do not delete hard states and call the product clean.
Do not mark something complete just because it has a state name.
Do not put something in RESEARCH_GAPS.csv just because it takes effort.

If official public information exists, research it and add it.
Only add to RESEARCH_GAPS.csv when:
- no official public source can be found after serious searching
- official sources conflict
- source requires paid/restricted access
- information is genuinely district-only/local-only
- source exists but does not answer the required detail

When using partial information:
- store only the verified part
- mark coverage_status = partial
- add exact scope notes
- add counselor_review_required where appropriate
- include source/provenance

Schema requirements:
Review existing schema and use current fields if already present.

If needed, add safe additive migrations only.
Do not break existing data.
Do not remove existing rows unless replacing them with better sourced rows.
Do not create destructive migrations.

The schema/data model must support:
- state/DC-scoped frameworks
- effective_start_year
- effective_end_year nullable
- cohort_start_year nullable
- cohort_end_year nullable
- graduation_year_start nullable
- graduation_year_end nullable
- grade_at_transfer applicability where needed
- diploma_type
- pathway_type
- school_sector
- authority_level
- local_override_allowed
- transfer_student_notes
- international_transfer_notes
- counselor_review_required
- requirement groups/options for “choose one of these” cases
- non-course requirements
- exam/assessment requirements
- statewide course catalog/course code status
- source/provenance links for every factual row

If the existing schema already has equivalent fields, use them instead of adding duplicates.

Seed CSV requirements:
Update these as needed:
- supabase/seeds/jurisdictions.csv
- supabase/seeds/data_sources.csv
- supabase/seeds/destination_graduation_frameworks.csv
- supabase/seeds/graduation_requirements.csv
- supabase/seeds/education_programs.csv
- supabase/seeds/reference_record_sources.csv
- any existing requirement group/course catalog CSVs if they already exist

Every factual framework/requirement/program/course-catalog row must have provenance through:
- data_sources.csv
- reference_record_sources.csv

Do not silently create factual rows without source linkage.

Coverage status rules:
Use statuses honestly:
- official: directly supported by controlling official authority
- verified: strongly checked and scoped
- partial: factual data is sourced but scope is incomplete
- research_pending: known item still needs official detailed research
- needs_research: known gap remains
- not_verified: reviewed but not confirmed

Do not use “official” for an entire state unless the specific record is directly supported by official authority.
Do not use “complete” unless strict validation passes.

Onboarding/profile requirements:
Update onboarding/profile only as needed.

Required behavior:
1. User selects destination country = United States.
2. User selects state/DC.
3. User enters expected graduation year.
4. User enters current grade at transfer / grade_at_transfer.
5. App fetches frameworks for that selected state/DC.
6. Framework lookup should use expected graduation year/cohort where available.
7. If multiple frameworks/pathways exist, user can choose the applicable one.
8. If the state has a local-control-heavy model, UI should still show the state framework/local-control explanation honestly.
9. Changing state clears stale framework/program selections.
10. Changing expected graduation year clears stale framework/program selections if applicability changes.
11. Changing grade_at_transfer clears stale framework/program selections if needed.
12. Georgia must never appear for another state.
13. Selected IDs and readable labels persist to profile.
14. Honest empty states remain if something is truly missing.

Do not add fake fallback options.

Program/pathway rules:
Keep programs separate from graduation frameworks.

AP, IB, dual enrollment, CTE pathways, advanced diplomas, seals, endorsements, honors diplomas, local diplomas, alternate diplomas, and competency pathways are not replacements for standard graduation frameworks.

Only add programs/pathways when official state sources support them.
Each program/pathway row must include:
- scope
- state/DC
- program type
- source URL
- coverage status
- counselor review notes if needed

Validation requirements:
Update or create validators so the task cannot falsely pass.

The strict U.S. validator must require:
1. Exactly 51 U.S. destination jurisdictions selectable:
   - 50 states
   - DC
2. Every state/DC has at least one official source.
3. Every state/DC has at least one detailed standard public diploma framework OR an official documented local-control/no-state-credit framework.
4. Every detailed framework has subject requirements or official local-control explanation.
5. Every framework has effective/cohort/graduation-year applicability where official sources provide it.
6. Every framework has transfer/local-control notes where available.
7. Every factual graduation requirement row has provenance.
8. No state uses Georgia’s framework unless state = Georgia.
9. No country-wide U.S. framework substitutes for state frameworks.
10. No unsupported “complete” or “official” status.
11. No hidden state remains research_pending when public official data has been found.
12. Expected graduation year and grade_at_transfer are supported by the data model and onboarding.
13. Georgia’s old cohort wording is either made adaptable with applicability fields or replaced with better structured framework applicability.

The strict validator must fail if any state/DC is missing its detailed framework or official local-control explanation.

Research batching:
This is a large task. Work in batches, but do not lose progress.

Recommended process:
1. Audit existing Georgia data and convert it to the adaptable model.
2. Complete high-priority large states:
   - California
   - Texas
   - New York
   - Florida
   - New Jersey
   - Illinois
   - Washington
   - Virginia
   - Massachusetts
   - Pennsylvania
3. Then complete the remaining pending jurisdictions:
   AL, AK, AZ, AR, CO, CT, DE, DC, HI, ID, IN, IA, KS, KY, LA, ME, MD, MI, MN, MS, MO, MT, NE, NV, NH, NM, NC, ND, OH, OK, OR, RI, SC, SD, TN, UT, VT, WV, WI, WY
4. Re-run validators after each batch.
5. If context is running low, commit/checkpoint the current batch and update reports with exact remaining states. Do not start India.

Testing:
Run all available checks before final response:
- npm test -- --run
- npm run seed:reference:check -- --country=USA
- node --experimental-strip-types scripts/import-reference-data.ts --dry-run
- node --experimental-strip-types scripts/import-reference-data.ts --dry-run --mvp-safe
- node --experimental-strip-types scripts/validate-us-reference-foundation.ts --require-complete
- npm run typecheck
- npm run lint
- npm run build

Add/update tests for:
- all 51 U.S. jurisdictions visible
- state/DC selector appears after United States
- framework options filtered by selected state/DC
- expected graduation year affects framework lookup when applicability exists
- grade_at_transfer is stored
- changing state clears stale framework/program
- changing expected graduation year clears stale framework/program if needed
- no Georgia fallback
- profile persists selected state/framework labels and IDs
- reference coverage shows accurate per-state framework status
- local-control-heavy states display honest planning state
- strict validator fails if a framework lacks provenance

Supabase/live import:
Do not live-import to Supabase until:
- CSV dry-run passes
- MVP-safe dry-run passes
- strict U.S. validator passes
- tests pass
- typecheck passes
- lint passes
- build passes

If server-only Supabase credentials are safely available, and only after all local validation passes:
- apply migrations
- import reference data
- verify live counts
- run import again to verify idempotency
- test onboarding against live Supabase

If credentials are not available, do not fake live import results.
Update the live import report with the exact reason skipped and exact commands for later.

Security:
Do not create or commit .env files.
Do not expose service-role keys.
Do not put secrets in frontend code.
Do not upload real student data.

Reports to update:
- US_STATE_COVERAGE.csv
- US_STATE_VALIDATION_REPORT.md
- US_ONBOARDING_E2E_REPORT.md
- US_ACADEMIC_FRAMEWORK_MODEL.md if model changed
- SCHOLAPORT_REFERENCE_FOUNDATION_PROGRESS_REPORT.md
- SCHOLAPORT_LIVE_REFERENCE_IMPORT_REPORT.md if import is attempted/skipped
- RESEARCH_GAPS.csv
- RESEARCH_AUDIT.md

Final response format:
At the end, report:

1. Audit findings from the unfinished Codex work
2. Files changed
3. Migrations added
4. Schema fields added or reused
5. State-by-state completion summary
6. Number of frameworks added/updated
7. Number of graduation requirement rows added/updated
8. Number of data sources added/updated
9. Number of provenance links added/updated
10. Which states have statewide course catalogs/course codes
11. Which states are local-control-heavy
12. Which states require counselor review for international transfer cases
13. Validation/test/build results
14. Supabase import result or exact reason skipped
15. Onboarding test results
16. Whether strict U.S. validator passes
17. Whether India is ready to begin

Hard stop rules:
- Do not begin India.
- Do not begin any other country.
- Do not begin transcript conversion.
- Do not begin AI/RAG/Pori.
- Do not begin OCR.
- Do not begin roadmap generation.
- Do not begin counselor packet generation.
- Do not begin mobile.
- Do not deploy.
- Do not claim U.S. complete unless strict validation passes.
- Do not fabricate graduation requirements.
- Do not generalize one state to another.
- Do not use Georgia as fallback.
