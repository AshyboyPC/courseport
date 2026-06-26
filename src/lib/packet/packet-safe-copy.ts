const SENSITIVE_KEYS = new Set([
  "ocr_raw",
  "ocr_raw_json",
  "ocr_raw_text",
  "storage_path",
  "file_url",
  "file_urls",
  "source_text",
  "translated_source_text",
  "bounding_box_json",
  "ai_response_json",
  "packet_snapshot_json",
]);

export function packetSafeCopy(value: Record<string, unknown> | null | undefined) {
  if (!value) return null;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEYS.has(key))
      .map(([key, entry]) => [key, entry instanceof Date ? entry.toISOString() : entry]),
  );
}

export function privateFileSummary(transcript: Record<string, unknown>) {
  return {
    originalFilename: transcript.original_filename ?? null,
    fileType: transcript.file_type ?? null,
    uploadedAt: transcript.created_at ?? null,
    uploadStatus: transcript.upload_status ?? transcript.status ?? null,
    originalFileStoredPrivately: Boolean(
      transcript.storage_path ||
      (Array.isArray(transcript.file_urls) && transcript.file_urls.length > 0),
    ),
    storageNotice: transcript.storage_path
      ? "Original file stored privately in Scholaport."
      : "No private file reference is currently attached to this transcript.",
  };
}
