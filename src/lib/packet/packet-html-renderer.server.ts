import type { CounselorPacketSnapshot, PacketSectionSnapshot } from "./types.ts";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "<span>Not recorded</span>";
  if (Array.isArray(value)) {
    if (!value.length) return "<span>None recorded</span>";
    return `<ul>${value.map((item) => `<li>${renderValue(item)}</li>`).join("")}</ul>`;
  }
  if (typeof value === "object") {
    return `<dl>${Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `<div><dt>${escapeHtml(key)}</dt><dd>${renderValue(entry)}</dd></div>`)
      .join("")}</dl>`;
  }
  return `<span>${escapeHtml(value)}</span>`;
}

function renderSection(section: PacketSectionSnapshot) {
  return `<section>
    <h2>${escapeHtml(section.order)}. ${escapeHtml(section.title)}</h2>
    ${
      section.missingReason
        ? `<p class="missing">${escapeHtml(section.missingReason)}</p>`
        : renderValue(section.data)
    }
    ${
      section.warnings.length
        ? `<div class="warnings">${section.warnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join("")}</div>`
        : ""
    }
  </section>`;
}

export function renderPacketHtml(snapshot: CounselorPacketSnapshot) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(snapshot.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; line-height: 1.45; }
    header { border-bottom: 4px solid #0A175A; padding-bottom: 20px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 28px; }
    h2 { margin-top: 28px; color: #0A175A; font-size: 18px; }
    section { break-inside: avoid; border-bottom: 1px solid #E5E7EB; padding-bottom: 18px; }
    dl { display: grid; gap: 8px; }
    dt { font-weight: 700; color: #4B5563; }
    dd { margin: 0 0 8px; }
    ul { margin-top: 8px; padding-left: 20px; }
    .disclaimer, .warnings, .missing { background: #FFF8ED; border: 1px solid #F0A33A; padding: 12px; border-radius: 8px; }
    .warnings { background: #FEF2F2; border-color: #FCA5A5; }
    @media print { body { margin: 18mm; } button { display: none; } }
  </style>
</head>
<body>
  <header>
    <p>Scholaport preview</p>
    <h1>${escapeHtml(snapshot.title)}</h1>
    <p>Generated ${escapeHtml(snapshot.generatedAt)}</p>
    <p class="disclaimer">${escapeHtml(snapshot.disclaimerText)}</p>
  </header>
  ${snapshot.sections.map(renderSection).join("\n")}
</body>
</html>`;
}
