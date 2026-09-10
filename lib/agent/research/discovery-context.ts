import "server-only";

import type { DiscoveryContext, ResearchSource } from "@/lib/agent/types";
import {
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
