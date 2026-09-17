import "server-only";

import type { ResearchSource } from "@/lib/agent/types";
import {
  AUTHORITATIVE_SEARCH_DOMAINS,
  isValidResearchUrl,
  matchAuthoritativeDomain,
  normalizeResearchUrl,
} from "@/lib/agent/research/authoritative-domains";
import {
  buildPdfHtmlFallbackQueries,
  buildResearchSearchQueries,
  countFocusedHtmlSources,
} from "@/lib/agent/research/search-queries";
import {
  isGenericIndexPage,
  isLikelyPdfUrl,
  scoreSourcePathQuality,
} from "@/lib/agent/research/source-quality";
import { getTavilyApiKey, hasTavilyApiKey } from "@/lib/agent/research/env";
import { truncateDiscoveryExcerpt } from "@/lib/agent/research/source-text";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RESULTS_PER_QUERY = 6;
const MAX_TOTAL_SOURCES = 10;
const MIN_FOCUSED_HTML_SOURCES = 3;

interface TavilySearchResult {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string;
  score?: number;
}

interface TavilySearchResponse {
  results?: TavilySearchResult[];
  error?: string;
}

export interface TavilySearchOutcome {
  ok: boolean;
  sources: ResearchSource[];
  error?: string;
  queryCount?: number;
}

async function fetchTavily(
  body: Record<string, unknown>,
): Promise<{ ok: true; data: TavilySearchResponse } | { ok: false; error: string }> {
  const apiKey = getTavilyApiKey();
  if (!apiKey) {
    return { ok: false, error: "Tavily API is not configured." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(TAVILY_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        api_key: apiKey,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Tavily search request failed (${response.status}).`,
      };
    }

    const data = (await response.json()) as TavilySearchResponse;
    if (data.error) {
      return { ok: false, error: "Tavily search returned an error." };
    }

    return { ok: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: "Tavily search timed out." };
    }

    return { ok: false, error: "Tavily search is temporarily unavailable." };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeTavilyResult(
  result: TavilySearchResult,
  sortOrder: number,
): ResearchSource | null {
  const rawUrl = result.url?.trim();
  if (!rawUrl || !isValidResearchUrl(rawUrl)) {
    return null;
  }

  const normalizedUrl = normalizeResearchUrl(rawUrl);
  if (!normalizedUrl) {
    return null;
  }

  const authority = matchAuthoritativeDomain(normalizedUrl);
  if (!authority) {
    return null;
  }

  const title = result.title?.trim() || authority.publisher;
  const publishedAt = result.published_date?.trim() || null;
  const snippet = result.content?.trim() || null;

  return {
    title,
    url: normalizedUrl,
    publisher: authority.publisher,
    sourceType: authority.sourceType,
    publishedAt,
    discoveryContext: snippet ? truncateDiscoveryExcerpt(snippet, 500) : null,
    supportsClaims: null,
    sortOrder,
  };
}

function deduplicateSources(sources: ResearchSource[]): ResearchSource[] {
  const seen = new Set<string>();
  const deduped: ResearchSource[] = [];

  for (const source of sources) {
    const key = source.url.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(source);
  }

  return deduped;
}

function rankDiscoveredSources(sources: ResearchSource[]): ResearchSource[] {
  return [...sources].sort((left, right) => {
    const leftPath = scoreSourcePathQuality(left.url);
    const rightPath = scoreSourcePathQuality(right.url);
    if (rightPath !== leftPath) {
      return rightPath - leftPath;
    }

    const leftAuthority = matchAuthoritativeDomain(left.url);
    const rightAuthority = matchAuthoritativeDomain(right.url);
    const leftPriority = leftAuthority?.priority ?? 999;
    const rightPriority = rightAuthority?.priority ?? 999;
    return leftPriority - rightPriority;
  });
}

async function runTavilyQuery(query: string): Promise<ResearchSource[]> {
  const response = await fetchTavily({
    query,
    search_depth: "advanced",
    max_results: MAX_RESULTS_PER_QUERY,
    include_domains: AUTHORITATIVE_SEARCH_DOMAINS,
    include_answer: false,
    include_raw_content: false,
  });

  if (!response.ok) {
    return [];
  }

  return (response.data.results ?? [])
    .map((result, index) => normalizeTavilyResult(result, index))
    .filter((source): source is ResearchSource => source !== null);
}

export async function searchAuthoritativeSources(
  topic: string,
): Promise<TavilySearchOutcome> {
  return searchAuthoritativeSourcesForQueries(buildResearchSearchQueries(topic));
}

export async function searchAuthoritativeSourcesForQueries(
  queries: string[],
): Promise<TavilySearchOutcome> {
  if (!hasTavilyApiKey()) {
    return {
      ok: false,
      sources: [],
      error: "Tavily API is not configured.",
    };
  }

  const uniqueQueries = [...new Set(queries.map((query) => query.trim()).filter(Boolean))];
  if (uniqueQueries.length === 0) {
    return {
      ok: false,
      sources: [],
      error: "No research queries were provided.",
    };
  }

  let queryCount = 0;
  let collected: ResearchSource[] = [];

  for (const query of uniqueQueries) {
    const batch = await runTavilyQuery(query);
    queryCount += 1;
    collected = deduplicateSources([...collected, ...batch]);

    const focusedHtmlCount = countFocusedHtmlSources(
      collected,
      isLikelyPdfUrl,
      isGenericIndexPage,
    );

    if (focusedHtmlCount >= MIN_FOCUSED_HTML_SOURCES) {
      break;
    }
  }

  const focusedHtmlCount = countFocusedHtmlSources(
    collected,
    isLikelyPdfUrl,
    isGenericIndexPage,
  );

  const pdfUrls = collected
    .filter((source) => isLikelyPdfUrl(source.url))
    .map((source) => source.url);

  if (focusedHtmlCount < MIN_FOCUSED_HTML_SOURCES && queryCount < 3) {
    const topic = uniqueQueries[0] ?? "";
    const fallbackQueries = buildPdfHtmlFallbackQueries(topic, pdfUrls).slice(
      0,
      3 - queryCount,
    );

    for (const query of fallbackQueries) {
      const batch = await runTavilyQuery(query);
      queryCount += 1;
      collected = deduplicateSources([...collected, ...batch]);

      const updatedFocusedCount = countFocusedHtmlSources(
        collected,
        isLikelyPdfUrl,
        isGenericIndexPage,
      );

      if (updatedFocusedCount >= MIN_FOCUSED_HTML_SOURCES) {
        break;
      }
    }
  }

  if (collected.length === 0) {
    return {
      ok: false,
      sources: [],
      error: "No authoritative cybersecurity sources were found for this topic.",
      queryCount,
    };
  }

  const ranked = rankDiscoveredSources(collected)
    .slice(0, MAX_TOTAL_SOURCES)
    .map((source, index) => ({
      ...source,
      sortOrder: index,
    }));

  return {
    ok: true,
    sources: ranked,
    queryCount,
  };
}
