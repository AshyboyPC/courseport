import type {
  CourseMappingCandidate,
  MappingContext,
  TranscriptCourseForMapping,
} from "@/lib/mapping/types";

export async function tryVectorMapping(
  _context: MappingContext,
  _course: TranscriptCourseForMapping,
): Promise<Partial<CourseMappingCandidate> | null> {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_EMBEDDING_MODEL) return null;
  return null;
}
