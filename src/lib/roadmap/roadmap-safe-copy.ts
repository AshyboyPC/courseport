const SENSITIVE_KEYS = new Set([
  "ocr_raw_text",
  "ocr_raw_json",
  "translated_text_en",
  "source_text",
  "translated_source_text",
  "ai_response_json",
]);

export function roadmapSafeSnapshot(value: Record<string, unknown> | null | undefined) {
  if (!value) return null;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEYS.has(key))
      .map(([key, entry]) => [key, entry instanceof Date ? entry.toISOString() : entry]),
  );
}
