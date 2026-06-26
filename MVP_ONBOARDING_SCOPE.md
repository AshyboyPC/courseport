# Current MVP Onboarding Scope

Scholaport's current MVP scope is a real verified slice of the reference foundation. It is not fake data, mock data, or placeholder content. The scope is intentionally narrow so the product can be accurate, source-backed, and usable before expanding to additional countries, states, boards, and frameworks.

## User-Facing Source Scope

Source onboarding shows these source countries:

- India: selectable
- China, Mexico, Philippines, Pakistan, Bangladesh, Ukraine, Russia, Egypt, Nigeria: visible as coming soon and disabled

After India is selected, onboarding shows only these source jurisdictions:

- Tamil Nadu
- Andhra Pradesh

After a source jurisdiction is selected, onboarding shows only the matching state-board curricula:

- Tamil Nadu State Board SSLC (Class 10)
- Tamil Nadu State Board HSC (Class 11-12)
- Andhra Pradesh SSC (Class 9-10)
- Andhra Pradesh Intermediate (Class 11-12)

CBSE rows remain in the database for future expansion, but they are hidden from current MVP onboarding unless a later explicit product setting enables pan-India curricula.

## User-Facing Destination Scope

Destination onboarding shows these destination countries:

- United States: selectable
- Canada, United Kingdom, Australia, Germany, United Arab Emirates: visible as coming soon and disabled

After United States is selected, onboarding shows only:

- Georgia
- Texas

The framework dropdown only shows frameworks attached to the selected state. Georgia never falls back into Texas, Texas never falls back into Georgia, and no generic national U.S. framework is shown.

## Data Rule

All selectable jurisdictions, curricula, and frameworks are filtered from real Supabase/reference rows. The allowlists in `src/lib/mvp-reference-scope.ts` contain stable ISO codes, jurisdiction codes/names, and curriculum names only for filtering and disabled display labels. They do not create saved data.

## Internal Reference Data

Internal pages such as `/reference-coverage` can still show the broader reference foundation. The MVP scope only applies to user-facing onboarding/profile selection.

## Saved Profile Behavior

Student profiles now store `source_jurisdiction_id` and `source_jurisdiction_label` along with the existing source country/curriculum and destination framework fields. If an older saved profile uses CBSE, a non-India source, a non-U.S. destination, or a destination state outside Georgia/Texas, Scholaport treats it as unsupported for the current MVP and sends the user back to onboarding to reselect.

## Stale Selection Clearing

Onboarding clears stale dependent selections:

- changing source country clears source jurisdiction and curriculum
- changing source jurisdiction clears curriculum
- changing destination country clears destination jurisdiction, framework, and program
- changing destination jurisdiction clears framework and program

The database migration also adds a general trigger that clears incompatible source jurisdiction/curriculum references when upstream profile IDs change.
