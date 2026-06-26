# Scholaport OCR Transcript Processing

**Updated:** June 25, 2026

## What is implemented

Scholaport now has the first real transcript-processing path:

1. The student uploads a PDF/JPG/PNG/WEBP transcript from `/transcript`.
2. The file is stored in the private Supabase `transcripts` bucket under the authenticated user ID.
3. `/api/v1/transcripts` starts server-side OCR and translation processing.
4. OCR output is normalized into one internal shape.
5. Language detection runs from provider language hints first, then deterministic script fallback.
6. Non-English academic text is translated into English.
7. Deterministic parsing extracts course candidates.
8. Detected source framework is compared with the onboarding profile.
9. Candidates are saved to `transcript_course_candidates`.
10. Only after student confirmation are rows copied into `transcript_courses`.

## OCR provider chain

Provider priority:

1. Google Document AI: `GOOGLE_DOCUMENT_AI_PROJECT_ID`, `GOOGLE_DOCUMENT_AI_LOCATION`, `GOOGLE_DOCUMENT_AI_PROCESSOR_ID`, plus `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_SERVICE_ACCOUNT_JSON`, or `GOOGLE_DOCUMENT_AI_ACCESS_TOKEN`
2. Azure Document Intelligence: `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`, `AZURE_DOCUMENT_INTELLIGENCE_KEY`

Production processing does not use Mistral, AWS Textract, or mock OCR. The mock OCR provider remains only for direct tests/local developer fixtures and is not enabled by `/api/v1/transcripts`. If no Google or Azure live OCR provider is configured, the transcript moves to manual-entry review.

## OCR normalization

All providers return `NormalizedOcrResult` from `src/lib/ocr/types.ts`:

- provider ID
- raw text
- detected languages
- pages
- layout blocks
- tables
- page structure
- bounding boxes where available
- average confidence
- warnings

Provider-specific raw JSON is stored privately on `transcripts.ocr_raw_json`, but the review API strips it from frontend responses.

## Language detection

`src/lib/translation/language-detection.ts` uses provider language codes first when confidence is reliable. If provider language confidence is missing or low, Scholaport falls back to deterministic script detection:

- Tamil script -> `ta`
- Devanagari/Hindi -> `hi`
- Arabic/Urdu script -> `ar` or `ur`
- Cyrillic -> `ru` or `uk` with uncertainty
- Chinese characters -> `zh`
- Latin script with Spanish academic keywords -> `es`
- English academic keywords -> `en`

Ambiguous language detection sets review warnings and contributes to `needs_review`.

## Parser behavior

`src/lib/ocr/transcript-parser.server.ts` is deterministic first:

- uses OCR tables when available
- recognizes translated and original headers
- supports subject/course, marks/grade, max marks/scale, credits/units, term/semester/year, result, exam labels
- preserves original course names
- attaches translated course names
- attaches OCR/translation confidence
- marks rows as `needs_review` when confidence is low or key fields are missing
- falls back to pipe-style line parsing if provider tables are absent
- falls back to manual entry when no course rows can be found

No equivalency, U.S. grade conversion, or U.S. credit conversion happens in this layer.

## Confidence thresholds

- OCR high: `>= 0.90`
- OCR medium: `>= 0.75`
- OCR low: `< 0.75`
- Translation high: `>= 0.90`
- Translation medium: `>= 0.75`
- Translation low: `< 0.75`
- Framework match high: `>= 0.85`

Review is required for low OCR confidence, low translation confidence, ambiguous language detection, table extraction failure, missing grades/marks, guessed subject category, low framework match confidence, and framework mismatch.

## Framework mismatch

`src/lib/ocr/framework-match.ts` detects likely source country/jurisdiction/curriculum from transcript text and language hints. It handles common signals like CBSE, ICSE, Tamil Nadu State Board, Andhra Pradesh Board, Bachillerato, and language-derived country hints.

If the detected source conflicts with onboarding, `/transcript` shows:

- profile framework
- OCR-detected framework
- use profile framework
- use detected framework
- mark for counselor review

Manual selection IDs are supported by the API for the next UI expansion.

## Manual fallback

Manual fallback is used when:

- no live OCR provider is configured
- live OCR fails
- translation fails
- no parseable table or course rows are found

Manual rows are added as `entry_method = 'manual_entry'`, remain editable, and are not saved to `transcript_courses` until confirmed.

## Security

- OCR and translation run server-side only.
- OCR/translation keys do not use `VITE_` names.
- Browser code never imports provider clients.
- Every API action verifies the bearer token and filters by `user_id`.
- Supabase RLS protects transcripts, candidate rows, confirmed courses, and private storage.
- Raw OCR JSON is not returned by the review API.
- Transcript text is not logged.

## Ready for demo

Ready:

- private upload
- server OCR provider selection
- server translation provider selection
- Tamil/Spanish academic translation tests
- language detection fallback
- candidate parsing
- side-by-side review UI
- framework mismatch UI
- manual entry fallback
- confirmation into `transcript_courses`

Needs real credentials:

- Google Document AI credentials or Azure Document Intelligence credentials
- Gemini or OpenAI translation credentials
- applied Supabase migration in the target project
