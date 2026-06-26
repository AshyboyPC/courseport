export type OcrProviderId =
  | "mistral_ocr"
  | "google_document_ai"
  | "azure_document_intelligence"
  | "aws_textract"
  | "mock";

export type OcrBlockType = "line" | "word" | "table" | "cell" | "kvp" | "paragraph" | "unknown";

export type NormalizedOcrResult = {
  provider: OcrProviderId;
  rawText: string;
  detectedLanguages: Array<{
    languageCode: string;
    confidence?: number;
  }>;
  pages: Array<{
    pageNumber: number;
    width?: number;
    height?: number;
    text: string;
    blocks: Array<{
      type: OcrBlockType;
      text: string;
      languageCode?: string;
      confidence?: number;
      boundingBox?: unknown;
      rowIndex?: number;
      columnIndex?: number;
    }>;
    tables: Array<{
      rows: Array<
        Array<{
          text: string;
          languageCode?: string;
          confidence?: number;
          boundingBox?: unknown;
        }>
      >;
    }>;
  }>;
  averageConfidence?: number;
  warnings: string[];
};

export type OcrFileInput = {
  transcriptId?: string;
  fileName?: string | null;
  mimeType?: string | null;
  bytes: ArrayBuffer | Uint8Array;
};

export type OcrProvider = {
  id: OcrProviderId;
  isConfigured: () => boolean;
  extract: (input: OcrFileInput) => Promise<NormalizedOcrResult>;
};

export type DetectedTranscriptLanguage = {
  languageCode: string;
  confidence: number;
  source: "provider" | "script_fallback";
};

export type TranscriptLanguageDetection = {
  primaryLanguageCode: string;
  confidence: number;
  languages: DetectedTranscriptLanguage[];
  ambiguous: boolean;
  warnings: string[];
};

export type ParsedTranscriptFieldType =
  | "student_name"
  | "school_name"
  | "board_name"
  | "issuing_country"
  | "issuing_state_province_jurisdiction"
  | "document_language"
  | "academic_year_session"
  | "grade_class_level"
  | "term_semester_year"
  | "exam_name";

export type ParsedTranscriptFields = Partial<Record<ParsedTranscriptFieldType, string>>;

export type TranscriptCourseCandidateInput = {
  course_name_original: string;
  course_name_translated: string | null;
  course_name_normalized: string | null;
  original_language_code: string | null;
  translated_language_code: "en" | null;
  subject_category: string | null;
  grade_original: string | null;
  grade_normalized: number | null;
  grade_scale_original: string | null;
  max_marks: string | null;
  credits_or_units: string | null;
  term_label_original: string | null;
  term_label_translated: string | null;
  academic_year: string | null;
  grade_level: number | null;
  page_number: number | null;
  source_text: string | null;
  translated_source_text: string | null;
  bounding_box_json: unknown | null;
  extraction_confidence: number | null;
  translation_confidence: number | null;
  entry_method:
    | "ocr_extracted"
    | "ocr_translated"
    | "student_edited"
    | "manual_entry"
    | "profile_template"
    | "counselor_added";
  student_confirmed: boolean;
  needs_review: boolean;
  review_reason: string | null;
};

export type TranscriptParseResult = {
  fields: ParsedTranscriptFields;
  courses: TranscriptCourseCandidateInput[];
  tableDetected: boolean;
  needsReview: boolean;
  warnings: string[];
};

export type TranscriptProcessingStatus =
  | "not_started"
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | "needs_review"
  | "manual_entry";

export type TranslationProcessingStatus =
  | "not_needed"
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | "needs_review"
  | "manual_entry";
