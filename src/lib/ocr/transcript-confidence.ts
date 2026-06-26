import type { TranscriptCourseCandidateInput } from "./types.ts";

export const OCR_CONFIDENCE = {
  high: 0.9,
  medium: 0.75,
};

export const TRANSLATION_CONFIDENCE = {
  high: 0.9,
  medium: 0.75,
};

export const FRAMEWORK_MATCH_HIGH = 0.85;

export type ConfidenceBand = "high" | "medium" | "low" | "unknown";

export function confidenceBand(value?: number | null): ConfidenceBand {
  if (typeof value !== "number") return "unknown";
  if (value >= OCR_CONFIDENCE.high) return "high";
  if (value >= OCR_CONFIDENCE.medium) return "medium";
  return "low";
}

export function requiresOcrReview(confidence?: number | null) {
  return typeof confidence !== "number" || confidence < OCR_CONFIDENCE.medium;
}

export function requiresTranslationReview(confidence?: number | null) {
  return typeof confidence !== "number" || confidence < TRANSLATION_CONFIDENCE.medium;
}

export function mergeReviewReasons(reasons: Array<string | null | undefined>) {
  const unique = Array.from(new Set(reasons.filter((reason): reason is string => Boolean(reason))));
  return unique.length ? unique.join("; ") : null;
}

export function finalizeCandidateReview(
  candidate: TranscriptCourseCandidateInput,
  extraReasons: string[] = [],
): TranscriptCourseCandidateInput {
  const reasons = [
    candidate.review_reason,
    ...extraReasons,
    requiresOcrReview(candidate.extraction_confidence)
      ? "OCR confidence is below review threshold."
      : null,
    candidate.translation_confidence != null &&
    requiresTranslationReview(candidate.translation_confidence)
      ? "Translation confidence is below review threshold."
      : null,
    candidate.grade_original ? null : "Course row is missing a grade or marks value.",
    candidate.subject_category ? "Subject category was guessed and needs confirmation." : null,
  ];
  const reviewReason = mergeReviewReasons(reasons);
  return {
    ...candidate,
    needs_review: Boolean(reviewReason) || candidate.needs_review,
    review_reason: reviewReason,
  };
}
