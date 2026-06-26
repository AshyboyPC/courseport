export type CounselorPacketStatus =
  | "not_started"
  | "processing"
  | "ready"
  | "failed"
  | "needs_review"
  | "stale"
  | "html_ready"
  | "pdf_ready";

export type CounselorPacketType =
  | "counselor_review_packet"
  | "transfer_credit_preview"
  | "graduation_planning_packet";

export type PacketSectionStatus = "included" | "missing_data" | "needs_review" | "not_applicable";

export type PacketSectionKey =
  | "cover"
  | "student_academic_snapshot"
  | "transcript_summary"
  | "course_translation_review"
  | "probable_credit_mapping"
  | "graduation_gap_summary"
  | "requirement_checklist"
  | "academic_roadmap"
  | "counselor_meeting_checklist"
  | "review_flags_limitations"
  | "source_provenance_summary"
  | "attachments_original_transcript";

export type PacketSectionSnapshot = {
  key: PacketSectionKey;
  title: string;
  order: number;
  status: PacketSectionStatus;
  data: unknown;
  missingReason?: string | null;
  warnings: string[];
};

export type SourceSummaryItem = {
  tableName: string;
  recordId: string;
  fieldName?: string | null;
  notes?: string | null;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
  sourceAuthority?: string | null;
  sourceType?: string | null;
  lastVerifiedAt?: string | null;
  sourceSectionOrPage?: string | null;
  claimSummary?: string | null;
  reliabilityLevel?: string | null;
};

export type PacketAssemblyContext = {
  userId: string;
  profile: Record<string, unknown>;
  transcript: Record<string, unknown>;
  transcriptCourses: Record<string, unknown>[];
  mappingRun: Record<string, unknown> | null;
  creditMappings: Record<string, unknown>[];
  gapAnalysis: Record<string, unknown>;
  gapRequirements: Record<string, unknown>[];
  roadmap: Record<string, unknown>;
  roadmapItems: Record<string, unknown>[];
  destinationFramework: Record<string, unknown> | null;
  graduationRequirements: Record<string, unknown>[];
  sourceSummary: SourceSummaryItem[];
  generatedAt: string;
};

export type CounselorPacketSnapshot = {
  packetVersion: string;
  generatedAt: string;
  title: string;
  status: CounselorPacketStatus;
  disclaimerText: string;
  summaryText: string;
  profile: Record<string, unknown>;
  transcript: Record<string, unknown>;
  sections: PacketSectionSnapshot[];
  includedSections: Array<{ key: PacketSectionKey; title: string }>;
  missingSections: Array<{ key: PacketSectionKey; title: string; reason: string }>;
  warnings: string[];
  counselorQuestions: string[];
  sourceSummary: SourceSummaryItem[];
};

export type BuiltCounselorPacket = {
  snapshot: CounselorPacketSnapshot;
  sections: PacketSectionSnapshot[];
  printableHtml: string;
  status: CounselorPacketStatus;
};
