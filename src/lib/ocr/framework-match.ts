import type { LanguageDetectionResult } from "../translation/types.ts";

export type FrameworkReferenceCountry = {
  id: string;
  name: string;
  iso3?: string | null;
  primary_languages?: string[] | null;
};

export type FrameworkReferenceJurisdiction = {
  id: string;
  country_id?: string | null;
  name: string;
  jurisdiction_type?: string | null;
};

export type FrameworkReferenceCurriculum = {
  id: string;
  country_id?: string | null;
  jurisdiction_id?: string | null;
  name: string;
  curriculum_type?: string | null;
};

export type ProfileFrameworkReference = {
  sourceCountryId?: string | null;
  sourceCountryLabel?: string | null;
  sourceCurriculumId?: string | null;
  sourceCurriculumLabel?: string | null;
};

export type FrameworkMatchResult = {
  status:
    | "matched_profile"
    | "detected_different_framework"
    | "ambiguous"
    | "not_detected"
    | "manual_required";
  confidence: number;
  detectedSourceCountryId: string | null;
  detectedSourceJurisdictionId: string | null;
  detectedSourceCurriculumId: string | null;
  detectedSourceCountryLabel: string | null;
  detectedSourceJurisdictionLabel: string | null;
  detectedSourceCurriculumLabel: string | null;
  selectedSourceCountryId: string | null;
  selectedSourceJurisdictionId: string | null;
  selectedSourceCurriculumId: string | null;
  sourceSelectionMethod:
    | "profile_default"
    | "ocr_detected"
    | "student_override"
    | "manual_selection"
    | "counselor_review";
  requiresReview: boolean;
  warnings: string[];
};

type MatchInput = {
  rawText: string;
  translatedText?: string | null;
  languageDetection: LanguageDetectionResult;
  profile: ProfileFrameworkReference;
  countries?: FrameworkReferenceCountry[];
  jurisdictions?: FrameworkReferenceJurisdiction[];
  curricula?: FrameworkReferenceCurriculum[];
};

function includesAny(text: string, values: string[]) {
  const lower = text.toLowerCase();
  return values.some((value) => lower.includes(value.toLowerCase()));
}

function findByName<T extends { name: string }>(rows: T[] | undefined, names: string[]) {
  return rows?.find(
    (row) => includesAny(row.name, names) || includesAny(names.join(" "), [row.name]),
  );
}

function detectCountryByLanguage(languageCode: string) {
  const map: Record<string, string> = {
    ta: "India",
    hi: "India",
    ur: "Pakistan",
    bn: "Bangladesh",
    zh: "China",
    fil: "Philippines",
    tl: "Philippines",
    uk: "Ukraine",
    ru: "Russia",
    es: "Mexico",
    ar: "Saudi Arabia",
  };
  return map[languageCode] ?? null;
}

function namesMatch(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  return left === right || left.includes(right) || right.includes(left);
}

export function matchTranscriptSourceFramework(input: MatchInput): FrameworkMatchResult {
  const text = `${input.rawText}\n${input.translatedText ?? ""}`;
  const detectedNames = {
    country: null as string | null,
    jurisdiction: null as string | null,
    curriculum: null as string | null,
  };
  let confidence = 0;

  if (
    includesAny(text, [
      "Tamil Nadu State Board",
      "தமிழ்நாடு மாநில வாரியம்",
      "Tamilnadu State Board",
    ])
  ) {
    detectedNames.country = "India";
    detectedNames.jurisdiction = "Tamil Nadu";
    detectedNames.curriculum = "Tamil Nadu State Board";
    confidence = 0.92;
  } else if (
    includesAny(text, [
      "Andhra Pradesh Board",
      "Board of Secondary Education Andhra Pradesh",
      "BSEAP",
    ])
  ) {
    detectedNames.country = "India";
    detectedNames.jurisdiction = "Andhra Pradesh";
    detectedNames.curriculum = "Andhra Pradesh State Board";
    confidence = 0.9;
  } else if (includesAny(text, ["CBSE", "Central Board of Secondary Education"])) {
    detectedNames.country = "India";
    detectedNames.curriculum = "CBSE";
    confidence = 0.92;
  } else if (includesAny(text, ["ICSE", "CISCE", "Indian Certificate of Secondary Education"])) {
    detectedNames.country = "India";
    detectedNames.curriculum = "ICSE";
    confidence = 0.9;
  } else if (
    includesAny(text, ["Bachillerato", "Secretaría de Educación", "Educación Secundaria"])
  ) {
    detectedNames.country = "Mexico";
    detectedNames.curriculum = "Bachillerato";
    confidence = 0.78;
  } else {
    detectedNames.country = detectCountryByLanguage(input.languageDetection.primaryLanguageCode);
    confidence = detectedNames.country ? Math.min(0.7, input.languageDetection.confidence) : 0;
  }

  const detectedCountry = findByName(
    input.countries,
    detectedNames.country ? [detectedNames.country] : [],
  );
  const detectedJurisdiction = findByName(
    input.jurisdictions,
    detectedNames.jurisdiction ? [detectedNames.jurisdiction] : [],
  );
  const detectedCurriculum = findByName(
    input.curricula,
    detectedNames.curriculum ? [detectedNames.curriculum] : [],
  );
  const countryId = detectedCountry?.id ?? null;
  const jurisdictionId = detectedJurisdiction?.id ?? null;
  const curriculumId = detectedCurriculum?.id ?? null;
  const countryLabel = detectedCountry?.name ?? detectedNames.country;
  const jurisdictionLabel = detectedJurisdiction?.name ?? detectedNames.jurisdiction;
  const curriculumLabel = detectedCurriculum?.name ?? detectedNames.curriculum;

  let status: FrameworkMatchResult["status"] = "not_detected";
  const profileCountryMatches =
    (countryId && input.profile.sourceCountryId === countryId) ||
    namesMatch(countryLabel, input.profile.sourceCountryLabel);
  const profileCurriculumMatches =
    (curriculumId && input.profile.sourceCurriculumId === curriculumId) ||
    namesMatch(curriculumLabel, input.profile.sourceCurriculumLabel);

  if (!countryLabel && !curriculumLabel) {
    status = "not_detected";
  } else if (confidence < 0.7 || input.languageDetection.ambiguous) {
    status = "ambiguous";
  } else if (
    (countryLabel && input.profile.sourceCountryLabel && !profileCountryMatches) ||
    (curriculumLabel && input.profile.sourceCurriculumLabel && !profileCurriculumMatches)
  ) {
    status = "detected_different_framework";
  } else if (profileCountryMatches || profileCurriculumMatches) {
    status = "matched_profile";
  } else {
    status = "ambiguous";
  }

  const requiresReview = status !== "matched_profile" || confidence < 0.85;
  return {
    status,
    confidence,
    detectedSourceCountryId: countryId,
    detectedSourceJurisdictionId: jurisdictionId,
    detectedSourceCurriculumId: curriculumId,
    detectedSourceCountryLabel: countryLabel,
    detectedSourceJurisdictionLabel: jurisdictionLabel,
    detectedSourceCurriculumLabel: curriculumLabel,
    selectedSourceCountryId: input.profile.sourceCountryId ?? countryId,
    selectedSourceJurisdictionId: jurisdictionId,
    selectedSourceCurriculumId: input.profile.sourceCurriculumId ?? curriculumId,
    sourceSelectionMethod: "profile_default",
    requiresReview,
    warnings: requiresReview
      ? ["Detected transcript source framework needs review before future mapping."]
      : [],
  };
}
