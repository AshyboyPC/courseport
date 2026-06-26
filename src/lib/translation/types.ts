export type TranslationProviderId = "gemini" | "openai" | "mock";

export type AcademicTranslatedFieldType =
  | "student_name"
  | "school_name"
  | "board_name"
  | "course_name"
  | "subject_category"
  | "grade_label"
  | "result_label"
  | "exam_name"
  | "header"
  | "table_cell"
  | "other";

export type AcademicTranslationResult = {
  provider: TranslationProviderId;
  sourceLanguageCode: string;
  targetLanguageCode: "en";
  originalText: string;
  translatedText: string;
  confidence?: number;
  translatedFields: Array<{
    fieldType: AcademicTranslatedFieldType;
    originalText: string;
    translatedText: string;
    sourceLanguageCode?: string;
    confidence?: number;
    preserveOriginal?: boolean;
  }>;
  warnings: string[];
};

export type AcademicTranslationInput = {
  text: string;
  sourceLanguageCode: string;
  targetLanguageCode?: "en";
  fieldHints?: Array<{
    fieldType: AcademicTranslatedFieldType;
    text: string;
    languageCode?: string;
  }>;
};

export type TranslationProvider = {
  id: TranslationProviderId;
  isConfigured: () => boolean;
  translate: (input: AcademicTranslationInput) => Promise<AcademicTranslationResult>;
};

export type LanguageDetectionResult = {
  primaryLanguageCode: string;
  confidence: number;
  languages: Array<{
    languageCode: string;
    confidence: number;
    source: "provider" | "script_fallback";
  }>;
  ambiguous: boolean;
  warnings: string[];
};
