# Scholaport Translation Transcript Review

**Updated:** June 25, 2026

## Translation provider chain

Provider priority:

1. Gemini: `GEMINI_API_KEY`
2. OpenAI: `OPENAI_API_KEY`
3. Mock translation only when `SCHOLAPORT_ALLOW_MOCK_TRANSCRIPT_PROCESSING=true`

Production processing does not silently use mock translation. If a transcript needs translation and no live translation provider is configured, Scholaport moves the transcript to manual-entry/manual-review status.

## Translation output shape

All providers return `AcademicTranslationResult` from `src/lib/translation/types.ts`:

- provider ID
- source language code
- target language `en`
- original text
- translated English text
- confidence
- field-level translations
- warnings

Field-level translations include academic field types such as student name, school name, board name, course name, subject category, grade label, result label, exam name, header, and table cell.

## Academic translation rules

The translation prompt in `src/lib/translation/academic-translation-prompts.ts` requires education-aware translation:

- preserve original course names
- translate course names into English academic equivalents
- preserve marks exactly
- preserve max marks exactly
- preserve grades/scales exactly
- preserve credits/units exactly
- preserve exam/session labels
- never convert foreign grades into U.S. grades
- never convert marks into U.S. credits
- never decide equivalency
- mark uncertain translations for review

Examples covered by tests and dictionary fallback:

- `கணிதம்` -> `Mathematics`
- `அறிவியல்` -> `Science`
- `சமூக அறிவியல்` -> `Social Science`
- `Biología 2` -> `Biology II`
- `भौतिकी` -> `Physics`
- `دراسات اجتماعية` -> `Social Studies`
- `Matemáticas` -> `Mathematics`

## Tamil behavior

Tamil transcript handling preserves the original Tamil text and produces English academic equivalents for review. Scholaport does not transliterate only. It keeps both:

- `course_name_original`
- `course_name_translated`

If translation confidence is low or uncertain, the row is marked `needs_review`, and the user edits the English translation before confirmation.

## Original plus translated storage

Transcript-level storage:

- `ocr_raw_text`
- `ocr_raw_json`
- `primary_language_code`
- `ocr_language_codes`
- `translated_text_en`
- `translation_confidence`
- `translation_provider`

Candidate/confirmed course storage:

- `course_name_original`
- `course_name_translated`
- `original_language_code`
- `translated_language_code`
- `source_text`
- `translated_source_text`
- `extraction_confidence`
- `translation_confidence`
- `student_confirmed`
- `needs_review`
- `review_reason`

## Review UI behavior

`/transcript` shows:

- original OCR text on the left
- English academic translation on the right
- editable structured course rows below
- confidence labels
- review reasons
- profile framework
- detected transcript framework
- mismatch actions
- manual-entry form

Editable fields:

- original course name
- English translation
- subject category
- grade/marks
- max marks/scale
- credits/units
- term/year
- review reason

Rows stay candidates until the student confirms the final list.

## Manual fallback

If OCR or translation fails:

1. Scholaport preserves the upload record.
2. The transcript is marked for manual entry.
3. The student enters exact course names and grades.
4. Manual rows are saved as candidates.
5. Confirmed rows are copied into `transcript_courses`.

Manual entry does not mark a transcript as officially converted, automatically approved, or mapped.

## What remains for future mapping

This layer intentionally does not perform:

- foreign-to-U.S. grade conversion
- credit conversion
- equivalency decisions
- graduation gap decisions
- counselor packet finalization

Confirmed transcript rows are ready as input for future credit mapping, gap analysis, Pori, and counselor packet workflows.
