# Codex task — repair and verify Pakistan reference data only

Work in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

This is an implementation task. Inspect the repository, research current direct official sources, edit the reference CSV/audit files, and run validation. Do not return only a research report.

Work only on Pakistan (`PAK`). Preserve USA, India, Canada, Australia, the United Kingdom, Germany, China, Mexico, and the Philippines exactly. Do not import into Supabase or deploy anything.

## Objective

Repair Pakistan's existing reference data so every retained material claim has direct, current, scope-matched official evidence and:

```text
npm run seed:reference:check:country -- --country=PAK
```

finishes with equal required/supported claims and `errors=0`.

Prefer a small, honest, precisely scoped dataset over unsupported national breadth. Pakistan's education system is constitutionally and operationally decentralized, while the existing seed rows describe only FBISE. Do not turn FBISE evidence into a claim about every province, board, school, or student.

If direct official evidence does not explicitly support an optional field, clear it, downgrade the record, delete the unsupported row, or document the gap. Do not keep weak legacy claims merely to preserve row counts.

## Hard boundaries

Do not:

- access or modify `.env*` files;
- connect to Supabase or run a live import;
- deploy anything;
- edit application code, migrations, package files, import scripts, or validators;
- edit another country's seed, audit, provenance, source, or research-gap rows;
- change completed-country rows while cleaning shared files;
- use Wikipedia, blogs, newspapers, coaching sites, private-school pages, commercial credential evaluators, university admissions summaries, AI summaries, or search-result snippets as evidence;
- use a generic FBISE, Ministry, National Curriculum Council, provincial department, BISE, or IBCC homepage for detailed curriculum, scheme-of-studies, credential, examination, grading, or equivalence claims;
- treat federal policy, a national curriculum document, an FBISE scheme, a provincial textbook, and a provincial BISE examination rule as interchangeable;
- describe FBISE as Pakistan's national school board for all learners;
- assume that every province or territory adopted the same national curriculum, subject combinations, textbooks, examination scheme, grading scale, or implementation year;
- treat SSC/HSSC, Matric/Intermediate, O Level/A Level, technical-board credentials, and madrasah credentials as identical;
- state that SSC is always “Grade 10” or HSSC is always “Grade 12” unless the exact retained row and official source support that representation;
- invent groups, subjects, marks, pass thresholds, practical requirements, examination rules, credential titles, equivalence decisions, or compulsory courses;
- infer US credits or cross-country equivalencies;
- create `mapping_rules` rows;
- add every provincial BISE, district, school, textbook board, technical board, or madrasah board in this pass;
- use IBCC equivalence material as proof of a curriculum's own content unless the specific field is actually an equivalence claim;
- edit validators to make unsupported data pass.

## Read completely before editing

