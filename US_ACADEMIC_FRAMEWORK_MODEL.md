# United States Academic Framework Model

**Date:** 2026-06-24  
**Scope:** United States destination-side planning model for Scholaport  
**Status:** Jurisdiction identity and selectability foundation complete; detailed state framework research is complete only for Georgia in the current local seed package.

## Core product rule

Scholaport must not treat the United States as one national graduation framework.

The destination-side path is:

```text
United States
→ state or District of Columbia
→ applicable diploma/graduation framework
→ cohort or expected graduation year
→ school sector
→ diploma pathway or program
→ subject and credit requirements
→ assessment and non-course requirements
→ district or school additions where applicable
```

The student must select the destination state or District of Columbia before Scholaport selects or displays a graduation framework.

## Identity versus detail coverage

The repository now separates two different facts:

| Concept | Meaning | Current U.S. status |
|---|---|---|
| Jurisdiction identity | The state/DC exists, has an official abbreviation, a jurisdiction type, and a state education authority. | 51/51 verified and selectable. |
| Detailed framework coverage | Scholaport has sourced graduation-framework requirements, cohort scope, requirements, assessments, pathways, local-control rules, and course-catalog information. | Georgia only in this local pass; 50 jurisdictions remain `research_pending`. |

This distinction prevents Scholaport from hiding valid state choices merely because detailed graduation research is unfinished.

## Schema support added for the U.S. model

The additive U.S. migrations support:

- verified-but-incomplete planning jurisdictions;
- `federal_district` for the District of Columbia;
- multiple state-scoped graduation frameworks;
- school-sector and authority-level scope;
- cohort and graduation-year windows;
- standard-framework flags and diploma types;
- local override notes;
- requirement groups and options for future alternative logic;
- jurisdiction course catalogs and jurisdiction course rows for future state course-code/catalog data;
- profile persistence for selected state, framework, program, district/school labels, cohort, and framework version.

## Current seed interpretation

The current local package includes:

- 51 U.S. planning jurisdictions: all 50 states plus DC.
- Field-level provenance for each jurisdiction's displayed identity fields.
- One U.S. graduation framework: Georgia High School Graduation Requirements.
- Eight Georgia requirement rows totaling 23 units.
- Two Georgia-scoped optional programs: AP and Dual Enrollment.
- No U.S. country-level graduation framework.
- No state course-catalog rows yet.

States other than Georgia remain selectable but display the incomplete-detail message:

> Detailed graduation requirements for this jurisdiction are still being verified.

## Rules for future state research

For each state/DC, add only facts supported by direct official sources. Use state statutes, administrative code, state board rules, state department guidance, official graduation-requirement pages, official assessment manuals, and official course-code/catalog documents.

Do not infer:

- a national U.S. requirement;
- statewide course availability from a state-recognized course code;
- a district requirement as a statewide rule;
- a recommended college-prep sequence as a graduation requirement;
- a passing assessment requirement from an assessment participation rule;
- a semester placement when the state specifies only a credit or duration.

If a state officially delegates a credit total or course details to local districts, record that local-control rule as the researched result.

## Readiness boundary

The United States is not yet complete for the user's full 51-jurisdiction requirement. India should not begin until the strict U.S. validator succeeds with:

```bash
node --experimental-strip-types scripts/validate-us-reference-foundation.ts --require-complete
```
