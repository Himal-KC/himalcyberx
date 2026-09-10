import "server-only";

import type { DiscoveryContext, ResearchSource } from "@/lib/agent/types";
import {
  extractCleanStatements,
  normalizeSourceText,
  truncateDiscoveryExcerpt,
} from "@/lib/agent/research/source-text";

export function attachDiscoveryContext(
  sources: ResearchSource[],
): ResearchSource[] {
  return sources.map((source) => {
    const rawSnippet = source.discoveryContext ?? source.supportsClaims?.join(" ") ?? "";
    const normalized = normalizeSourceText(rawSnippet);

    return {
      ...source,
      discoveryContext: normalized
        ? truncateDiscoveryExcerpt(normalized)
        : null,
      supportsClaims: null,
    };
  });
}

export function buildDiscoveryContexts(
  sources: ResearchSource[],
): DiscoveryContext[] {
  return sources
    .filter((source) => source.discoveryContext)
    .map((source) => ({
      url: source.url,
      title: source.title,
      publisher: source.publisher ?? null,
      excerpt: source.discoveryContext ?? null,
    }));
}

export function extractPromotableStatementsFromSources(
  sources: ResearchSource[],
): Array<{ statement: string; source: ResearchSource }> {
  const promotable: Array<{ statement: string; source: ResearchSource }> = [];

  for (const source of sources) {
    const raw = source.discoveryContext ?? "";
    const statements = extractCleanStatements(raw);

    for (const statement of statements.slice(0, 2)) {
      promotable.push({ statement, source });
    }
  }

  return promotable;
}
