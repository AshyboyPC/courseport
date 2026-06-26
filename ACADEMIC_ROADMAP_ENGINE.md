# Scholaport Personalized Academic Roadmap Engine

## Scope

The roadmap engine turns persisted graduation gap results into a saved planning roadmap:

`latest gap_analyses` -> `gap_requirements` -> `roadmaps` -> `roadmap_items`.

It does not redo OCR, translation, credit mapping, or gap analysis. It does not create official school schedules, counselor packets, Pori/RAG answers, PathMatch, Twin Connect, mobile flows, or deployment artifacts.

## Backend-First / No Mock Production Data

Production roadmap content is generated only from real backend rows:

- `student_profiles`
- `transcripts`
- confirmed `transcript_courses`
- `credit_mappings`
- latest completed or review-needed `gap_analyses`
- saved `gap_requirements`
- selected destination framework metadata
- destination `graduation_requirements` when available

The `/roadmap` UI renders saved `roadmaps` and `roadmap_items`. If a prerequisite record is missing, the UI shows an honest empty state. It does not render static sample roadmap cards, demo courses, fake counselor questions, or hardcoded Georgia/Texas examples.

## Database

Migration:

- `supabase/migrations/202606250004_academic_roadmap_engine.sql`

The migration safely extends existing `roadmaps` and `roadmap_items` tables instead of replacing them.

Roadmap additions include:

- transcript and destination framework links
- status, type, overall risk, timeline urgency, planning horizon
- item counts by priority and counselor-review status
- saved summary text, next steps, counselor questions, assumptions, warnings
- source snapshot metadata
- stale reason and generation timestamps

Roadmap item additions include:

- gap requirement and destination requirement links
- action type, timing bucket, risk level, counselor review flag
- counselor question, student instructions, evidence note, completion note
- display order and completion timestamp

Legacy fields such as `title`, `is_on_track`, `subject_category`, `credits_needed`, `semester_target`, `completion_method`, and `order_index` remain populated for compatibility.

## Generation Pipeline

Main service:

- `generateAcademicRoadmap({ userId, gapAnalysisId, transcriptId })`

The service:

1. Verifies the authenticated user owns the gap analysis and transcript.
2. Requires confirmed transcript courses.
3. Requires saved credit mappings.
4. Requires a saved gap analysis.
5. Loads saved gap requirements.
6. Loads the selected destination framework.
7. Generates deterministic roadmap items.
8. Marks older active roadmaps stale.
9. Saves one `roadmaps` row.
10. Saves many `roadmap_items` rows.

The calculation is deterministic. AI is not used to create requirements, tasks, priorities, or timing.

## Gap Requirement Conversion

Roadmap items are created from real `gap_requirements`:

- `missing` -> missing credit, assessment, local-policy, or elective planning item
- `partially_satisfied` -> course-planning item
- `unclear` -> credit-review item
- `counselor_review_required` -> counselor-question item
- `likely_satisfied` -> no urgent item unless counselor review is still required
- `satisfied` -> no task unless a review/local warning exists

High-risk missing requirements can also create a safe alternate-option planning item asking whether summer, online, or credit-recovery options are allowed. No provider, course, or schedule is named unless it exists in official backend data.

## Priority System

Priority order:

1. Critical missing named/core/assessment requirements.
2. Missing assessment or non-course requirements.
3. Missing core subject credits.
4. Low/unclear or counselor-review-required credits.
5. Missing total credits.
6. Missing electives.
7. Program/pathway or local-policy checks.
8. Informational items.

Grade 11 and 12 transfers raise priority for missing core and named requirements. Grade 9 and 10 transfers use calmer, longer-range timing.

## Timeline Logic

Timeline urgency comes from `grade_at_transfer` and `expected_graduation_year`:

- Grade 12: urgent
- Grade 11: high
- Grade 10: medium
- Grade 9: low
- Missing graduation year: unknown

Timing buckets include immediate, before course registration, current/next semester, summer, senior year, before graduation, ongoing, counselor meeting, and unknown.

## Counselor Checklist

The counselor checklist is generated from actual roadmap items and gap requirements. Questions use saved requirement names, categories, unclear course names, and saved gap counselor questions. They are not static examples.

## Georgia / Texas Behavior

The roadmap engine uses the selected destination framework ID from the saved gap analysis/profile. It does not mix state frameworks. If Georgia or Texas requirements are in the database and appear in saved gap results, the roadmap uses those saved rows. If a framework or requirement set is missing, the UI shows the honest not-ready state.

## Staleness

Roadmaps become stale when:

- gap analyses change
- credit mappings change
- transcript courses change
- destination framework, expected graduation year, or grade at transfer changes

The UI shows a stale warning only when the saved roadmap status/reason indicates staleness.

## Frontend

Route:

- `src/routes/roadmap.tsx`

The page supports:

- no profile/transcript/course/mapping/gap empty states
- generate roadmap
- regenerate stale/old roadmap
- active roadmap dashboard
- priority and timing sections
- counselor checklist
- completion tracking
- blocked/in-progress/done/skipped item status updates
- completion notes
- manual personal roadmap items

Students can edit personal task status and notes only. They cannot edit official requirement values from the roadmap page.

## Ready for Demo

Ready:

- backend roadmap generation from saved gap rows
- saved roadmap and item persistence
- authenticated API actions
- saved-data-only `/roadmap` UI
- staleness support
- unit/static tests for generation, migration, API, and no-mock production behavior

Still dependent on reference data:

- final Georgia/Texas requirement completeness
- final Tamil Nadu and Andhra Pradesh source framework data
- district/local policy detail
- official school-specific course catalogs

## Next Feature

The next feature should be counselor packet generation using confirmed transcript rows, confirmed/probable mappings, saved gap analysis, and saved roadmap items. It should remain a preview packet, not an official decision.
