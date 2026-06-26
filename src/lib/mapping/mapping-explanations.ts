import type { CourseMappingCandidate } from "@/lib/mapping/types";

export function buildEvidenceSummary(input: {
  method: string;
  original: string;
  translated?: string | null;
  category: string;
  requirement?: Record<string, unknown> | null;
  warnings: string[];
}) {
  const course = input.translated || input.original;
  const bucket = String(
    input.requirement?.subject_category ?? input.requirement?.requirement_code ?? input.category,
  );
  const base = `${course} was classified as ${input.category.replaceAll("_", " ")} and compared with the destination requirement bucket ${bucket.replaceAll("_", " ")}.`;
  const methodText =
    input.method === "verified_rule"
      ? "A verified mapping rule was used first."
      : input.method === "exact_reference_match"
        ? "A source reference and destination requirement category matched."
        : input.method === "vector_similarity"
          ? "A reference similarity match supported this candidate."
          : input.method === "structured_ai"
            ? "A structured AI classifier produced a schema-checked candidate after deterministic checks."
            : "A deterministic subject taxonomy produced this candidate.";
  const warning = input.warnings.length ? ` Review notes: ${input.warnings.join(" ")}` : "";
  return `${base} ${methodText}${warning}`;
}

export function studentCounselorQuestion(
  mapping: Pick<CourseMappingCandidate, "probable_destination_equivalent" | "requirement_bucket">,
) {
  return `Ask the counselor whether ${mapping.probable_destination_equivalent} can count toward ${mapping.requirement_bucket ?? "the selected graduation requirement"} and how many local credits may be awarded.`;
}
