# Kimi Work prompt — repair and verify India only

> **Status update (2026-06-25):** This prompt was originally executed for the CBSE-focused India pass. Tamil Nadu was subsequently completed in a dedicated 2026-06-25 pass with direct DGE/SCERT/School Education Department sources. See `RESEARCH_AUDIT.md` for the Tamil Nadu completion record.

Work in:

```text
/Users/its_shwindy/Documents/courseport/edubridge-ai-
```

Use **one Agent**, not Agent Swarm. This run covers only India (`IND`). Do not research or modify another country, including the already-verified USA/Georgia rows. Do not claim global completion.

You are authorized to research official public sources and edit only India-related rows in the allowed reference CSV/audit files. Complete the research, repair, and India-scoped validation in one uninterrupted run. Do not ask for intermediate approval.

## Forbidden actions

Do not:

- connect to or import into Supabase;
- deploy anything;
- read or modify `.env*` files;
- edit application code, migrations, package files, or validation scripts;
- edit USA/Georgia or another country's data/audit rows;
- use search-result snippets, AI summaries, Wikipedia, blogs, coaching sites, textbook sellers, commercial credential evaluators, or generic homepages as evidence for detailed claims;
- invent subjects, course codes, required status, examination status, credits, grade placement, equivalencies, curricula, authorities, or URLs;
- use placeholder evidence such as `Direct official education sources`;
- create mapping rules from course-name similarity;
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
supabase/seeds/education_programs.csv
supabase/seeds/data_sources.csv
supabase/seeds/reference_record_sources.csv
SEMANTIC_SOURCE_AUDIT.csv
RESEARCH_AUDIT.md
RESEARCH_GAPS.csv
```

Preserve every existing valid UUID for retained records.

## Exact India records in scope

Country:

```text
India: 0320e77e-3e2a-41e1-a1a5-4f82e518f35e
```

Jurisdiction placeholders:

```text
Maharashtra: 5381d73e-be87-497b-bc55-f54f1bb2bfba
Tamil Nadu: 074f9bf5-9cf3-445e-bc9c-7048c679bead
Uttar Pradesh: 67fc7855-e746-49db-a1c0-7d111b905b22
```

Curricula:

```text
CBSE Secondary (Classes 9-10): 6a8f09bc-62e1-4408-99a8-ba649c14aa3c
CBSE Senior Secondary (Classes 11-12): 0b065008-1960-480e-87f3-80f560f9a129
CISCE ICSE (Class 10): fa7f4fce-6cdf-4aad-ad30-58001092df7f
CISCE ISC (Class 12): 7f94e1f9-352f-4158-bc5a-255dd4a37f24
NIOS Secondary (Class 10): a8130da9-b714-4eff-ba3d-f61db8f1ae96
NIOS Senior Secondary (Class 12): 45456bd7-41ae-4e1d-b94d-55b7f4e5c780
Maharashtra SSC placeholder: 091cb2a1-c8b8-45c8-bab7-8dc9ca9995f3
Tamil Nadu SSLC placeholder: 56eb4b5b-5e18-43f7-a8dc-14c8d79a667f
Uttar Pradesh Class 10 placeholder: 01ab94f7-c375-42f3-a679-4b7d8220ef75
```

Program:

```text
CBSE Skill Education: f3247cfe-476e-4577-98b2-9f25a61438d4
```

All existing course rows whose `curriculum_id` is one of the two CBSE curriculum IDs are in scope. There are currently 26 such rows.

The three state-board curricula and jurisdictions are discovery placeholders. Do not expand into additional Indian states in this run. Keep them `needs_research`/`not_verified` unless direct current board evidence is actually researched.

## Mandatory evidence standard

For every populated material field retained as `partial`, `verified`, or `official`, add a separate row to `SEMANTIC_SOURCE_AUDIT.csv` with:

1. a real direct official `http://` or `https://` URL;
2. the exact issuing authority;
3. the exact official document/page title;
4. exact page number, section, heading, table, curriculum group, or syllabus clause;
5. the exact field claim supported;
6. `direct_support=yes` only when the opened source explicitly supports that field;
7. `scope_match=yes` only when the board/curriculum/grade scope matches;
8. `current_as_of_2026_06_22=yes` only after checking the academic year and current applicability;
9. `action_taken=kept` or `corrected`.

The exact URL must exist in `data_sources.csv`, and the record/field must also have a corresponding link in `reference_record_sources.csv`.

If a source establishes the record but not an optional field, clear that field. If a detailed record cannot be directly supported, downgrade it to `needs_research`/`not_verified` or delete it and document the gap.

## Required research and repairs

### A. India country profile

India is currently `country_seed_only` with:

```text
primary_languages=[]
education_system_summary blank
grade_structure={}
```

This is acceptable and should remain unless all three populated profile fields can be supported with direct current Government of India sources.

If upgrading India to `partial`:

- source `primary_languages`, `education_system_summary`, and `grade_structure` separately;
- distinguish constitutional/official-language facts from languages of instruction;
- do not reduce India's language landscape to Hindi and English without a source matching the schema's intended meaning;
- distinguish national policy from state implementation;
- distinguish the NEP 2020 5+3+3+4 curricular structure from the actual class/credential structure and current implementation;
- state clearly that CBSE, CISCE, NIOS, and state boards have different authority/scope.

If those distinctions cannot be directly represented and sourced, keep the country as `country_seed_only` rather than forcing an upgrade.

### B. CBSE current academic year

Replace the outdated source:

```text
https://www.cbseacademic.nic.in/curriculum_2025.html
```

Use the current official 2026-27 curriculum landing page:

```text
https://cbseacademic.nic.in/curriculum_2027.html
```

