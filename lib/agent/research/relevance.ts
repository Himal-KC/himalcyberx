import type { AgentContentType } from "@/lib/supabase/types";
import type { ResearchSource, VerifiedClaimType } from "@/lib/agent/types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "what",
  "when",
  "where",
  "why",
  "your",
  "this",
  "that",
  "about",
  "using",
  "use",
]);

function normalizeRelevanceText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeRelevanceText(value: string): string[] {
  const normalized = normalizeRelevanceText(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export type RelevanceLevel = "high" | "medium" | "low";

export interface ClaimRelevanceInput {
  topic: string;
  statement: string;
  claimType?: VerifiedClaimType;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
  contentType?: AgentContentType;
}

export interface ClaimRelevanceResult {
  relevanceScore: number;
  relevanceLevel: RelevanceLevel;
  reason: string;
}

const GENERIC_TERMS = new Set([
  "cybersecurity",
  "organization",
  "organizations",
  "guidance",
  "security",
  "agency",
  "information",
  "tools",
  "insights",
  "critical",
  "infrastructure",
  "advisory",
  "advisories",
  "alert",
  "alerts",
  "website",
  "page",
  "resource",
  "resources",
  "official",
  "federal",
  "government",
]);

const DEFENSIVE_TERMS = new Set([
  "ransomware",
  "preparedness",
  "prepare",
  "preparation",
  "prevention",
  "mitigation",
  "mitigate",
  "backup",
  "backups",
  "recovery",
  "response",
  "defense",
  "defend",
  "protect",
  "protection",
  "resilience",
  "restoration",
  "restore",
  "offline",
  "phishing",
  "mfa",
  "authentication",
  "segmentation",
  "incident",
  "patch",
  "remediate",
  "hardening",
  "encrypt",
  "encryption",
  "isolate",
  "containment",
  "exploit",
  "vulnerability",
  "vulnerabilities",
  "cve",
  "malware",
  "breach",
  "threat",
  "actor",
  "indicator",
  "forensic",
]);

const ACTIONABLE_PATTERNS = [
  /\bshould\b/i,
  /\brecommend/i,
  /\bimplement/i,
  /\bmaintain/i,
  /\bapply\b/i,
  /\benforce/i,
  /\benable\b/i,
  /\bdisable\b/i,
  /\bmonitor/i,
  /\btest\b/i,
  /\bdeploy/i,
  /\bconfigure/i,
  /\buse\b.+\bto\b/i,
  /\borganizations?\s+(should|must|need)/i,
];

const PROMOTIONAL_PATTERNS = [
  /\busing every tool available\b/i,
  /\bstands ready\b/i,
  /\bstand ready\b/i,
  /\bcommitment to\b/i,
  /\bempowering\b/i,
  /\bleading the nation\b/i,
  /\bprotecting the nation\b/i,
  /\bworking tirelessly\b/i,
  /\bwe are dedicated\b/i,
  /\bour mission\b/i,
  /\bmission is to\b/i,
  /\bpartnership with\b/i,
  /\bworking together\b/i,
  /\balerts?\s+(typically|may|often|usually)\s+include\b/i,
  /\bthis (page|site|section)\s+(contains|provides|includes)\b/i,
  /\bvisit our website\b/i,
  /\blearn more about\b/i,
  /\bfor more information\b/i,
  /\bclick here\b/i,
];

const PAGE_DESCRIPTION_PATTERNS = [
  /\balerts?\s+(typically|may|often)\s+include\s+information\b/i,
  /\bnewly exploited or disclosed vulnerabilities\b/i,
  /\bthis advisory (page|index)\b/i,
  /\bthese pages (contain|provide|list)\b/i,
  /\bgeneral information about\b/i,
];

function uniqueTokens(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function expandTopicTokens(topic: string, tokens: string[]): string[] {
  const expanded = [...tokens];
  const joined = topic.toLowerCase();

  if (/\bransomware\b/.test(joined)) {
    expanded.push(
      "ransomware",
      "backup",
      "backups",
      "restore",
      "restoration",
      "recovery",
      "phishing",
      "mfa",
      "authentication",
      "prevention",
      "prevent",
    );
  }

  if (/\bpreparedness\b|\bprepare\b|\bpreparation\b/.test(joined)) {
    expanded.push(
      "preparedness",
      "preparation",
      "prepare",
      "backup",
      "backups",
      "plan",
      "prevention",
      "prevent",
    );
  }

  if (/\bmitigation\b|\bmitigate\b/.test(joined)) {
    expanded.push("mitigation", "mitigate", "remediate", "patch");
  }

  if (/\bresponse\b|\bincident\b/.test(joined)) {
    expanded.push("response", "recovery", "contain", "isolate");
  }

  if (/\bphishing\b|\bmfa\b|\bprevention\b|\bprevent\b/.test(joined)) {
    expanded.push("phishing", "mfa", "authentication", "prevention", "prevent");
  }

  return uniqueTokens(expanded.filter((token) => !GENERIC_TERMS.has(token)));
}

function topicImportantTokens(topic: string): string[] {
  const tokens = tokenizeRelevanceText(topic);
  return expandTopicTokens(
    topic,
    tokens.filter((token) => !GENERIC_TERMS.has(token)),
  );
}

function tokensOverlap(topicToken: string, textToken: string): boolean {
  if (topicToken === textToken) {
    return true;
  }

  if (topicToken.length >= 5 && textToken.includes(topicToken)) {
    return true;
  }

  if (textToken.length >= 5 && topicToken.includes(textToken)) {
    return true;
  }

  const stemLength = Math.min(5, topicToken.length, textToken.length);
  if (stemLength >= 4) {
    return (
      topicToken.slice(0, stemLength) === textToken.slice(0, stemLength)
    );
  }

  return false;
}

function countTokenOverlap(
  importantTopicTokens: string[],
  textTokens: string[],
): number {
  let hits = 0;

  for (const topicToken of importantTopicTokens) {
    if (textTokens.some((textToken) => tokensOverlap(topicToken, textToken))) {
      hits += 1;
    }
  }

  return hits;
}

function weightedOverlapScore(
  importantTopicTokens: string[],
  textTokens: string[],
): number {
  if (importantTopicTokens.length === 0 || textTokens.length === 0) {
    return 0;
  }

  let matchedWeight = 0;
  let totalWeight = 0;

  for (const token of importantTopicTokens) {
    const weight = DEFENSIVE_TERMS.has(token) ? 2 : 1;
    totalWeight += weight;
    if (textTokens.some((textToken) => tokensOverlap(token, textToken))) {
      matchedWeight += weight;
    }
  }

  return totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
}

function phraseOverlapBonus(topic: string, statement: string): number {
  const normalizedTopic = topic.toLowerCase().replace(/\s+/g, " ").trim();
  const normalizedStatement = statement.toLowerCase();

  if (normalizedTopic.length >= 8 && normalizedStatement.includes(normalizedTopic)) {
    return 25;
  }

  const topicTokens = topicImportantTokens(topic);
  if (topicTokens.length >= 2) {
    const phrase = topicTokens.slice(0, 3).join(" ");
    if (phrase.length >= 6 && normalizedStatement.includes(phrase)) {
      return 15;
    }
  }

  return 0;
}

export function isGenericOrPromotionalLanguage(statement: string): boolean {
  const normalized = statement.trim();
  if (!normalized) {
    return true;
  }

  if (PROMOTIONAL_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  if (PAGE_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  return false;
}

export function hasActionableGuidance(statement: string): boolean {
  return ACTIONABLE_PATTERNS.some((pattern) => pattern.test(statement));
}

export function isPageDescriptionFragment(statement: string): boolean {
  return PAGE_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(statement));
}

function sourceTitleBonus(topic: string, sourceTitle: string | null | undefined): number {
  if (!sourceTitle?.trim()) {
    return 0;
  }

  const importantTokens = topicImportantTokens(topic);
  const titleTokens = tokenizeRelevanceText(sourceTitle);
  const normalizedTitle = normalizeRelevanceText(sourceTitle);
  const overlap = weightedOverlapScore(importantTokens, titleTokens);
  const phraseHits = importantTokens.filter(
    (token) => token.length >= 5 && normalizedTitle.includes(token),
  ).length;

  return Math.min(20, Math.round(overlap * 0.2 + phraseHits * 4));
}

function genericTermPenalty(statement: string): number {
  const tokens = tokenizeRelevanceText(statement);
  if (tokens.length === 0) {
    return 30;
  }

  const genericCount = tokens.filter((token) => GENERIC_TERMS.has(token)).length;
  const ratio = genericCount / tokens.length;

  if (ratio >= 0.6) {
    return 35;
  }

  if (ratio >= 0.4) {
    return 20;
  }

  return 0;
}

function scoreToLevel(score: number): RelevanceLevel {
  if (score >= 60) {
    return "high";
  }

  if (score >= 40) {
    return "medium";
  }

  return "low";
}

export function scoreClaimRelevance(input: ClaimRelevanceInput): ClaimRelevanceResult {
  const { topic, statement, sourceTitle } = input;
  const claimTokens = tokenizeRelevanceText(statement);
  const importantTopicTokens = topicImportantTokens(topic);

  if (isGenericOrPromotionalLanguage(statement)) {
    return {
      relevanceScore: 10,
      relevanceLevel: "low",
      reason: "Generic agency, promotional, or page-description language.",
    };
  }

  let score = weightedOverlapScore(importantTopicTokens, claimTokens);
  score += phraseOverlapBonus(topic, statement);
  score += sourceTitleBonus(topic, sourceTitle);
  score -= genericTermPenalty(statement);

  if (hasActionableGuidance(statement)) {
    score += 10;

    const actionableTopicHits = countTokenOverlap(
      importantTopicTokens,
      claimTokens,
    );

    if (actionableTopicHits >= 2) {
      score += 15;
    } else if (actionableTopicHits >= 1) {
      score += 8;
    }
  }

  if (importantTopicTokens.length > 0) {
    const claimSet = new Set(claimTokens);
    const defensiveHits = importantTopicTokens.filter(
      (token) => DEFENSIVE_TERMS.has(token) && claimSet.has(token),
    ).length;

    if (defensiveHits === 0 && score < 50) {
      score -= 15;
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const relevanceLevel = scoreToLevel(score);

  let reason = "Moderate topical overlap with the research topic.";
  if (relevanceLevel === "high") {
    reason = "Strong topical overlap with important topic terms.";
  } else if (relevanceLevel === "low") {
    reason = "Limited topical overlap or weak defensive value for this topic.";
  }

  return {
    relevanceScore: score,
    relevanceLevel,
    reason,
  };
}

export function shouldPromoteWebClaim(relevance: ClaimRelevanceResult): boolean {
  if (relevance.relevanceLevel === "high") {
    return true;
  }

  if (relevance.relevanceLevel === "medium") {
    return relevance.relevanceScore >= 45;
  }

  return false;
}

export function scoreSourceRelevance(
  topic: string,
  source: Pick<ResearchSource, "title" | "url" | "discoveryContext">,
): number {
  const titleTokens = tokenizeRelevanceText(source.title);
  const pathTokens = tokenizeRelevanceText(
    source.url.replace(/^https?:\/\//, "").replace(/[/?#]/g, " "),
  );
  const excerptTokens = source.discoveryContext
    ? tokenizeRelevanceText(source.discoveryContext)
    : [];

  const importantTopicTokens = topicImportantTokens(topic);
  const titleScore = weightedOverlapScore(importantTopicTokens, titleTokens);
  const pathScore = weightedOverlapScore(importantTopicTokens, pathTokens);
  const excerptScore = weightedOverlapScore(importantTopicTokens, excerptTokens);

  return Math.min(
    100,
    Math.round(titleScore * 0.55 + pathScore * 0.25 + excerptScore * 0.2),
  );
}

export function rankSourcesByTopicRelevance(
  topic: string,
  sources: ResearchSource[],
): ResearchSource[] {
  return [...sources]
    .map((source, index) => ({
      source,
      index,
      relevance: scoreSourceRelevance(topic, source),
    }))
    .sort((left, right) => {
      if (right.relevance !== left.relevance) {
        return right.relevance - left.relevance;
      }

      return left.index - right.index;
    })
    .map((entry, index) => ({
      ...entry.source,
      sortOrder: index,
    }));
}
