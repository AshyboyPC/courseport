# Scholaport Graduation Gap Analysis Engine

## Purpose

The Graduation Gap Analysis Engine compares confirmed transcript courses and probable credit
mappings against the selected destination graduation framework. It produces a counselor-ready
preview of requirements that look likely satisfied, possibly satisfied, missing, unclear, or in need
of counselor review.

It does not make official graduation decisions. It does not generate a roadmap, counselor packet,
Pori/RAG advice, PathMatch output, or deployment workflow.

## Inputs

The engine uses persisted Scholaport data:

- `student_profiles`
- `transcripts`
- `transcript_courses`
- `credit_mapping_runs`
- `credit_mappings`
- `destination_graduation_frameworks`
- `graduation_requirements`
- reference IDs for source and destination framework context

Transcript courses must be confirmed first. Credit mappings must exist first. Destination framework
and requirements must be present.

## Calculation Pipeline

For each selected destination graduation requirement:

1. Load mappings for the confirmed transcript.
2. Match mappings by `destination_requirement_id` first.
3. Fall back to `mapped_subject_category` / `requirement_bucket` when no requirement ID exists.
4. Separate credit totals by high, medium, low, and unclear confidence.
5. Count high-confidence, no-review mappings as likely earned.
6. Count medium-confidence mappings as possible/partial.
7. Keep low and unclear mappings as review evidence only.
8. Ignore rejected or replaced mappings.
9. Protect named state-specific requirements from generic foreign coursework.
10. Save requirement-level gap rows and an overall gap summary.

## Status And Risk

Requirement statuses:

- `satisfied`
- `likely_satisfied`
- `partially_satisfied`
- `missing`
- `unclear`
- `not_applicable`
- `counselor_review_required`

Risk levels:

- `green`: likely satisfied
- `yellow`: partial, medium-confidence, local-control, or counselor-review issue
- `red`: missing required credit/course/assessment
- `gray`: not applicable or insufficient verified framework data

## Counselor Review Rules

Counselor review is required when:

- mappings are low or unclear confidence;
- a mapping is medium-confidence and affects a core requirement;
- a requirement is local-control-heavy;
- a state-specific requirement such as U.S. History, Government, EOC, STAAR, Georgia EOC, Health, or PE is involved;
- transfer-credit amount is not certain;
- the destination framework is partial.

## Georgia And Texas Safety

Generic foreign Social Science does not automatically satisfy U.S. History, Government, Civics, or
state-specific requirements. Coursework does not satisfy EOC/STAAR/assessment requirements unless a
specific mapping and official framework rule support that.

Georgia combined buckets such as CTAE / World Language / Fine Arts and Health & PE are handled as
requirement buckets when represented in the database. Exact placement still requires review when
the mapping is not high-confidence and requirement-specific.

Texas state and local requirements are shown as counselor-review or missing unless the reference
data explicitly supports satisfaction.

## Stale Analyses

The migration adds database triggers that mark completed/needs-review gap analyses as `stale` when
credit mappings or confirmed transcript courses change. The UI shows a stale warning and allows
regeneration.

## Demo Readiness

Ready for the current Shark Tank path:

1. Confirm transcript courses.
2. Generate probable credit mappings.
3. Run gap analysis.
4. Review green/yellow/red/gray requirement cards.
5. Bring generated counselor questions to official school review.

Quality depends on the destination framework and graduation requirements in Supabase. Georgia and
Texas behavior improves as their state framework rows become more complete.

## Next Feature

Roadmap generation should consume saved `gap_analyses` and `gap_requirements`, but it should not
treat yellow/red requirements as completed. It should plan next steps around missing,
partially-satisfied, and counselor-review requirements.
