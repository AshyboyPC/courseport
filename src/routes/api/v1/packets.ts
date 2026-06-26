import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { generateCounselorPacket, getPacketDownloadUrl } from "@/lib/packet/packet-service.server";
import {
  GenerateCounselorPacketSchema,
  PacketDownloadSchema,
} from "@/lib/packet/packet-validators";
import { requireAuthenticatedServerUser } from "@/lib/supabase-server";

const uuid = z.string().uuid();

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

function publicError(error: unknown) {
  const message = error instanceof Error ? error.message : "Packet operation failed.";
  const status = /authenticated|required/i.test(message) ? 401 : 400;
  return json({ success: false, error: { message } }, { status });
}

async function latestTranscript(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
) {
  const { data, error } = await supabase
    .from("transcripts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function buildPacketPreviewData(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedServerUser>>["supabase"],
  userId: string,
  packetId?: string | null,
) {
  const { data: profile, error: profileError } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError) throw profileError;
  const transcript = await latestTranscript(supabase, userId);
  const transcriptId = transcript?.id as string | undefined;
  const [courseResult, mappingResult, gapResult, roadmapResult, packetResult] = await Promise.all([
    transcriptId
      ? supabase
          .from("transcript_courses")
          .select("*")
          .eq("user_id", userId)
          .eq("transcript_id", transcriptId)
          .order("created_at")
      : Promise.resolve({ data: [], error: null }),
    transcriptId
      ? supabase
          .from("credit_mappings")
          .select("*")
          .eq("user_id", userId)
          .eq("transcript_id", transcriptId)
          .neq("mapping_status", "replaced")
          .order("created_at")
      : Promise.resolve({ data: [], error: null }),
    transcriptId
      ? supabase
          .from("gap_analyses")
          .select("*")
          .eq("user_id", userId)
          .eq("transcript_id", transcriptId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    transcriptId
      ? supabase
          .from("roadmaps")
          .select("*")
          .eq("user_id", userId)
          .eq("transcript_id", transcriptId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    packetId
      ? supabase
          .from("counselor_packets")
          .select("*")
          .eq("id", packetId)
          .eq("user_id", userId)
          .maybeSingle()
      : transcriptId
        ? supabase
            .from("counselor_packets")
            .select("*")
            .eq("user_id", userId)
            .eq("transcript_id", transcriptId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
  ]);
  if (courseResult.error) throw courseResult.error;
  if (mappingResult.error) throw mappingResult.error;
  if (gapResult.error) throw gapResult.error;
  if (roadmapResult.error) throw roadmapResult.error;
  if (packetResult.error) throw packetResult.error;
  const [gapRequirementResult, roadmapItemResult, packetSectionResult] = await Promise.all([
    gapResult.data
      ? supabase
          .from("gap_requirements")
          .select("*")
          .eq("user_id", userId)
          .eq("gap_analysis_id", gapResult.data.id)
          .order("display_order")
      : Promise.resolve({ data: [], error: null }),
    roadmapResult.data
      ? supabase
          .from("roadmap_items")
          .select("*")
          .eq("user_id", userId)
          .eq("roadmap_id", roadmapResult.data.id)
          .order("display_order")
      : Promise.resolve({ data: [], error: null }),
    packetResult.data
      ? supabase
          .from("counselor_packet_sections")
          .select("*")
          .eq("user_id", userId)
          .eq("packet_id", packetResult.data.id)
          .order("section_order")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (gapRequirementResult.error) throw gapRequirementResult.error;
  if (roadmapItemResult.error) throw roadmapItemResult.error;
  if (packetSectionResult.error) throw packetSectionResult.error;
  return {
    profile,
    transcript,
    transcriptCourses: courseResult.data ?? [],
    creditMappings: mappingResult.data ?? [],
    gapAnalysis: gapResult.data ?? null,
    gapRequirements: gapRequirementResult.data ?? [],
    roadmap: roadmapResult.data ?? null,
    roadmapItems: roadmapItemResult.data ?? [],
    packet: packetResult.data ?? null,
    packetSections: packetSectionResult.data ?? [],
  };
}

export const Route = createFileRoute("/api/v1/packets")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { supabase, user } = await requireAuthenticatedServerUser(
            request.headers.get("authorization"),
          );
          const url = new URL(request.url);
          return json({
            success: true,
            data: await buildPacketPreviewData(supabase, user.id, url.searchParams.get("packetId")),
          });
        } catch (error) {
          return publicError(error);
        }
      },
      POST: async ({ request }) => {
        try {
          const { supabase, user } = await requireAuthenticatedServerUser(
            request.headers.get("authorization"),
          );
          const body = (await request.json()) as { action?: string; payload?: unknown };
          if (
            body.action === "generate_counselor_packet" ||
            body.action === "regenerate_counselor_packet"
          ) {
            const parsed = GenerateCounselorPacketSchema.parse(body.payload ?? {});
            const packet = await generateCounselorPacket({
              supabase,
              userId: user.id,
              transcriptId: parsed.transcript_id,
              gapAnalysisId: parsed.gap_analysis_id,
              roadmapId: parsed.roadmap_id,
            });
            return json({
              success: true,
              data: {
                packet,
                preview: await buildPacketPreviewData(supabase, user.id, String(packet.packet.id)),
              },
            });
          }
          if (body.action === "get_packet_download_url") {
            const parsed = PacketDownloadSchema.parse(body.payload);
            return json({
              success: true,
              data: await getPacketDownloadUrl({
                supabase,
                userId: user.id,
                packetId: parsed.packet_id,
              }),
            });
          }
          if (body.action === "get_packet_preview") {
            const parsed = z.object({ packet_id: uuid.optional() }).parse(body.payload ?? {});
            return json({
              success: true,
              data: await buildPacketPreviewData(supabase, user.id, parsed.packet_id),
            });
          }
          return json(
            { success: false, error: { message: "Unsupported packet action." } },
            { status: 400 },
          );
        } catch (error) {
          return publicError(error);
        }
      },
    },
  },
});
