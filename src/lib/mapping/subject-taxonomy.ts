import type { SubjectCategory } from "@/lib/mapping/types";
import { SUBJECT_CATEGORIES } from "@/lib/mapping/types";

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

const categoryAliases = new Map<string, SubjectCategory>(
  SUBJECT_CATEGORIES.flatMap((category) => [
    [category, category],
    [category.replaceAll("_", " "), category],
  ]),
);

export function normalizeSubjectCategory(value: string | null | undefined): SubjectCategory {
  const normalized = normalizeCourseName(value).replace(/&/g, "and");
  const compact = normalized.replace(/\s+/g, "_");
  const direct = categoryAliases.get(normalized) ?? categoryAliases.get(compact);
  if (direct) return direct;
  if (/\bmath|mathematics|algebra|geometry|calculus\b/.test(normalized)) return "mathematics";
  if (/\bscience|biology|chemistry|physics|botany|zoology\b/.test(normalized)) return "science";
  if (/\bsocial|history|geography|civics|government|economics\b/.test(normalized)) {
    return "social_studies";
  }
  if (/\benglish|language arts|literature|ela\b/.test(normalized)) {
    return "english_language_arts";
  }
  if (/\bworld language|foreign language|lote|tamil|hindi|spanish|french|arabic|urdu|chinese\b/.test(normalized)) {
    return "world_language";
  }
  if (/\bcomputer|informatics|ict|coding|programming\b/.test(normalized)) {
    return "computer_science";
  }
  if (/\bphysical education|p e|pe|sports|yoga\b/.test(normalized)) {
    return "physical_education";
  }
  if (/\bhealth|wellness\b/.test(normalized)) return "health";
  if (/\bart|music|dance|fine arts|visual arts|performing arts\b/.test(normalized)) return "arts";
  if (/\bcareer|technical|cte|ctae|vocational|business|accounting|commerce\b/.test(normalized)) {
    return "career_technical";
  }
  if (/\bfinance|financial literacy|personal finance\b/.test(normalized)) {
    return "financial_literacy";
  }
  if (/\belective\b/.test(normalized)) return "elective";
  return "unclear";
}

export function classifySubjectDeterministically(input: {
  original?: string | null;
  translated?: string | null;
  providedCategory?: string | null;
}): { category: SubjectCategory; matchedAlias?: string; confidence: "high" | "medium" | "low" } {
  const provided = normalizeCourseName(input.providedCategory);
  const normalizedProvided = normalizeSubjectCategory(input.providedCategory);
  if (input.providedCategory && normalizedProvided !== "unclear") {
    return { category: normalizedProvided, matchedAlias: input.providedCategory, confidence: "high" };
  }
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
