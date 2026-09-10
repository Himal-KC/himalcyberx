const INTENT_EXPANSIONS: Array<{ pattern: RegExp; terms: string[] }> = [
  {
    pattern: /\bprepared(?:ness)?\b|\bprepare\b/i,
    terms: ["prevention", "best practices", "checklist", "readiness"],
  },
  {
    pattern: /\bmitigat/i,
    terms: ["remediation", "defensive actions", "hardening"],
  },
  {
    pattern: /\bresponse\b|\brecover/i,
    terms: ["incident response", "recovery", "containment"],
  },
  {
    pattern: /\bvulnerabilit|\bcve\b/i,
    terms: ["advisory", "affected versions", "patch", "mitigation"],
  },
  {
    pattern: /\bthreat actor\b|\bransomware\b|\bmalware\b/i,
    terms: ["advisory", "TTPs", "indicators", "mitigations"],
  },
  {
    pattern: /\bransomware\b/i,
    terms: ["backup", "recovery", "network defenders", "prevention"],
  },
];

function uniqueQueries(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim().replace(/\s+/g, " ");
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function expandTopicTerms(topic: string): string[] {
  const terms: string[] = [];

  for (const expansion of INTENT_EXPANSIONS) {
    if (expansion.pattern.test(topic)) {
      terms.push(...expansion.terms);
    }
  }

  return terms;
}

export function buildPrimaryResearchQuery(topic: string): string {
  return topic.trim();
}

export function buildIntentExpandedQuery(topic: string): string {
  const expansions = expandTopicTerms(topic).slice(0, 3);
  if (expansions.length === 0) {
    return `${topic} cybersecurity guidance`;
  }

  return `${topic} ${expansions.join(" ")}`;
}

export function buildPublisherHtmlFallbackQuery(
  topic: string,
  publisherDomain: string,
): string {
  const intentTerms = expandTopicTerms(topic).slice(0, 2);
  const suffix = intentTerms.length > 0 ? intentTerms.join(" ") : "guidance";
  return `site:${publisherDomain} ${topic} ${suffix}`;
}

export function buildResearchSearchQueries(topic: string): string[] {
  return uniqueQueries([
    buildPrimaryResearchQuery(topic),
    buildIntentExpandedQuery(topic),
  ]).slice(0, 2);
}

export function countFocusedHtmlSources(
  sources: Array<{ url: string }>,
  isPdf: (url: string) => boolean,
  isGenericIndex: (url: string) => boolean,
): number {
  return sources.filter(
    (source) => !isPdf(source.url) && !isGenericIndex(source.url),
  ).length;
}
