export const MVP_SELECTABLE_SOURCE_COUNTRY_ISO3 = ["IND"] as const;

export const MVP_COMING_SOON_SOURCE_COUNTRY_ISO3 = [
  "CHN",
  "MEX",
  "PHL",
  "PAK",
  "BGD",
  "UKR",
  "RUS",
  "EGY",
  "NGA",
] as const;

export const MVP_SOURCE_COUNTRY_ISO3 = [
  ...MVP_SELECTABLE_SOURCE_COUNTRY_ISO3,
  ...MVP_COMING_SOON_SOURCE_COUNTRY_ISO3,
] as const;

export const MVP_SELECTABLE_DESTINATION_COUNTRY_ISO3 = ["USA"] as const;

export const MVP_COMING_SOON_DESTINATION_COUNTRY_ISO3 = [
  "CAN",
  "GBR",
  "AUS",
  "DEU",
  "ARE",
] as const;

export const MVP_DESTINATION_COUNTRY_ISO3 = [
  ...MVP_SELECTABLE_DESTINATION_COUNTRY_ISO3,
  ...MVP_COMING_SOON_DESTINATION_COUNTRY_ISO3,
] as const;

export const MVP_PRIORITY_COUNTRY_ISO3 = [
  ...MVP_SOURCE_COUNTRY_ISO3,
  ...MVP_DESTINATION_COUNTRY_ISO3,
] as const;

export const MVP_INDIA_SOURCE_JURISDICTION_CODES = ["TN", "AP"] as const;
export const MVP_US_DESTINATION_JURISDICTION_CODES = ["GA", "TX"] as const;

export const MVP_SOURCE_CURRICULA_BY_JURISDICTION_CODE = {
  TN: ["Tamil Nadu State Board SSLC (Class 10)", "Tamil Nadu State Board HSC (Class 11-12)"],
  AP: ["Andhra Pradesh SSC (Class 9-10)", "Andhra Pradesh Intermediate (Class 11-12)"],
} as const;

export const MVP_HIDDEN_SOURCE_CURRICULA = [
  "CBSE Secondary (Classes 9-10)",
  "CBSE Senior Secondary (Classes 11-12)",
] as const;

export const USABLE_REFERENCE_STATUSES = ["partial", "verified", "official"] as const;

export type MvpVisibility = "source" | "destination" | "hidden";
export type MvpOptionAvailability = "selectable" | "coming_soon" | "hidden";

type CountryLike = {
  iso3: string;
};

type JurisdictionLike = {
  id?: string;
  code?: string | null;
  name: string;
};

type CurriculumLike = {
  name: string;
  jurisdiction_id?: string | null;
};

type DestinationFrameworkLike = {
  jurisdiction_id?: string | null;
};

type ProfileLike = {
  origin_country?: string | null;
  source_curriculum?: string | null;
  source_jurisdiction_label?: string | null;
  destination_country?: string | null;
  target_state?: string | null;
  destination_jurisdiction_label?: string | null;
  destination_framework_id?: string | null;
  destination_framework_label?: string | null;
};

const DESTINATION_SCOPE_NOTES: Record<string, string> = {
  USA: "For the current MVP, Scholaport shows only Georgia and Texas because those are the verified destination framework slice.",
  CAN: "Canada is visible as a future destination, but provincial graduation frameworks are not enabled in the current MVP.",
  GBR: "The United Kingdom is visible as a future destination, but devolved framework handling is not enabled in the current MVP.",
  AUS: "Australia is visible as a future destination, but state and territory senior secondary frameworks are not enabled in the current MVP.",
  DEU: "Germany is visible as a future destination, but Land-specific graduation frameworks are not enabled in the current MVP.",
  ARE: "The United Arab Emirates is visible as a future destination, but federal and emirate-level frameworks are not enabled in the current MVP.",
};

