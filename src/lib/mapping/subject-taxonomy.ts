import type { SubjectCategory } from "@/lib/mapping/types";

const aliasMap: Array<{ category: SubjectCategory; aliases: string[] }> = [
  {
    category: "mathematics",
    aliases: [
      "math",
      "mathematics",
      "maths",
      "algebra",
      "geometry",
      "trigonometry",
      "calculus",
      "statistics",
      "गणित",
      "கணிதம்",
      "matemáticas",
      "matematicas",
    ],
  },
  {
    category: "science",
    aliases: [
      "science",
      "biology",
      "chemistry",
      "physics",
      "environmental science",
      "botany",
      "zoology",
      "உயிரியல்",
      "இயற்பியல்",
      "வேதியியல்",
      "विज्ञान",
      "भौतिकी",
      "रसायन",
      "जीव विज्ञान",
      "biología",
      "biologia",
      "química",
      "quimica",
      "física",
      "fisica",
    ],
  },
  {
    category: "social_studies",
    aliases: [
      "history",
      "geography",
      "civics",
      "economics",
      "political science",
      "social science",
      "social studies",
      "சமூக அறிவியல்",
      "வரலாறு",
      "புவியியல்",
      "इतिहास",
      "भूगोल",
      "नागरिक",
      "historia",
      "geografía",
      "geografia",
    ],
  },
  {
    category: "english_language_arts",
    aliases: [
      "english",
      "english language",
      "english literature",
      "language arts",
      "communicative english",
      "ela",
    ],
  },
  {
    category: "world_language",
    aliases: [
      "tamil",
      "hindi",
      "spanish",
      "french",
      "arabic",
      "urdu",
      "mandarin",
      "chinese",
      "telugu",
      "bengali",
      "marathi",
      "malayalam",
      "kannada",
      "தமிழ்",
      "हिन्दी",
      "हिंदी",
      "español",
      "français",
    ],
  },
  {
    category: "computer_science",
    aliases: [
      "computer science",
      "information technology",
      "informatics",
      "ict",
      "coding",
      "programming",
      "computer applications",
      "கணினி",
    ],
  },
  {
    category: "physical_education",
    aliases: ["physical education", "pe", "p.e.", "sports", "yoga", "உடற்கல்வி"],
  },
  { category: "health", aliases: ["health", "wellness", "சுகாதாரம்"] },
  {
    category: "arts",
    aliases: ["art", "music", "dance", "visual arts", "performing arts", "fine arts"],
  },
  {
    category: "career_technical",
    aliases: [
      "vocational",
      "cte",
      "ctae",
      "business studies",
      "accounting",
      "entrepreneurship",
      "agriculture",
      "engineering drawing",
      "commerce",
    ],
  },
  {
    category: "financial_literacy",
    aliases: ["personal finance", "financial literacy"],
  },
];

export function normalizeCourseName(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s&.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifySubjectDeterministically(input: {
  original?: string | null;
  translated?: string | null;
  providedCategory?: string | null;
}): { category: SubjectCategory; matchedAlias?: string; confidence: "high" | "medium" | "low" } {
  const provided = normalizeCourseName(input.providedCategory);
  const haystack = normalizeCourseName(
    `${input.translated ?? ""} ${input.original ?? ""} ${input.providedCategory ?? ""}`,
  );
  for (const entry of aliasMap) {
    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeCourseName(alias);
      if (provided === normalizedAlias || haystack === normalizedAlias) {
        return { category: entry.category, matchedAlias: alias, confidence: "high" };
      }
      if (haystack.includes(normalizedAlias)) {
        return { category: entry.category, matchedAlias: alias, confidence: "medium" };
      }
    }
  }
  if (haystack.includes("language")) {
    return { category: "world_language", matchedAlias: "language", confidence: "low" };
  }
  return { category: "unclear", confidence: "low" };
}

export function isStateSpecificRequirement(text: string | null | undefined) {
  const normalized = normalizeCourseName(text);
  return /\b(us|u s|united states|georgia|texas|civics|government|economics|constitution|state history|american history)\b/.test(
    normalized,
  );
}
