import type {
  AcademicTranslatedFieldType,
  AcademicTranslationInput,
  AcademicTranslationResult,
  TranslationProvider,
} from "../types.ts";

type DictionaryEntry = {
  translatedText: string;
  fieldType?: AcademicTranslatedFieldType;
  confidence?: number;
};

const DICTIONARY: Record<string, DictionaryEntry> = {
  "மாணவர் பெயர்": { translatedText: "Student Name", fieldType: "header" },
  பள்ளி: { translatedText: "School", fieldType: "header" },
  வாரியம்: { translatedText: "Board", fieldType: "board_name" },
  "தமிழ்நாடு மாநில வாரியம்": {
    translatedText: "Tamil Nadu State Board",
    fieldType: "board_name",
  },
  கல்வியாண்டு: { translatedText: "Academic Year", fieldType: "header" },
  வகுப்பு: { translatedText: "Class", fieldType: "header" },
  பாடம்: { translatedText: "Subject", fieldType: "header" },
  மதிப்பெண்: { translatedText: "Marks", fieldType: "grade_label" },
  அதிகபட்சம்: { translatedText: "Max Marks", fieldType: "grade_label" },
  முடிவு: { translatedText: "Result", fieldType: "result_label" },
  தேர்ச்சி: { translatedText: "Pass", fieldType: "result_label" },
  தமிழ்: { translatedText: "Tamil", fieldType: "course_name" },
  ஆங்கிலம்: { translatedText: "English", fieldType: "course_name" },
  கணிதம்: { translatedText: "Mathematics", fieldType: "course_name" },
  அறிவியல்: { translatedText: "Science", fieldType: "course_name" },
  "சமூக அறிவியல்": { translatedText: "Social Science", fieldType: "course_name" },
  உயிரியல்: { translatedText: "Biology", fieldType: "course_name" },
  இயற்பியல்: { translatedText: "Physics", fieldType: "course_name" },
  வேதியியல்: { translatedText: "Chemistry", fieldType: "course_name" },
  பாடப்பிரிவு: { translatedText: "Subject", fieldType: "header" },
  "विद्यार्थी नाम": { translatedText: "Student Name", fieldType: "header" },
  विद्यालय: { translatedText: "School", fieldType: "header" },
  विषय: { translatedText: "Subject", fieldType: "header" },
  अंक: { translatedText: "Marks", fieldType: "grade_label" },
  गणित: { translatedText: "Mathematics", fieldType: "course_name" },
  भौतिकी: { translatedText: "Physics", fieldType: "course_name" },
  जीवविज्ञान: { translatedText: "Biology", fieldType: "course_name" },
  "دراسات اجتماعية": { translatedText: "Social Studies", fieldType: "course_name" },
  الرياضيات: { translatedText: "Mathematics", fieldType: "course_name" },
  العلوم: { translatedText: "Science", fieldType: "course_name" },
  مادة: { translatedText: "Subject", fieldType: "header" },
  درجة: { translatedText: "Marks", fieldType: "grade_label" },
  asignatura: { translatedText: "Subject", fieldType: "header" },
  materia: { translatedText: "Subject", fieldType: "header" },
  curso: { translatedText: "Course", fieldType: "header" },
  calificación: { translatedText: "Grade", fieldType: "grade_label" },
  calificacion: { translatedText: "Grade", fieldType: "grade_label" },
  nota: { translatedText: "Grade", fieldType: "grade_label" },
  matemáticas: { translatedText: "Mathematics", fieldType: "course_name" },
  matematicas: { translatedText: "Mathematics", fieldType: "course_name" },
  "biología 2": { translatedText: "Biology II", fieldType: "course_name" },
  biología: { translatedText: "Biology", fieldType: "course_name" },
  biologia: { translatedText: "Biology", fieldType: "course_name" },
  física: { translatedText: "Physics", fieldType: "course_name" },
  fisica: { translatedText: "Physics", fieldType: "course_name" },
  química: { translatedText: "Chemistry", fieldType: "course_name" },
  quimica: { translatedText: "Chemistry", fieldType: "course_name" },
  historia: { translatedText: "History", fieldType: "course_name" },
  ciencias: { translatedText: "Science", fieldType: "course_name" },
  "ciencias sociales": { translatedText: "Social Science", fieldType: "course_name" },
  aprobado: { translatedText: "Pass", fieldType: "result_label" },
};

function normalizeKey(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function translateAcademicTerm(text: string): DictionaryEntry | null {
  const exact = DICTIONARY[text.trim()];
  if (exact) return exact;
  return DICTIONARY[normalizeKey(text)] ?? null;
}

function translateLine(line: string) {
  let translated = line;
  const fields: AcademicTranslationResult["translatedFields"] = [];
  for (const [originalText, entry] of Object.entries(DICTIONARY).sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    const escaped = originalText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern =
      /[A-Za-zÀ-ÿ]/.test(originalText) && originalText === normalizeKey(originalText)
        ? new RegExp(`\\b${escaped}\\b`, "gi")
        : new RegExp(escaped, "g");
    if (pattern.test(translated)) {
      translated = translated.replace(pattern, entry.translatedText);
      fields.push({
        fieldType: entry.fieldType ?? "other",
        originalText,
        translatedText: entry.translatedText,
        sourceLanguageCode: undefined,
        confidence: entry.confidence ?? 0.92,
        preserveOriginal: true,
      });
    }
  }
  return { translated, fields };
}

export function createMockTranslationProvider(): TranslationProvider {
  return {
    id: "mock",
    isConfigured: () => true,
    translate: async (input: AcademicTranslationInput): Promise<AcademicTranslationResult> => {
      if (input.sourceLanguageCode === "en") {
        return {
          provider: "mock",
          sourceLanguageCode: "en",
          targetLanguageCode: "en",
          originalText: input.text,
          translatedText: input.text,
          confidence: 1,
          translatedFields: [],
          warnings: [],
        };
      }

      const translatedLines: string[] = [];
      const translatedFields: AcademicTranslationResult["translatedFields"] = [];
      for (const line of input.text.split(/\r?\n/)) {
        const { translated, fields } = translateLine(line);
        translatedLines.push(translated);
        translatedFields.push(
          ...fields.map((field) => ({ ...field, sourceLanguageCode: input.sourceLanguageCode })),
        );
      }

      const changed = translatedFields.length > 0;
      return {
        provider: "mock",
        sourceLanguageCode: input.sourceLanguageCode,
        targetLanguageCode: "en",
        originalText: input.text,
        translatedText: translatedLines.join("\n"),
        confidence: changed ? 0.9 : 0.62,
        translatedFields,
        warnings: changed
          ? ["Mock translation was used; student review is required before Scholaport uses it."]
          : [
              "Mock translation could not confidently translate this transcript; manual English review is required.",
            ],
      };
    },
  };
}
