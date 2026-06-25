# United States State Validation Report

**Date:** 2026-06-24  
**Local package status:** Staged U.S. foundation passes; strict U.S. completion fails as expected.

## Commands run

```bash
npm run validate:us
```

Result: passed staged validation.

```text
planning_jurisdictions=51
detail_coverage={"research_pending":49,"partial":2}
identity_provenance=255/255
us_frameworks=2
us_programs=2
us_course_catalogs=0
warnings=49
No validation errors.
```

```bash
node --experimental-strip-types scripts/validate-us-reference-foundation.ts --require-complete
```

Result: failed strict completion validation because 50 jurisdictions have no standard framework or sourced local-control result yet.

## What the staged validator confirms

- The United States has exactly 51 planning jurisdictions.
- All 50 states plus the District of Columbia are selectable.
- The District of Columbia is modeled as `federal_district`, not `state`.
- Every displayed jurisdiction identity field has field-level provenance.
- No U.S. country-level graduation framework exists.
- Georgia's sourced framework remains state-scoped.
- Georgia has eight requirement rows totaling 23 units.
- Texas Foundation High School Program (default 26-credit endorsement path) is state-scoped with 11 requirement rows.
- Texas local-control flags (districts may add requirements; state sets minimum) are verified.
- Georgia AP and Dual Enrollment records remain programs, not graduation frameworks.
- Optional U.S. course-catalog tables may be absent until state catalog research is added.

## What strict completion still requires

Strict completion currently fails for every planning jurisdiction except Georgia and Texas. The remaining 49 jurisdictions need direct official evidence for:

- standard public high-school diploma or official local-control result;
- controlling authority;
- school-sector scope;
- effective cohort or graduation-year applicability;
- credit/unit system;
- subject requirements;
- named required courses, if any;
- assessment requirements;
- civics, financial-literacy, service, FAFSA, CPR, portfolio, or other non-course requirements, if any;
- local district/school override rules;
- state course catalog or local-availability determination;
- optional pathways/programs separated from frameworks;
- field-level provenance for every retained factual field.

See [US_STATE_COVERAGE.csv](/Users/its_shwindy/Documents/courseport/edubridge-ai-/US_STATE_COVERAGE.csv) for the state-by-state coverage matrix.

## Current state-by-state status

The local package should be read as:

- **Georgia:** partial framework coverage with sourced standard public diploma requirements.
- **Texas:** partial framework coverage with sourced Foundation High School Program (default 26-credit endorsement path) requirements and local-control flags.
- **All other states/DC:** identity verified and selectable; detailed graduation-framework research pending.

This means the United States destination-side foundation is improved but not complete.
