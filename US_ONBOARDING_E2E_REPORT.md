# United States Onboarding E2E Report

**Date:** 2026-06-24  
**Status:** Code-level onboarding correction implemented; full browser E2E not completed in this pass.

## Implemented onboarding behavior

The United States onboarding flow now:

1. Requires a state/DC selection after selecting United States.
2. Exposes all 51 verified U.S. planning jurisdictions from reference data.
3. Filters destination frameworks by selected jurisdiction.
4. Filters frameworks by expected graduation year when year bounds exist.
5. Prevents the Georgia framework from appearing as a fallback for other states.
6. Prevents the Texas framework from appearing as a fallback for other states.
7. Allows Texas framework selection for Texas students.
6. Clears stale framework and program selections when the destination state changes.
7. Clears incompatible program selections when the framework changes.
8. Keeps optional programs separate from frameworks.
9. Saves destination state, framework, program, target district, target school, readable labels, applicable cohort, and framework version to the authenticated student profile.
10. Shows a safe incomplete-detail message when a state is selectable but has no verified framework yet.

## Automated coverage added

`tests/us-reference-foundation.test.ts` covers:

- exactly 51 U.S. planning jurisdictions;
- DC as `federal_district`;
- jurisdiction identity separated from framework coverage;
- framework filtering by state with no Georgia or Texas fallback;
- Georgia requirement attachment and 23-credit total;
- Texas requirement attachment and 26-credit default endorsement path;
- program separation and state scoping;
- field-level provenance for displayed jurisdiction identity fields.

## Commands run

```bash
npm test -- --run
```

Result: 16 tests passed.

```bash
npm run typecheck
npm run lint
npm run build
```

Results:

- Typecheck passed.
- Lint exited 0 with 16 existing Fast Refresh warnings and no errors.
- Production client and SSR build passed.

## E2E cases not completed

The following browser scenarios still need a real browser-authenticated Supabase test run after the updated local package is imported:

- Georgia standard framework;
- Texas standard framework (Foundation + endorsement, 26-credit path);
- Texas incomplete-detail state (showing opt-out 22-credit minimum path);
- California incomplete-detail state;
- New York incomplete-detail state;
- a strong local-control state after that state is researched;
- changing Georgia to Texas;
- changing Texas to another state;
- changing expected graduation year;
- selecting and removing a program;
- slow connection;
- failed Supabase request;
- refresh;
- back navigation;
- double submission;
- sign out and return;
- two different authenticated users.

## Current conclusion

The code path now prevents the most serious U.S. onboarding error: silently substituting Georgia or Texas for other states. However, full browser E2E and live-data verification have not been completed for this local U.S. correction pass.
