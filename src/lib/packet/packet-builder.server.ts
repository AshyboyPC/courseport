import { buildCounselorPacketSnapshot } from "./packet-snapshot.ts";
import type { BuiltCounselorPacket, PacketAssemblyContext } from "./types.ts";

export function buildCounselorPacket(context: PacketAssemblyContext): BuiltCounselorPacket {
  return buildCounselorPacketSnapshot(context);
}
