import { summarizeGapAnalysis } from "./gap-explanations.ts";
import type { GapAnalysisResult } from "./types.ts";

export async function summarizeGapAnalysisSafely(result: GapAnalysisResult) {
  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) return result.summaryText;
  return summarizeGapAnalysis({
    risk: result.overallRiskLevel,
    missingCount: result.missingRequirementCount,
    reviewCount: result.counselorReviewRequirementCount,
    totalMissingCredits: result.totalMissingCredits,
  });
}
