/** Same semantics as Phase 7 readiness structure checks. */
export const KEY_TAKEAWAYS_HEADING_PATTERN =
  /<h2[^>]*>\s*Key Takeaways\s*<\/h2>/gi;

const KEY_TAKEAWAYS_SECTION_PATTERN =
  /<h2[^>]*>\s*Key Takeaways\s*<\/h2>\s*([\s\S]*?)(?=<h2\b[^>]*>|$)/gi;

function normalizeTakeawayText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractListItems(sectionInner: string): string[] {
  const items: string[] = [];
  const liPattern = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = liPattern.exec(sectionInner)) !== null) {
    const inner = match[1]?.trim() ?? "";
    if (normalizeTakeawayText(inner)) {
      items.push(inner);
    }
  }
  return items;
}

export function countKeyTakeawaysSections(content: string): number {
  return content.match(KEY_TAKEAWAYS_HEADING_PATTERN)?.length ?? 0;
}

export function dedupeKeyTakeawaysSections(content: string): string {
  const trimmed = content.trim();
  if (!trimmed || countKeyTakeawaysSections(trimmed) <= 1) {
    return trimmed;
  }

  const sections: string[] = [];
  let match: RegExpExecArray | null;
  const sectionPattern = new RegExp(KEY_TAKEAWAYS_SECTION_PATTERN.source, "gi");
  while ((match = sectionPattern.exec(trimmed)) !== null) {
    sections.push(match[1] ?? "");
  }

  const seen = new Set<string>();
  const mergedItems: string[] = [];
  for (const section of sections) {
    for (const item of extractListItems(section)) {
      const key = normalizeTakeawayText(item);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      mergedItems.push(item);
    }
  }

  let withoutSections = trimmed.replace(
    new RegExp(KEY_TAKEAWAYS_SECTION_PATTERN.source, "gi"),
    "",
  );
  withoutSections = withoutSections.replace(/\s+$/g, "").trim();

  if (mergedItems.length === 0) {
    return withoutSections;
  }

  const listHtml = mergedItems
    .map((item) => `<li>${item}</li>`)
    .join("");
  const canonical = `<h2>Key Takeaways</h2><ul>${listHtml}</ul>`;

  return withoutSections ? `${withoutSections}\n${canonical}` : canonical;
}
