import { matchAuthoritativeDomain } from "@/lib/agent/research/authoritative-domains";
import { buildPublisherHtmlFallbackQuery } from "@/lib/agent/research/search-queries-core";

export {
  buildIntentExpandedQuery,
  buildPrimaryResearchQuery,
  buildPublisherHtmlFallbackQuery,
  buildResearchSearchQueries,
  countFocusedHtmlSources,
} from "@/lib/agent/research/search-queries-core";

export function buildPdfHtmlFallbackQueries(
  topic: string,
  sourceUrls: string[],
): string[] {
  const domains = new Set<string>();

  for (const url of sourceUrls) {
    const authority = matchAuthoritativeDomain(url);
    if (!authority) {
      continue;
    }

    domains.add(authority.domain);
  }

  return [...domains]
    .slice(0, 2)
    .map((domain) => buildPublisherHtmlFallbackQuery(topic, domain));
}

