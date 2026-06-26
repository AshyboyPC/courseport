export const TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT = `You extract structured academic transcript data from OCR output.

Rules:
- Return only JSON matching the requested schema.
- Use only evidence visible in the OCR text, tables, or page context.
- Do not invent course names, marks, school names, board names, years, credits, or source frameworks.
- Do not decide U.S. credit equivalency, graduation gaps, or official transfer outcomes.
- Preserve original course names.
- Translate course names into English when possible, but keep uncertainty as needs_review.
- Every course candidate must include source_text copied or closely traceable from OCR.
- If OCR text is insufficient, return an empty course_candidates array and explain why in warnings.
- Never auto-confirm anything.`;

export function buildTranscriptExtractionPrompt(input: {
  rawText: string;
  tableText: string;
  translatedTextEn?: string | null;
  pageCount: number;
  detectedLanguages: string;
  uploadedFile: string;
  profileContext: string;
}) {
  return `Extract academic transcript information from this OCR result.

Return JSON with this exact shape:
{
  "document_metadata": {
    "document_type": string | null,
    "academic_year": string | null,
    "grade_level": string | null
  },
  "detected_source": {
    "country": string | null,
    "jurisdiction": string | null,
    "curriculum": string | null,
    "board": string | null
  },
  "detected_languages": [{"language_code": string, "confidence": number | null}],
  "student_identity_fields": {"student_name": string | null},
  "institution_fields": {"school_name": string | null},
  "exam_certificate_fields": {"exam_name": string | null, "certificate_name": string | null},
  "course_candidates": [
    {
      "original_course_name": string,
      "translated_course_name": string | null,
      "normalized_course_name": string | null,
      "subject_category": string | null,
      "original_grade_value": string | null,
      "original_grade_scale": string | null,
      "max_marks": string | null,
      "obtained_marks": string | null,
      "credits": string | null,
      "term_label": string | null,
      "academic_year": string | null,
      "page_number": number | null,
      "source_text": string | null,
      "extraction_confidence": number | null,
      "translation_confidence": number | null,
      "needs_review": boolean,
      "review_reason": string | null
    }
  ],
  "total_marks_fields": {"total_obtained": string | null, "total_max": string | null},
  "confidence": number | null,
  "warnings": string[],
  "missing_fields": string[],
  "review_reasons": string[]
}

Uploaded file:
${input.uploadedFile}

Profile context, for comparison only:
${input.profileContext}

Detected OCR languages:
${input.detectedLanguages}

Page count: ${input.pageCount}

OCR table text:
${input.tableText || "(no OCR tables detected)"}

English academic translation, if available:
${input.translatedTextEn || "(not available or not needed)"}

OCR raw text:
${input.rawText}`;
}
