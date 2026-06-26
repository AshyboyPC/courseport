# Scholaport Counselor-Ready Packet Engine

## Scope

The counselor packet engine assembles a saved packet from the student's already persisted Scholaport workflow:

`student profile` -> `confirmed transcript courses` -> `credit mappings` -> `gap analysis` -> `roadmap` -> `packet snapshot`.

It does not redo OCR, translation, credit mapping, gap analysis, or roadmap generation. It does not create official transcript evaluations, official course equivalencies, official graduation plans, Pori/RAG responses, PathMatch, Twin Connect, mobile flows, or deployment artifacts.

## Backend-First / No Mock Production Data

Packet content is generated only from real backend rows:

- `student_profiles`
- `transcripts`
- confirmed `transcript_courses`
- latest `credit_mapping_runs` when present
- `credit_mappings`
- latest saved `gap_analyses`
- saved `gap_requirements`
- latest saved `roadmaps`
- saved `roadmap_items`
- destination framework and requirement records
- linked `reference_record_sources` and `data_sources`

The `/packet` page renders `counselor_packets.packet_snapshot_json` and `counselor_packet_sections`. It does not contain static demo packet sections, fake counselor questions, fixed demo dates, hardcoded Georgia/Texas examples, fake transcript rows, fake mappings, or fake source links.

## Database

Migration:

- `supabase/migrations/202606250005_counselor_packet_engine.sql`

The migration extends the existing `counselor_packets` table and adds optional section rows in `counselor_packet_sections`.

Added/reused packet fields include:

- `credit_mapping_run_id`
- `gap_analysis_id`
- `roadmap_id`
- destination country/jurisdiction/framework IDs
- packet status/type/version/title
- summary and disclaimer text
- `packet_snapshot_json`
- included/missing sections
- warnings, counselor questions, source summary
- generated file metadata fields
- printable HTML/PDF metadata fields
- stale reason and timestamps

The existing packet RLS remains owner-scoped. The new section table has owner-scoped RLS.

## Packet Generation

Main service:

- `generateCounselorPacket({ userId, transcriptId, gapAnalysisId, roadmapId })`

The service:

1. Verifies the authenticated user owns the profile.
2. Loads a confirmed transcript.
3. Loads confirmed transcript courses only.
4. Requires saved credit mappings.
5. Loads the latest saved gap analysis and gap requirements.
6. Loads the latest saved roadmap and roadmap items.
7. Loads destination framework and graduation requirements.
8. Loads linked framework/requirement provenance where available.
9. Builds a packet snapshot from real rows.
10. Saves a `counselor_packets` row.
11. Saves `counselor_packet_sections` rows.

For the MVP full packet, generation is blocked until transcript, mapping, gap, and roadmap records exist. Missing provenance is shown honestly rather than blocking packet generation.

## Sections

Implemented saved sections:

1. Cover Page
2. Student Academic Snapshot
3. Transcript Summary
4. Original + Translated Transcript Course List
5. Probable Credit Mapping Summary
6. Graduation Gap Summary
7. Requirement-by-Requirement Checklist
8. Academic Roadmap Summary
9. Counselor Meeting Checklist
10. Review Flags and Limitations
11. Source / Provenance Summary
12. Attachments / Original Transcript Reference

Each section either renders real saved data or a saved missing-data/review warning.

## Printable Preview and PDF

The backend builds a printable HTML representation from the saved packet snapshot. The current app exposes browser print/save-as-PDF from the saved snapshot preview.

Native PDF generation is not forced into this runtime. The packet stores an honest `pdf_generation_error` explaining that PDF generation is not configured, and packet status remains `needs_review`/`html_ready`, not `pdf_ready`.

## Storage

Generated PDF/HTML file storage is not configured in this runtime. The packet table has private storage metadata fields for future use, but the UI does not expose raw storage paths. If no stored file exists, download requests return an honest error and the printable preview remains available.

Future storage should use a private bucket such as `counselor-packets` with user-scoped paths and short-lived signed URLs after ownership verification.

## Source / Provenance

The packet source summary uses linked `reference_record_sources` and `data_sources` for:

- destination framework records
- graduation requirement records

If no source is linked, the packet states that the source is not yet linked in the Scholaport reference database. It does not invent URLs, citations, source authorities, or page numbers.

## Staleness

Packets become stale when:

- transcript metadata changes
- confirmed transcript courses change
- credit mappings change
- gap analysis changes
- roadmap changes
- destination framework, jurisdiction, expected graduation year, or grade at transfer changes

The UI shows the stale warning only when the saved packet status/reason indicates staleness.

## Security

- Packet operations verify user ownership.
- The snapshot excludes raw OCR JSON and raw storage paths.
- The UI does not expose generated storage paths.
- No service-role keys or AI provider keys are used in browser code.
- RLS protects packet rows and packet section rows.

## Georgia / Texas Behavior

The packet uses the selected destination framework saved in the workflow. It does not mix Georgia and Texas requirements. Any Georgia/Texas detail shown must come from saved framework, requirement, gap, roadmap, and provenance records. Missing state detail is shown as missing or review-needed; it is not filled with examples.

## Ready for Demo

Ready:

- full backend packet assembly from saved workflow records
- persisted packet snapshot
- persisted packet section rows
- saved-data-only packet preview UI
- browser print/save-as-PDF preview
- stale packet handling
- provenance summary with missing-source honesty

Still dependent on final data:

- final Georgia/Texas requirement/provenance coverage
- final Tamil Nadu and Andhra Pradesh source framework data
- production PDF rendering service
- private packet file storage and signed download URLs

## Next Feature

The next feature should be a production export/share layer: private packet file generation, short-lived signed URLs, and optionally a counselor-safe sharing workflow. It should still avoid official-decision language.
