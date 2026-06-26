export type TranscriptProcessingStage =
  | "frontend_file_selected"
  | "upload_request_started"
  | "storage_upload"
  | "transcript_row_created"
  | "backend_request_received"
  | "auth"
  | "ownership"
  | "metadata_loaded"
  | "config_validation"
  | "storage_download"
  | "mime_detection"
  | "google_request"
  | "google_response"
  | "ocr_empty_response"
  | "ai_extraction"
  | "translation"
  | "parser"
  | "candidate_save";

export class TranscriptProcessingError extends Error {
  stage: TranscriptProcessingStage;
  code: string;
  retryable: boolean;
  manualEntryAvailable: boolean;
  status: "failed" | "manual_entry_required" | "needs_review";

  constructor(
    stage: TranscriptProcessingStage,
    code: string,
    message: string,
    options: {
      retryable?: boolean;
      manualEntryAvailable?: boolean;
      status?: "failed" | "manual_entry_required" | "needs_review";
    } = {},
  ) {
    super(message);
    this.name = "TranscriptProcessingError";
    this.stage = stage;
    this.code = code;
    this.retryable = options.retryable ?? true;
    this.manualEntryAvailable = options.manualEntryAvailable ?? true;
    this.status = options.status ?? "manual_entry_required";
  }
}

export function isTranscriptProcessingError(error: unknown): error is TranscriptProcessingError {
  return error instanceof TranscriptProcessingError;
}

export function safeProcessingError(error: unknown): {
  message: string;
  stage: TranscriptProcessingStage;
  code: string;
  status: "failed" | "manual_entry_required" | "needs_review";
  retryable: boolean;
  manualEntryAvailable: boolean;
} {
  if (isTranscriptProcessingError(error)) {
    return {
      message: error.message,
      stage: error.stage,
      code: error.code,
      status: error.status,
      retryable: error.retryable,
      manualEntryAvailable: error.manualEntryAvailable,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message || "Transcript processing failed.",
      stage: "google_request",
      code: "unexpected_error",
      status: "manual_entry_required",
      retryable: true,
      manualEntryAvailable: true,
    };
  }
  return {
    message: "Transcript processing failed.",
    stage: "google_request",
    code: "unexpected_error",
    status: "manual_entry_required",
    retryable: true,
    manualEntryAvailable: true,
  };
}

export function transcriptApiError(input: {
  message: string;
  stage: TranscriptProcessingStage;
  code: string;
  status?: "failed" | "manual_entry_required" | "needs_review";
  retryable?: boolean;
  manualEntryAvailable?: boolean;
  transcriptId?: string | null;
}) {
  return {
    stage: input.stage,
    code: input.code,
    status: input.status ?? "failed",
    message: input.message,
    retryable: input.retryable ?? true,
    manualEntryAvailable: input.manualEntryAvailable ?? false,
    transcriptId: input.transcriptId ?? null,
  };
}
