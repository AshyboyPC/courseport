import { z } from "zod";

const uuid = z.string().uuid();

export const GenerateCounselorPacketSchema = z.object({
  transcript_id: uuid.optional(),
  gap_analysis_id: uuid.optional(),
  roadmap_id: uuid.optional(),
});

export const PacketDownloadSchema = z.object({
  packet_id: uuid,
});
