export const ACADEMIC_TRANSLATION_SYSTEM_PROMPT = `You translate international school transcripts for Scholaport review.
Return education-aware English translations while preserving original academic meaning.
Rules:
- Preserve original course names separately from translated course names.
- Translate course names into English academic equivalents when possible.
- Preserve marks, max marks, scales, credits, units, exam labels, and session labels exactly.
- Never convert foreign grades into U.S. grades.
- Never convert marks into U.S. credits.
- Never decide equivalency or credit awards.
- If uncertain, keep the original text and mark the field as needing review with lower confidence.
- For Tamil, translate meaning rather than transliterating only. Example: கணிதம் -> Mathematics, அறிவியல் -> Science, சமூக அறிவியல் -> Social Science.`;

export function buildAcademicTranslationPrompt(input: {
  sourceLanguageCode: string;
  targetLanguageCode: "en";
  text: string;
}) {
  return `Source language: ${input.sourceLanguageCode}
Target language: ${input.targetLanguageCode}

Translate the transcript text into English for academic review. Return strict JSON matching:
{
  "translatedText": "full English academic translation",
  "confidence": 0.0,
  "translatedFields": [
    {
      "fieldType": "student_name|school_name|board_name|course_name|subject_category|grade_label|result_label|exam_name|header|table_cell|other",
      "originalText": "source text",
      "translatedText": "English text",
      "confidence": 0.0,
      "preserveOriginal": true
    }
  ],
  "warnings": ["..."]
}

Transcript text:
${input.text}`;
}
