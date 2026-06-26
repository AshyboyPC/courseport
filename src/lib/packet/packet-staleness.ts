export function packetIsStale(packet: Record<string, unknown> | null | undefined) {
  return packet?.status === "stale" || Boolean(packet?.stale_reason);
}

export function stalePacketMessage(packet: Record<string, unknown> | null | undefined) {
  if (!packetIsStale(packet)) return null;
  const reason = packet?.stale_reason ? ` Reason: ${packet.stale_reason}.` : "";
  return `This packet may be outdated because your transcript, credit map, gap analysis, roadmap, or profile changed.${reason} Regenerate it before sharing it with a counselor.`;
}
