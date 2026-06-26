export function compactRecord(record: Record<string, unknown> | null | undefined) {
  if (!record) return null;
  return Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    ),
  );
}

export function safeCourseText(record: {
  course_name_original?: string | null;
  course_name_translated?: string | null;
  grade_original?: string | null;
}) {
  return {
    original: record.course_name_original ?? "",
    translated: record.course_name_translated ?? null,
    gradeContext: record.grade_original ?? null,
  };
}