```text
KIMI_REFERENCE_DATA_FINAL_SEMANTIC_REPAIR_PROMPT.md
CODEX_ONE_COUNTRY_PHILIPPINES_PROMPT.md
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

Before editing, create a temporary byte-level baseline of every non-Pakistan row in all ten seed CSVs plus `SEMANTIC_SOURCE_AUDIT.csv` and `RESEARCH_GAPS.csv`. Use it only to prove preservation; do not add the temporary baseline to the repository.

Preserve valid UUIDs for retained records. Use fresh RFC 4122 UUIDs only for genuinely necessary Pakistan sources, audit rows, provenance links, or replacement records. Never reuse an existing UUID.

## Existing Pakistan records

Country:

```text
Pakistan: 8431e340-10c3-4221-8a90-63ae0a3b150c
```

The country profile is already an honest shell:

```text
primary_languages=[]
education_system_summary=null
grade_structure={}
coverage_status=country_seed_only
```

Do not expand it unless every populated material field receives current direct official field-level evidence and accurately distinguishes federal, provincial, territorial, and board scope.

Curricula:

```text
FBISE SSC (Grades 9-10): 8822f9f4-c664-40ee-a932-2c91269383be
FBISE HSSC (Grades 11-12): 4bdb2f41-399f-41c5-9a3a-35824fef687a
```

Existing source:

```text
Generic FBISE homepage: 5d284230-d9a2-4a17-856a-bbbfd882a392
```

Current baseline:

```text
country=PAK
required_material_claims=8
supported_material_claims=0
errors=8
```

The required count may decrease if misleading fields are cleared or records are narrowed, downgraded, replaced, or deleted. A lower honest count is acceptable. Zero errors is mandatory.

## Evidence contract

For every populated material field retained as `partial`, `verified`, or `official`, create one field-level row in `SEMANTIC_SOURCE_AUDIT.csv` containing:

1. a direct official URL;
2. the exact issuing authority;
3. the exact official instrument/document/page title;
4. the exact Act/section, notification number, scheme-of-studies table/page, regulation, syllabus page, board rule, or official heading;
5. the exact field claim supported;
6. `direct_support=yes` only when the source explicitly supports the stored value;
7. `scope_match=yes` only when the source's federal/provincial/territorial/board/credential/level scope matches the row;
8. `current_as_of_2026_06_24=yes` only after checking amendments, replacements, revised schemes, implementation years, examination sessions, and transition cohorts;
9. `action_taken=kept` or `corrected` as appropriate; and
10. a note when an English label is descriptive rather than the exact official title.

Every audit URL must exist in `data_sources.csv`. Every audited record/field must have a matching `reference_record_sources.csv` link. Remove provenance attached to cleared/deleted claims. Do not use a source beyond its geographic, institutional, learner, examination-session, or credential scope.

Use direct primary official sources in this order where available:

1. Pakistan Code, National Assembly/Senate legislation, constitutional text, and official gazette/notifications;
2. Federal Ministry of Federal Education and Professional Training and National Curriculum Council documents;
3. direct FBISE statutes, regulations, schemes of studies, syllabi, notifications, and examination rules;
4. direct provincial education/curriculum/textbook/examination authorities for province-specific facts;
5. Inter Boards Coordination Commission only for claims actually within IBCC authority;
6. direct technical-board or madrasah-board regulations only for precisely scoped future records.

A search result, document mirror, Scribd copy, third-party PDF host, generic board page, or press story is not acceptable evidence.

## Required research and repairs

### A. Establish governance and scope before editing

First determine, using current official sources:

- the constitutional/legal division of education responsibility after the Eighteenth Amendment;
- the current federal role of the Ministry and National Curriculum Council;
- the current legal jurisdiction of FBISE;
- which institutions/territories/schools FBISE actually covers;
- whether the relevant national curriculum documents are mandatory, adopted, adapted, or separately implemented by provinces;
- the relationship among curriculum standards, schemes of studies, textbooks, syllabi, examinations, and certification;
- current SSC and HSSC scheme years and examination sessions; and
- whether older FBISE rows have been superseded by a revised grading, curriculum, assessment, or scheme-of-studies instrument.

Create a short evidence matrix in working notes before editing. For each existing row, identify the controlling source, exact jurisdiction, applicable years/sessions, supportable fields, and fields that must be cleared.

### B. Pakistan country profile

The current `country_seed_only` shell is acceptable and should remain minimal unless direct evidence supports a precise national description.

If considering population of any country field, audit separately:

- `primary_languages`;
- `education_system_summary`;
- `grade_structure`.

Critical rules:

- do not collapse national, official, provincial, regional, and instructional-language concepts into one `primary_languages` list;
- do not claim one centralized national curriculum;
- do not claim one uniform SSC/HSSC pathway for all provinces, territories, boards, private candidates, technical education, or religious education;
- do not insert credential names or group structures into grade JSON without direct national and scope-matched authority;
- preserve `country_seed_only` if the schema cannot express decentralization safely.

### C. FBISE jurisdiction

Determine whether an explicit `jurisdictions.csv` row is necessary to prevent the curriculum records from appearing national. If it is necessary and directly supported:

- create one accurately typed FBISE jurisdiction/board row;
- use the board's exact legal name;
- populate only fields supported by direct statute/regulation/official board material;
- link both curricula to that jurisdiction;
- audit/provenance every material jurisdiction field if the validator treats it as material; and
- do not imply that a board is a geographic province.

If the schema can safely retain the board scope without adding a jurisdiction, explain why. Never leave a row with `jurisdiction_id=null` if that would falsely communicate nationwide application.

### D. FBISE SSC row

Determine whether the existing row correctly represents a curriculum, an examination-board scheme of studies, a credential stage, or a mixture of all three.

Audit separately if retained:

- `name`;
- `grade_range`;
- `authority`;
- `description`.

Critical rules:

- use the exact current official FBISE title and scheme/session scope;
- verify whether “SSC” is modeled as curriculum, scheme of studies, or examination stage;
- verify Part I/Part II or class/year structure from a direct current scheme;
- verify any Science/Humanities or other group terminology against the current scheme rather than legacy assumptions;
- do not state “examination at Grade 10” without a precise current rule and accurate description of component examinations;
- distinguish curriculum content authority from FBISE examination/certification authority;
- clear `grade_range` if mapping Classes IX–X to the stored format would overstate the source;
- do not add `curriculum_courses` unless each subject name, status, group, class, and session is supported by current official documents and can be modeled without distortion.

If `curricula` is the wrong schema for an examination scheme, narrow the description explicitly, downgrade it, or convert it to a transition/research shell rather than pretending it is a national curriculum.

### E. FBISE HSSC row

Apply the same analysis to HSSC.

Audit separately if retained:

- `name`;
- `grade_range`;
- `authority`;
- `description`.

Critical rules:

- verify current official group names; do not automatically retain Pre-Medical, Pre-Engineering, Commerce, Humanities, and Computer Science;
- check whether group names, subject combinations, marks, practicals, and schemes changed for recent sessions;
- verify Part I/Part II or class/year scope;
- do not describe HSSC as one nationwide upper-secondary curriculum;
- distinguish FBISE affiliation/jurisdiction from provincial BISEs and other examining bodies;
- distinguish curriculum, examination, credential, grading, and university-admission/equivalence claims;
- do not add compulsory/elective subject rows unless the exact current scheme is available and accurately modeled.

### F. Current grading, assessment, and examination transition

Research whether FBISE or IBCC introduced a current grading reform, revised passing rules, assessment framework, or phased implementation affecting SSC/HSSC sessions around 2024–2026.

Do not add such claims unless the controlling official notification clearly states:

- issuing authority;
- boards/institutions covered;
- examination year/session;
- SSC/HSSC level;
- cohort transition;
- grading versus marks treatment; and
- whether the rule concerns certification, examination reporting, or equivalence.

If the transition cannot be modeled safely in current tables, add a concrete research gap rather than forcing it into a curriculum description.

### G. Provincial, territorial, board, technical, and religious diversity

Do not create detailed rows in this pass. Replace or expand generic research gaps with concrete separately actionable gaps for:

- Punjab curriculum/textbook authority and each relevant BISE;
- Sindh curriculum/textbook authority and each relevant BISE;
- Khyber Pakhtunkhwa curriculum/textbook authority and boards;
- Balochistan curriculum/textbook authority and board;
- Islamabad Capital Territory/Federal Directorate of Education relationship to FBISE;
- Gilgit-Baltistan and Azad Jammu and Kashmir authorities/boards;
- cantonment/garrison and other federally administered institutions where relevant;
- Aga Khan University Examination Board;
- provincial Boards of Technical Education and vocational credentials;
- NAVTTC versus provincial TEVTAs;
- madrasah boards/wafaqs, current curricula, credentials, and official equivalence rules;
- Cambridge and other international curricula offered in Pakistan;
- private-school curriculum/board choice;
- language-medium and regional-language implementation;
- special, inclusive, non-formal, and alternative education;
- current SSC/HSSC credential issuance and verification;
- private-candidate rules;
- examination-session and grading transitions;
- IBCC equivalence for foreign and domestic qualifications; and
- incoming international-student placement/recognition procedures.

Do not convert these gaps into speculative seed rows.

### H. Credentials and equivalence

Do not create a national graduation framework in this pass unless a direct current official instrument and the existing schema can represent its exact board/session scope.

Do not infer:

- SSC/HSSC credential equivalence;
- O/A Level equivalence;
- madrasah equivalence;
- technical diploma equivalence;
- university admission eligibility; or
- foreign-study equivalence.

IBCC materials may be used only for exact equivalence/coordination claims within IBCC's authority, and those claims should remain research gaps unless the appropriate production table and review workflow are ready.

### I. Provenance cleanup

- Remove the generic FBISE homepage from detailed claims.
- Add direct current statutes, schemes, notifications, syllabi, or regulations.
- Remove provenance for deleted, cleared, or downgraded claims.
- Add field-level provenance for every retained material Pakistan claim.
- Remove duplicate Pakistan provenance tuples and orphaned source/audit links.
- Remove unused Pakistan sources only when no retained Pakistan record uses them.
- Preserve every non-Pakistan row exactly.
- Keep `mapping_rules.csv` header-only.

## Validation and preservation gates

Run:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=PAK
```

