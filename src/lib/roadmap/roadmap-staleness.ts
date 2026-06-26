export function roadmapIsStale(roadmap: Record<string, unknown> | null | undefined) {
  return roadmap?.status === "stale" || Boolean(roadmap?.stale_reason);
}

export function staleRoadmapMessage(roadmap: Record<string, unknown> | null | undefined) {
  if (!roadmapIsStale(roadmap)) return null;
  const reason = roadmap?.stale_reason ? ` Reason: ${roadmap.stale_reason}.` : "";
  return `This roadmap may be outdated because your transcript, credit map, gap analysis, or profile changed.${reason} Regenerate it before using it for planning.`;
}