const SOURCE_SCOPE_NOTES: Record<string, string> = {
  IND: "India is the selectable source country in the current MVP. Only Tamil Nadu and Andhra Pradesh state board curricula have verified source data for transcript interpretation. Tamil Nadu covers SSLC Class 10 and HSC Class 11-12. Andhra Pradesh covers SSC Class 9-10 and Intermediate Class 11-12. Other Indian boards, including CBSE, remain stored for future expansion but are not selectable in onboarding.",
  CHN: "China is visible as a future source country. National curriculum programmes are partially sourced, but provincial implementation details and transcript interpretation rules are not enabled in the current MVP.",
  MEX: "Mexico is visible as a future source country. National basic and upper-secondary curriculum frameworks are partially sourced, but state-level adoption details are not enabled in the current MVP.",
  PHL: "Philippines is visible as a future source country. Strengthened K to 10 and SHS curricula are partially sourced, but transition cohort details are not enabled in the current MVP.",
  PAK: "Pakistan is visible as a future source country. FBISE scheme of studies is partially sourced, but provincial board details are not enabled in the current MVP.",
  BGD: "Bangladesh is visible as a future source country. Transcript interpretation is not enabled in the current MVP.",
  UKR: "Ukraine is visible as a future source country. Transcript interpretation is not enabled in the current MVP.",
  RUS: "Russia is visible as a future source country. Transcript interpretation is not enabled in the current MVP.",
  EGY: "Egypt is visible as a future source country. Transcript interpretation is not enabled in the current MVP.",
  NGA: "Nigeria is visible as a future source country. Transcript interpretation is not enabled in the current MVP.",
};

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function codeOf(jurisdiction: JurisdictionLike) {
  return (jurisdiction.code ?? "").trim().toUpperCase();
}

function includesNormalized(values: readonly string[], value: string | null | undefined) {
  const normalized = normalize(value);
  return values.some((item) => normalize(item) === normalized);
}

export function isUsableReferenceStatus(status: string): boolean {
  return (USABLE_REFERENCE_STATUSES as readonly string[]).includes(status);
}

export function getMvpVisibility(iso3: string): MvpVisibility {
  if ((MVP_SOURCE_COUNTRY_ISO3 as readonly string[]).includes(iso3)) return "source";
  if ((MVP_DESTINATION_COUNTRY_ISO3 as readonly string[]).includes(iso3)) return "destination";
  return "hidden";
}

export function getDestinationScopeNote(iso3: string): string | null {
  return DESTINATION_SCOPE_NOTES[iso3] ?? null;
}

export function getSourceScopeNote(iso3: string): string | null {
  return SOURCE_SCOPE_NOTES[iso3] ?? null;
}

export function getMvpSourceCountryAvailability(iso3: string): MvpOptionAvailability {
  if ((MVP_SELECTABLE_SOURCE_COUNTRY_ISO3 as readonly string[]).includes(iso3)) {
    return "selectable";
  }
  if ((MVP_COMING_SOON_SOURCE_COUNTRY_ISO3 as readonly string[]).includes(iso3)) {
    return "coming_soon";
  }
  return "hidden";
}

export function getMvpDestinationCountryAvailability(iso3: string): MvpOptionAvailability {
  if ((MVP_SELECTABLE_DESTINATION_COUNTRY_ISO3 as readonly string[]).includes(iso3)) {
    return "selectable";
  }
  if ((MVP_COMING_SOON_DESTINATION_COUNTRY_ISO3 as readonly string[]).includes(iso3)) {
    return "coming_soon";
  }
  return "hidden";
}

export function isMvpSelectableSourceCountry(iso3: string): boolean {
  return getMvpSourceCountryAvailability(iso3) === "selectable";
}

export function isMvpSelectableDestinationCountry(iso3: string): boolean {
  return getMvpDestinationCountryAvailability(iso3) === "selectable";
}

export function filterMvpSourceCountries<T extends CountryLike>(countries: T[]): T[] {
  return countries.filter((country) => getMvpSourceCountryAvailability(country.iso3) !== "hidden");
}

export function filterMvpDestinationCountries<T extends CountryLike>(countries: T[]): T[] {
  return countries.filter(
    (country) => getMvpDestinationCountryAvailability(country.iso3) !== "hidden",
  );
}

