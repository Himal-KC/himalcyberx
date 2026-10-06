import type { PersistedResearchPayload } from "../generation/types";
import type { CategoryInventoryItem, RecommendedCategory } from "../types";

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

function normalizeAwarenessText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeAwarenessText(value: string): string[] {
  const normalized = normalizeAwarenessText(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function uniqueTokens(values: string[]): Set<string> {
  return new Set(values);
}

function jaccardTokenSimilarity(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 && right.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  const union = left.size + right.size - intersection;
  if (union === 0) {
    return 0;
  }

  return intersection / union;
}

export function scoreCategoryMatch(topic: string, categoryText: string): number {
  const topicTokens = uniqueTokens(tokenizeAwarenessText(topic));
  const categoryTokens = uniqueTokens(tokenizeAwarenessText(categoryText));
  return Math.round(jaccardTokenSimilarity(topicTokens, categoryTokens) * 100);
}

const VULNERABILITY_TOPIC_PATTERN =
  /\bcve[\s-]?\d{4}[\s-]?\d+\b|\bvulnerabilit|\bexploit|\bcvss\b|\bkev\b|\bzero day|\badvisory|\bpatch\b/i;

function categorySignalsVulnerabilityScope(category: CategoryInventoryItem): boolean {
  const haystack = normalizeAwarenessText(
    `${category.name} ${category.slug} ${category.description ?? ""}`,
  );
  return /\bvulnerabilit|\badvisory|\bcve\b|\bexploit|\bkev\b/.test(haystack);
}

function topicSignalsVulnerabilityContent(topic: string, categoryRecommendation?: string | null): boolean {
  const haystack = normalizeAwarenessText(
    `${topic} ${categoryRecommendation ?? ""}`,
  );
  return VULNERABILITY_TOPIC_PATTERN.test(haystack);
}

export function matchCategoryByRecommendationName(
  categoryRecommendation: string,
  categories: CategoryInventoryItem[],
): RecommendedCategory | null {
  const normalizedRecommendation = normalizeAwarenessText(categoryRecommendation);
  if (!normalizedRecommendation) {
    return null;
  }

  for (const category of categories) {
    const normalizedName = normalizeAwarenessText(category.name);
    const normalizedSlug = normalizeAwarenessText(category.slug.replace(/-/g, " "));
    if (
      normalizedRecommendation === normalizedName ||
      normalizedRecommendation === normalizedSlug
    ) {
      return { id: category.id, name: category.name };
    }
  }

  return null;
}

export function recommendArticleCategory(
  topic: string,
  categories: CategoryInventoryItem[],
  options?: { categoryRecommendation?: string | null },
): RecommendedCategory {
  const recommendation = options?.categoryRecommendation?.trim() ?? "";
  if (recommendation) {
    const exact = matchCategoryByRecommendationName(recommendation, categories);
    if (exact?.id) {
      return exact;
    }
  }

  const topicHaystack = recommendation ? `${topic} ${recommendation}` : topic;
  let best: RecommendedCategory = { id: null, name: "" };
  let bestScore = 0;

  for (const category of categories) {
    let score = Math.max(
      scoreCategoryMatch(topicHaystack, category.name),
      scoreCategoryMatch(topicHaystack, `${category.name} ${category.slug}`),
      scoreCategoryMatch(topicHaystack, category.description ?? ""),
    );

    if (
      topicSignalsVulnerabilityContent(topic, recommendation) &&
      categorySignalsVulnerabilityScope(category)
    ) {
      score = Math.max(score, 28);
    }

    if (score > bestScore) {
      bestScore = score;
      best = { id: category.id, name: category.name };
    }
  }

  if (bestScore < 20) {
    return { id: null, name: "" };
  }

  return best;
}

export interface CategoryRowForMatching {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export function mapCategoryRowsToInventory(
  rows: CategoryRowForMatching[],
): CategoryInventoryItem[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
  }));
}

export function getPersistedArticleCategoryRecommendation(
  payload: PersistedResearchPayload | null,
): RecommendedCategory | null {
  if (!payload) {
    return null;
  }

  if (payload.contentAwareness?.recommendedCategory?.name) {
    return payload.contentAwareness.recommendedCategory;
  }

  if (payload.categoryRecommendation?.trim()) {
    return {
      id: payload.categoryId ?? null,
      name: payload.categoryRecommendation.trim(),
    };
  }

  return null;
}

export function isValidatedCategoryMatch(
  categoryId: string,
  categoryName: string,
  categories: CategoryInventoryItem[],
): boolean {
  const matched = categories.find((entry) => entry.id === categoryId);
  return matched?.name === categoryName;
}

export function resolveValidatedArticleCategoryId(input: {
  topic: string;
  categories: CategoryInventoryItem[];
  persistedRecommendation?: RecommendedCategory | null;
  categoryRecommendation?: string | null;
}): string | null {
  if (input.categories.length === 0 || !input.topic.trim()) {
    return null;
  }

  const recommendationLabel =
    input.categoryRecommendation?.trim() ||
    input.persistedRecommendation?.name?.trim() ||
    null;

  if (recommendationLabel) {
    const exact = matchCategoryByRecommendationName(
      recommendationLabel,
      input.categories,
    );
    if (exact?.id && isValidatedCategoryMatch(exact.id, exact.name, input.categories)) {
      return exact.id;
    }
  }

  const fresh = recommendArticleCategory(input.topic, input.categories, {
    categoryRecommendation: recommendationLabel,
  });
  if (
    fresh.id &&
    fresh.name &&
    isValidatedCategoryMatch(fresh.id, fresh.name, input.categories)
  ) {
    return fresh.id;
  }

  const persisted = input.persistedRecommendation;
  if (
    persisted?.id &&
    persisted.name &&
    isValidatedCategoryMatch(persisted.id, persisted.name, input.categories)
  ) {
    return persisted.id;
  }

  return null;
}

export function resolveApplicableArticleCategory(input: {
  topic: string;
  categories: CategoryInventoryItem[];
  persistedRecommendation?: RecommendedCategory | null;
  categoryRecommendation?: string | null;
}): RecommendedCategory | null {
  const categoryId = resolveValidatedArticleCategoryId(input);
  if (!categoryId) {
    return null;
  }

  const matched = input.categories.find((entry) => entry.id === categoryId);
  if (!matched) {
    return null;
  }

  return {
    id: matched.id,
    name: matched.name,
  };
}