Open the current initial pages, curriculum documents, subject tables, and individual syllabus PDFs linked from that page. The landing page alone may establish that a subject exists, but detailed claims require the relevant linked document.

Update `last_verified_at` only for URLs actually opened and inspected.

### C. CBSE Secondary Classes IX-X

Audit every retained field in the CBSE Secondary curriculum and its Class IX/X course rows.

Critical existing-data warnings:

- The current seed uses course code `002` for English Language and Literature. Do not assume this is correct; verify every code from the 2026-27 CBSE document.
- Do not assume a subject has the same code, name, required status, or exam treatment in Class IX and Class X.
- Do not mark every listed Class IX subject as `is_exam_based=true` merely because it has a syllabus.
- Distinguish Class X board examination subjects from Class IX school-level assessment.
- Distinguish compulsory subject groups, optional/elective groups, and internal-assessment subjects.
- Do not mark Hindi Course A, English, Mathematics, Science, or Social Science required for every student unless the current scheme of studies explicitly states that exact rule and alternatives.
- Use exact official subject names and capitalization.

For each retained course, verify separately when populated:

- `course_code`
- `course_name_local`
- `course_name_english`
- `subject_category`
- `grade_level`
- `level`
- `credits_estimated`
- `is_required`
- `is_exam_based`
- `description`
- `learning_outcomes_summary`

Use blank/null for unsupported optional fields. Do not use guessed credit values.

### D. CBSE Senior Secondary Classes XI-XII

Audit each retained English Core, Mathematics, Physics, Chemistry, Biology, Business Studies, Accountancy, and Economics row against the current 2026-27 Senior Secondary curriculum and direct syllabus.

Important:

- A subject offered by CBSE is not automatically required for every student.
- A subject's inclusion in an examination catalog does not establish that every student takes it.
- Verify whether course codes apply to both XI and XII and whether the seed should contain separate grade rows.
- Distinguish subject availability from stream labels; do not infer Science/Commerce/Humanities requirements from convention.
- Clear generic descriptions such as “for Science stream” unless the source directly uses that classification and scope.

### E. CISCE ICSE and ISC

The current records are `partial` but sourced primarily to a generic CISCE homepage. Replace with current direct official CISCE regulations, syllabuses, subject lists, or qualification documents.

Verify:

- official credential/curriculum name;
- Class 10 versus Class 12 scope;
- grade range;
- authority;
- description;
- current academic/examination year.

If direct current documents cannot support every retained material field, clear unsupported fields or downgrade the record. Do not create CISCE course rows in this run unless every course field can pass the semantic validator.

### F. NIOS Secondary and Senior Secondary

Use direct current NIOS prospectus/course-list/curriculum documents, not only the NIOS homepage.

Verify:

- Secondary versus Senior Secondary level;
- credential/class equivalence wording;
- grade/level representation;
- authority;
- description;
- current course/session applicability.

Do not infer NIOS course offerings from memory. Do not create NIOS course rows unless directly sourced field by field.

### G. Maharashtra, Tamil Nadu, and Uttar Pradesh placeholders

> **Update (2026-06-25):** Tamil Nadu has been completed as a dedicated source jurisdiction with 92 curriculum courses. Maharashtra and Uttar Pradesh remain placeholders.

These are not part of the detailed research target in this run (except for Tamil Nadu, which was completed in a subsequent 2026-06-25 pass).

- Keep Maharashtra and Uttar Pradesh jurisdiction and curriculum records as `needs_research` or `not_verified` unless direct current authority evidence is inspected.
- Remove unsupported detailed descriptions, grade claims, authority claims, or URLs from placeholders where necessary.
- Do not mark them `partial`, `verified`, or `official` merely because the board homepage exists.
- Do not create Maharashtra or Uttar Pradesh course rows.

### H. CBSE Skill Education

Use the direct current official CBSE Skill Education page/catalog and current curriculum documents, such as the official skill-education area linked by CBSE Academic.

Verify:

- program name;
- program type;
- level;
- description;
- national/board availability scope;
- website URL;
- current academic year.

Do not claim all skill subjects are NSQF-aligned or universally available unless the current official source directly states that scope.

### I. Provenance cleanup

- Remove every India provenance link that uses a generic homepage for a detailed claim it does not state.
- Remove the obsolete CBSE 2025 curriculum source/link when no retained record needs it.
- Add direct current field-level links for all retained material claims.
- Remove duplicate India provenance tuples.
- Do not edit or remove USA/Georgia provenance or audit rows.
- Keep `mapping_rules.csv` unchanged and header-only.

## Required validation

Run exactly:

```bash
cd /Users/its_shwindy/Documents/courseport/edubridge-ai-
npm run seed:reference:check:country -- --country=IND
```

Current baseline before this run is:

```text
country=IND
required_material_claims=208
supported_material_claims=0
errors=208
```

The command must finish with:

```text
country=IND
supported_material_claims=<same number as required_material_claims>
errors=0
```

Do not edit either validator. If the command fails, continue researching, correcting, clearing, downgrading, or deleting India claims until it passes.

Do not run the live import command.

## Required final response

Return:

1. exact India rows changed, deleted, cleared, or downgraded;
2. every real direct official URL used;
3. exact section/page/table supporting every retained material field;
4. CBSE course rows before and after;
5. India semantic audit rows before and after;
6. required and supported material-claim totals;
7. complete output and exit code from `npm run seed:reference:check:country -- --country=IND`;
8. unresolved India gaps;
9. confirmation that USA/Georgia and every other country were untouched;
10. confirmation that no database import, deployment, `.env` access, application-code edit, migration edit, package edit, or validator edit occurred.

Do not say `verified`, `ready`, `passed`, or `complete` unless the India command exits 0 with `supported_material_claims` equal to `required_material_claims` and `errors=0`.
