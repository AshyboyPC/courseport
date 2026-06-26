import type { SourceSummaryItem } from "./types.ts";

type QueryListResult<T> = { data: T[] | null; error: { message: string } | null };
type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

async function many<T>(query: PromiseLike<QueryListResult<T>>) {
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

function sourceItem(row: Record<string, unknown>): SourceSummaryItem {
  const source = (row.data_source ?? {}) as Record<string, unknown>;
  return {
    tableName: String(row.table_name ?? ""),
    recordId: String(row.record_id ?? ""),
    fieldName: (row.field_name as string | null | undefined) ?? null,
    notes: (row.notes as string | null | undefined) ?? null,
    sourceTitle: (source.source_title as string | null | undefined) ?? null,
    sourceUrl: (source.source_url as string | null | undefined) ?? null,
    sourceAuthority: (source.source_authority as string | null | undefined) ?? null,
    sourceType: (source.source_type as string | null | undefined) ?? null,
    lastVerifiedAt: (source.last_verified_at as string | null | undefined) ?? null,
    sourceSectionOrPage: (row.source_section_or_page as string | null | undefined) ?? null,
    claimSummary: (row.claim_summary as string | null | undefined) ?? null,
    reliabilityLevel: (source.reliability_level as string | null | undefined) ?? null,
  };
}

export async function loadPacketSourceSummary(input: {
  supabase: SupabaseLike;
  frameworkId?: string | null;
  requirementIds: string[];
}): Promise<SourceSummaryItem[]> {
  const queries: Promise<SourceSummaryItem[]>[] = [];
  if (input.frameworkId) {
    queries.push(
      many<Record<string, unknown>>(
        input.supabase
          .from("reference_record_sources")
          .select("*, data_source:data_sources(*)")
          .eq("table_name", "destination_graduation_frameworks")
          .eq("record_id", input.frameworkId),
      ).then((rows) => rows.map(sourceItem)),
    );
  }
  const requirementIds = Array.from(new Set(input.requirementIds.filter(Boolean)));
  if (requirementIds.length) {
    queries.push(
      many<Record<string, unknown>>(
        input.supabase
          .from("reference_record_sources")
          .select("*, data_source:data_sources(*)")
          .eq("table_name", "graduation_requirements")
          .in("record_id", requirementIds),
      ).then((rows) => rows.map(sourceItem)),
    );
  }
  const sourceGroups = await Promise.all(queries);
  return sourceGroups.flat();
}

export function missingSourceMessages(input: {
  frameworkId?: string | null;
  requirementIds: string[];
  sourceSummary: SourceSummaryItem[];
}) {
  const messages: string[] = [];
  if (input.frameworkId) {
    const hasFramework = input.sourceSummary.some(
      (item) =>
        item.tableName === "destination_graduation_frameworks" &&
        item.recordId === input.frameworkId,
    );
    if (!hasFramework) {
      messages.push(
        "Destination framework source is not yet linked in Scholaport reference database.",
      );
    }
  }
  for (const id of Array.from(new Set(input.requirementIds.filter(Boolean)))) {
    const hasRequirement = input.sourceSummary.some(
      (item) => item.tableName === "graduation_requirements" && item.recordId === id,
    );
    if (!hasRequirement) {
      messages.push(
        `Requirement source is not yet linked in Scholaport reference database: ${id}.`,
      );
    }
  }
  return messages;
}