Continue correcting, clearing, narrowing, downgrading, or deleting Pakistan claims until required equals supported and `errors=0`. Do not edit the validator.

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
```

The Pakistan command must also complete the full mechanical dry run with zero rejected rows.

After validation, compare current files with the temporary baseline and prove:

- all non-Pakistan rows in all ten seed CSVs are byte-for-byte unchanged;
- all non-Pakistan semantic-audit rows are byte-for-byte unchanged;
- all non-Pakistan research-gap rows are byte-for-byte unchanged;
- no duplicate UUIDs exist;
- no duplicate provenance tuple exists;
- no provenance or audit row points to a deleted record/source; and
- `mapping_rules.csv`, import scripts, validator scripts, migrations, app code, package files, and `.env*` files are unchanged.

Do not run a live import or deployment.

## Required final response

Report all of the following:

1. exact Pakistan rows changed, added, deleted, cleared, or downgraded by file;
2. every direct official URL used;
3. exact constitutional provision, Act/section, notification, scheme page/table, board regulation, or syllabus location supporting every retained material field;
4. the exact division among federal, provincial/territorial, curriculum, FBISE examination/certification, and IBCC coordination/equivalence authority;
5. unsupported, outdated, generic, or over-broad claims removed and why;
6. whether each FBISE row was retained, renamed, jurisdiction-linked, narrowed, downgraded, replaced, or deleted;
7. whether an FBISE jurisdiction row was added and why;
8. exact final row counts for every modified CSV;
9. Pakistan validator output and exit code;
10. every completed-country regression output and exit code;
11. exact additions/repairs in `RESEARCH_GAPS.csv`;
12. byte-level non-Pakistan preservation results;
13. duplicate UUID/provenance and orphan-link checks; and
14. confirmation that no Supabase import, deployment, `.env` access, app/package/migration/import-script/validator edit, or mapping-rule creation occurred.

Do not say “fully verified Pakistan.” State the exact FBISE board, curriculum/scheme, level, session, and jurisdiction scope supported. Clearly identify provincial, territorial, board, credential, grading, technical/vocational, madrasah, international-curriculum, and equivalence work that remains `needs_research`.
