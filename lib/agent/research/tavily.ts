import "server-only";

import type { ResearchSource } from "@/lib/agent/types";
import {
  AUTHORITATIVE_SEARCH_DOMAINS,
  isValidResearchUrl,
  matchAuthoritativeDomain,
  normalizeResearchUrl,
} from "@/lib/agent/research/authoritative-domains";
import { getTavilyApiKey, hasTavilyApiKey } from "@/lib/agent/research/env";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RESULTS = 8;

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
}

function buildCybersecurityQuery(topic: string): string {
  return `${topic} cybersecurity vulnerability threat advisory`;
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
  const snippet = result.content?.trim().slice(0, 500) || null;

  return {
    title,
    url: normalizedUrl,
    publisher: authority.publisher,
    sourceType: authority.sourceType,
    publishedAt,
    supportsClaims: snippet ? [snippet] : null,
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

export async function searchAuthoritativeSources(
  topic: string,
): Promise<TavilySearchOutcome> {
  if (!hasTavilyApiKey()) {
    return {
      ok: false,
      sources: [],
      error: "Tavily API is not configured.",
    };
  }

  const response = await fetchTavily({
    query: buildCybersecurityQuery(topic),
    search_depth: "advanced",
    max_results: MAX_RESULTS,
    include_domains: AUTHORITATIVE_SEARCH_DOMAINS,
    include_answer: false,
    include_raw_content: false,
  });

  if (!response.ok) {
    return { ok: false, sources: [], error: response.error };
  }

  const normalized = (response.data.results ?? [])
    .map((result, index) => normalizeTavilyResult(result, index))
    .filter((source): source is ResearchSource => source !== null);

  const ranked = deduplicateSources(normalized).sort((left, right) => {
    const leftAuthority = matchAuthoritativeDomain(left.url);
    const rightAuthority = matchAuthoritativeDomain(right.url);
    const leftPriority = leftAuthority?.priority ?? 999;
    const rightPriority = rightAuthority?.priority ?? 999;
    return leftPriority - rightPriority;
  });

  return {
    ok: true,
    sources: ranked.slice(0, MAX_RESULTS).map((source, index) => ({
      ...source,
      sortOrder: index,
    })),
  };
}
