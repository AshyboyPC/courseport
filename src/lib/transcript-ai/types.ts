import type { NormalizedOcrResult, TranscriptCourseCandidateInput } from "../ocr/types.ts";

export type TranscriptAiProviderId = "openai" | "gemini" | "mock";

export type TranscriptAiExtractionInput = {
  ocr: NormalizedOcrResult;
  translatedTextEn?: string | null;
  primaryLanguageCode: string;
  uploadedFile: {
    fileName?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
  };
  profileContext?: {
    sourceCountry?: string | null;
    sourceJurisdiction?: string | null;
    sourceCurriculum?: string | null;
    destinationCountry?: string | null;
    destinationJurisdiction?: string | null;
    destinationFramework?: string | null;
  };
};

export type TranscriptAiCourseCandidate = {
  original_course_name: string;
  translated_course_name: string | null;
  normalized_course_name: string | null;
  subject_category: string | null;
  original_grade_value: string | null;
  original_grade_scale: string | null;
  max_marks: string | null;
  obtained_marks: string | null;
  credits: string | null;
  term_label: string | null;
  academic_year: string | null;
  page_number: number | null;
  source_text: string | null;
  extraction_confidence: number | null;
  translation_confidence: number | null;
  needs_review: boolean;
  review_reason: string | null;
};

export type TranscriptAiExtractionResult = {
  provider: TranscriptAiProviderId;
  model: string | null;
  document_metadata: {
    document_type?: string | null;
    academic_year?: string | null;
    grade_level?: string | null;
  };
  detected_source: {
    country?: string | null;
    jurisdiction?: string | null;
    curriculum?: string | null;
    board?: string | null;
  };
  detected_languages: Array<{ language_code: string; confidence?: number | null }>;
  student_identity_fields: Record<string, string | null>;
  institution_fields: Record<string, string | null>;
  exam_certificate_fields: Record<string, string | null>;
  course_candidates: TranscriptAiCourseCandidate[];
  total_marks_fields: Record<string, string | null>;
  confidence: number | null;
  warnings: string[];
  missing_fields: string[];
  review_reasons: string[];
  raw: unknown;
};

export type TranscriptAiProvider = {
  id: TranscriptAiProviderId;
  isConfigured: () => boolean;
  extract: (input: TranscriptAiExtractionInput) => Promise<TranscriptAiExtractionResult>;
};

export type TranscriptAiValidationResult = {
  fields: Record<string, string>;
  candidates: TranscriptCourseCandidateInput[];
  warnings: string[];
  rawResult: TranscriptAiExtractionResult;
};
