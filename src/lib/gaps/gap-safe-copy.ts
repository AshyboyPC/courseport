export function safeSnapshot(value: Record<string, unknown> | null | undefined) {
  if (!value) return {};
  const blocked = new Set(["ocr_raw_json", "ocr_raw", "ocr_raw_text", "translated_text_en"]);
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, entry]) => !blocked.has(key) && entry !== undefined && entry !== null,
    ),
  );
}
