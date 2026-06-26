import type { GraduationRequirementForGap, RequirementType } from "./types.ts";

export function normalizeRequirementCategory(value: string | null | undefined) {
  return (value ?? "other")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function inferRequirementType(requirement: GraduationRequirementForGap): RequirementType {
  const kind = String(
    requirement.requirement_kind ?? requirement.requirement_type ?? "",
  ).toLowerCase();
  const text =
    `${requirement.subject_category ?? ""} ${requirement.requirement_code ?? ""} ${requirement.notes ?? ""}`.toLowerCase();
  if (
    kind.includes("assessment") ||
    kind.includes("exam") ||
    /eoc|staar|assessment|test/.test(text)
  )
    return "assessment";
  if (kind.includes("non_course") || /cpr|fafsa|service|portfolio/.test(text)) return "non_course";
  if (kind.includes("elective") || /elective/.test(text)) return "elective";
  if (kind.includes("local") || /local|district/.test(text)) return "local_requirement";
  if (kind.includes("pathway")) return "pathway";
  if (kind.includes("endorsement")) return "endorsement";
  if (requirement.specific_courses?.length) return "named_course";
  if (requirement.credits_required && requirement.credits_required > 0) return "subject_credit";
  return "other";
}

export function requirementDisplayName(requirement: GraduationRequirementForGap) {
  const specific = requirement.specific_courses?.[0];
  return (
    specific ||
    requirement.requirement_code ||
    requirement.subject_category?.replaceAll("_", " ") ||
    "Graduation requirement"
  );
}

export function isStateSpecificNamedRequirement(requirement: GraduationRequirementForGap) {
  const text = [
    requirement.subject_category,
    requirement.requirement_code,
    requirement.specific_courses?.join(" "),
    requirement.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\b(u\.?s\.?|united states|american|georgia|texas|government|civics|constitution|eoc|staar)\b/.test(
    text,
  );
}
