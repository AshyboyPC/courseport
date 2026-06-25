export const MVP_SOURCE_COUNTRY_ISO3 = ["IND", "CHN", "MEX", "PHL", "PAK"] as const;

export const MVP_DESTINATION_COUNTRY_ISO3 = ["USA", "DEU", "SAU", "GBR", "ARE"] as const;

export const MVP_PRIORITY_COUNTRY_ISO3 = [
  ...MVP_SOURCE_COUNTRY_ISO3,
  ...MVP_DESTINATION_COUNTRY_ISO3,
] as const;

export const USABLE_REFERENCE_STATUSES = ["partial", "verified", "official"] as const;

export type MvpVisibility = "source" | "destination" | "hidden";

const DESTINATION_SCOPE_NOTES: Record<string, string> = {
  USA: "All 50 states and DC are selectable for planning. Detailed graduation requirements are currently verified for Georgia and Texas; other states remain selectable while framework research continues.",
  DEU: "German school and graduation rules are set by each Land; no Land-specific framework has completed validation yet.",
  SAU: "Current Saudi coverage supports the national secondary pathways system, not a complete graduation framework.",
  GBR: "Education is devolved. England and Scotland are sourced jurisdiction choices, but the UK does not have one unified diploma-style graduation framework.",
  ARE: "UAE remains selectable for planning, but no federal or emirate-level graduation framework has completed direct-source validation yet.",
};

const SOURCE_SCOPE_NOTES: Record<string, string> = {
  IND: "India is a source country. For the MVP, only Tamil Nadu and Andhra Pradesh state board curricula have verified source data for transcript interpretation. Tamil Nadu covers SSLC Class 10 and HSC Class 11-12. Andhra Pradesh covers SSC Class 9-10 and Intermediate Class 11-12. Other Indian boards (CBSE, CISCE, NIOS, Maharashtra, UP) are seeded but not yet verified for transcript parsing.",
  CHN: "China is a source country. National curriculum programmes are partially sourced, but provincial implementation details and transcript interpretation rules are not yet verified.",
  MEX: "Mexico is a source country. National basic and upper-secondary curriculum frameworks are partially sourced, but state-level adoption details are not yet verified.",
  PHL: "Philippines is a source country. Strengthened K to 10 and SHS curricula are partially sourced, but transition cohort details are not yet verified.",
  PAK: "Pakistan is a source country. FBISE scheme of studies is partially sourced, but provincial board details are not yet verified.",
};

export function getMvpVisibility(iso3: string): MvpVisibility {
  if ((MVP_SOURCE_COUNTRY_ISO3 as readonly string[]).includes(iso3)) return "source";
  if ((MVP_DESTINATION_COUNTRY_ISO3 as readonly string[]).includes(iso3)) return "destination";
  return "hidden";
}

export function isUsableReferenceStatus(status: string): boolean {
  return (USABLE_REFERENCE_STATUSES as readonly string[]).includes(status);
}

export function getDestinationScopeNote(iso3: string): string | null {
  return DESTINATION_SCOPE_NOTES[iso3] ?? null;
}

export function getSourceScopeNote(iso3: string): string | null {
  return SOURCE_SCOPE_NOTES[iso3] ?? null;
}
