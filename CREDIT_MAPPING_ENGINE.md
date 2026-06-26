# Scholaport Credit Mapping Engine

## Purpose

The credit mapping engine turns confirmed transcript courses into probable destination credit
mapping candidates. It does not make official school decisions, convert marks to GPA, run gap
analysis, generate a roadmap, or create a counselor packet.

The output is a counselor-ready preview:

- original and translated course name;
- likely source and destination subject category;
- probable U.S. equivalent;
- destination requirement bucket;
- possible credit value when safely available;
- confidence;
- evidence summary;
- warnings; and
- counselor review flag.

Safe UI language is intentional: "probable mapping", "possible credit", "needs counselor review",
and "final credit decisions are made by your school."

## Pipeline

The engine follows this order for each confirmed transcript course:

1. Existing verified `mapping_rules`, when available.
2. Exact source curriculum-course and destination-requirement category match.
3. Deterministic multilingual subject taxonomy.
4. Vector similarity, when embeddings are available.
5. Structured-output AI classifier, only when a server-side AI key is configured.
6. Counselor review when the result remains uncertain.

The current implementation includes the deterministic pipeline, rule/exact-reference checks, a
server-only structured AI provider abstraction, and a vector hook that safely skips when embedding
configuration is unavailable. No mock provider is used by the production transcript API path.

## Deterministic Rules

`src/lib/mapping/subject-taxonomy.ts` classifies common course labels into:

- `english_language_arts`
- `mathematics`
- `science`
- `social_studies`
- `world_language`
- `physical_education`
- `health`
- `arts`
- `career_technical`
- `computer_science`
- `financial_literacy`
- `elective`
- `unclear`

Aliases include English, Tamil, Hindi, and Spanish examples such as `கணிதம்`, `भौतिकी`,
`Matemáticas`, Biology, Chemistry, Algebra, Social Science, English Literature, Tamil, Hindi,
Computer Applications, PE, and Business Studies.

## Structured AI

Structured AI providers live under `src/lib/ai/structured-output/`.

Priority:

1. OpenAI when `OPENAI_API_KEY` is configured.
2. Gemini when `GEMINI_API_KEY` is configured.
3. Mock provider only when explicitly allowed by tests/local callers.

The schema is strict and returns only JSON with subject category, probable equivalent, requirement
bucket, possible credit value, confidence, counselor review flag, evidence summary, and warnings.

The prompt forbids:

- official transfer claims;
- GPA conversion;
- satisfying U.S.-specific history/government/civics requirements without direct evidence;
- using AI guesses as final decisions.

## Confidence

High confidence is reserved for verified mapping rules or exact/evidenced category matches with no
state-specific restriction.

Medium confidence is used for broad subject buckets that are likely correct but not exact course
equivalency decisions.

Low confidence is used when a course is ambiguous, the destination requirement is specific, the
reference data is partial, or credits are unclear.

Unclear is used when no safe bucket can be identified or the destination framework is missing.

## Counselor Review

Counselor review is required when:

- confidence is low or unclear;
- the destination requirement is U.S./state-specific;
- source or destination framework data is incomplete;
- credits or units are missing;
- the course is social studies, health, PE, interdisciplinary, or manually overridden;
- local school or district evaluation is likely required.

## Database

The additive migration is:

`supabase/migrations/202606250002_credit_mapping_engine.sql`

It expands `credit_mappings` with candidate/review fields and adds `credit_mapping_runs` to group
mapping attempts. It also creates `reference_embeddings` for future pgvector-backed reference search.

Confirmed mappings remain separate from official decisions. A `student_confirmed` mapping means the
student reviewed the preview, not that a school has approved the credit.

## India To U.S. MVP Behavior

The MVP path supports confirmed transcript courses from India into a selected U.S. destination
framework such as Georgia or Texas when present.

Examples:

- CBSE/Tamil/Hindi Mathematics -> likely Mathematics credit, counselor checks amount.
- Science -> likely Science/general science bucket.
- Social Science -> possible Social Studies/general credit, not U.S. History/Government.
- English Language & Literature -> likely English/Language Arts.
- Tamil or Hindi -> likely World Language/elective with review.
- Yoga/Physical Education -> possible PE/elective with review.
- Computer Applications -> possible Computer Science/Technology/elective.

## Next Feature

Gap analysis should consume:

- `mapped_subject_category`
- `destination_requirement_id`
- `requirement_bucket`
- `possible_credit_value`
- `mapping_confidence`
- `counselor_review_required`

It should not treat low/unclear or counselor-review mappings as final satisfied requirements.
