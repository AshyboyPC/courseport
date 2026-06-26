import { parseTranscriptAiJson } from "./transcript-extraction-validator.ts";
import type { TranscriptAiProvider } from "./types.ts";

export function createMockTranscriptExtractor(): TranscriptAiProvider {
  return {
    id: "mock",
    isConfigured: () => true,
    extract: async (input) =>
      parseTranscriptAiJson({
        provider: "mock",
        model: "mock-transcript-extractor",
        rawJson: {
          document_metadata: {
            document_type: "transcript",
            academic_year: null,
            grade_level: null,
          },
          detected_source: { country: null, jurisdiction: null, curriculum: null, board: null },
          detected_languages: input.ocr.detectedLanguages.map((language) => ({
            language_code: language.languageCode,
            confidence: language.confidence ?? null,
          })),
          student_identity_fields: { student_name: null },
          institution_fields: { school_name: null },
          exam_certificate_fields: { exam_name: null, certificate_name: null },
          course_candidates: [
            {
              original_course_name: "Mathematics",
              translated_course_name: null,
              normalized_course_name: "mathematics",
              subject_category: "Mathematics",
              original_grade_value: "95/100",
              original_grade_scale: "100",
              max_marks: "100",
              obtained_marks: "95",
              credits: null,
              term_label: null,
              academic_year: null,
              page_number: 1,
              source_text: input.ocr.rawText.includes("Mathematics")
                ? "Mathematics 95/100"
                : input.ocr.rawText.slice(0, 80),
              extraction_confidence: 0.8,
              translation_confidence: null,
              needs_review: true,
              review_reason: "Mock extractor output is for tests only.",
            },
          ],
          total_marks_fields: { total_obtained: null, total_max: null },
          confidence: 0.8,
          warnings: [],
          missing_fields: [],
          review_reasons: ["Mock extractor output is for tests only."],
        },
      }),
  };
}