export function sortByMvpSourceCountryOrder<T extends CountryLike>(countries: T[]): T[] {
  const order = new Map<string, number>(
    MVP_SOURCE_COUNTRY_ISO3.map((iso3, index) => [iso3, index]),
  );
  return [...countries].sort((left, right) => {
    const leftOrder = order.get(left.iso3) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(right.iso3) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

export function sortByMvpDestinationCountryOrder<T extends CountryLike>(countries: T[]): T[] {
  const order = new Map<string, number>(
    MVP_DESTINATION_COUNTRY_ISO3.map((iso3, index) => [iso3, index]),
  );
  return [...countries].sort((left, right) => {
    const leftOrder = order.get(left.iso3) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(right.iso3) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

export function isMvpSourceJurisdiction(jurisdiction: JurisdictionLike): boolean {
  const code = codeOf(jurisdiction);
  return (
    (MVP_INDIA_SOURCE_JURISDICTION_CODES as readonly string[]).includes(code) ||
    normalize(jurisdiction.name) === "tamil nadu" ||
    normalize(jurisdiction.name) === "andhra pradesh"
  );
}

export function isMvpDestinationJurisdiction(jurisdiction: JurisdictionLike): boolean {
  const code = codeOf(jurisdiction);
  return (
    (MVP_US_DESTINATION_JURISDICTION_CODES as readonly string[]).includes(code) ||
    normalize(jurisdiction.name) === "georgia" ||
    normalize(jurisdiction.name) === "texas"
  );
}

export function filterMvpSourceJurisdictions<T extends JurisdictionLike>(
  jurisdictions: T[],
  sourceCountryIso3?: string | null,
): T[] {
  if (sourceCountryIso3 !== "IND") return [];
  return jurisdictions.filter(isMvpSourceJurisdiction);
}

export function filterMvpDestinationJurisdictions<T extends JurisdictionLike>(
  jurisdictions: T[],
  destinationCountryIso3?: string | null,
): T[] {
  if (destinationCountryIso3 !== "USA") return [];
  return jurisdictions.filter(isMvpDestinationJurisdiction);
}

export function getMvpJurisdictionCode(jurisdiction: JurisdictionLike | null | undefined) {
  if (!jurisdiction) return null;
  const code = codeOf(jurisdiction);
  if (code) return code;
  if (normalize(jurisdiction.name) === "tamil nadu") return "TN";
  if (normalize(jurisdiction.name) === "andhra pradesh") return "AP";
  if (normalize(jurisdiction.name) === "georgia") return "GA";
  if (normalize(jurisdiction.name) === "texas") return "TX";
  return null;
}

export function isMvpSourceCurriculumForJurisdiction(
  curriculum: CurriculumLike,
  jurisdiction: JurisdictionLike | null | undefined,
): boolean {
  const code = getMvpJurisdictionCode(jurisdiction);
  if (code !== "TN" && code !== "AP") return false;
  return (MVP_SOURCE_CURRICULA_BY_JURISDICTION_CODE[code] as readonly string[]).includes(
    curriculum.name,
  );
}

export function filterMvpSourceCurricula<T extends CurriculumLike>(
  curricula: T[],
  jurisdiction: JurisdictionLike | null | undefined,
): T[] {
  return curricula.filter((curriculum) =>
    isMvpSourceCurriculumForJurisdiction(curriculum, jurisdiction),
  );
}

export function filterMvpDestinationFrameworks<T extends DestinationFrameworkLike>(
  frameworks: T[],
  jurisdiction: JurisdictionLike | null | undefined,
): T[] {
  if (!jurisdiction) return [];
  return frameworks.filter(
    (framework) =>
      Boolean(jurisdiction.id) &&
      Boolean(framework.jurisdiction_id) &&
      framework.jurisdiction_id === jurisdiction.id,
  );
}

export function getMvpProfileUnsupportedReasons(profile: ProfileLike): string[] {
  const reasons: string[] = [];
  if (normalize(profile.origin_country) !== "india") {
    reasons.push("Source country must be India for the current MVP scope.");
  }
  if (!isMvpProfileSourceJurisdictionLabel(profile.source_jurisdiction_label)) {
    reasons.push("Source state must be Tamil Nadu or Andhra Pradesh for the current MVP scope.");
  }
  if (!isMvpProfileSourceCurriculumLabel(profile.source_curriculum)) {
    reasons.push(
      "Source curriculum must be Tamil Nadu SSLC/HSC or Andhra Pradesh SSC/Intermediate.",
    );
  }
  if (
    normalize(profile.destination_country) !== "united states" &&
    normalize(profile.destination_country) !== "usa"
  ) {
    reasons.push("Destination country must be United States for the current MVP scope.");
  }
  const destinationJurisdiction =
    profile.destination_jurisdiction_label || profile.target_state || "";
  if (!isMvpProfileDestinationJurisdictionLabel(destinationJurisdiction)) {
    reasons.push("Destination state must be Georgia or Texas for the current MVP scope.");
  }
  if (!profile.destination_framework_id && !profile.destination_framework_label) {
    reasons.push("A Georgia or Texas graduation framework must be selected.");
  }
  return reasons;
}

export function isMvpProfileSourceJurisdictionLabel(label: string | null | undefined): boolean {
  return includesNormalized(["Tamil Nadu", "Andhra Pradesh"], label);
}

export function isMvpProfileSourceCurriculumLabel(label: string | null | undefined): boolean {
  return includesNormalized(
    [
      ...MVP_SOURCE_CURRICULA_BY_JURISDICTION_CODE.TN,
      ...MVP_SOURCE_CURRICULA_BY_JURISDICTION_CODE.AP,
    ],
    label,
  );
}

export function isMvpProfileDestinationJurisdictionLabel(
  label: string | null | undefined,
): boolean {
  return includesNormalized(["Georgia", "Texas"], label);
}
