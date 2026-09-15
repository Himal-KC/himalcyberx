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

export function recommendArticleCategory(
  topic: string,
  categories: CategoryInventoryItem[],
): RecommendedCategory {
  let best: RecommendedCategory = { id: null, name: "" };
  let bestScore = 0;

  for (const category of categories) {
    const score = Math.max(
      scoreCategoryMatch(topic, category.name),
      scoreCategoryMatch(topic, `${category.name} ${category.slug}`),
      scoreCategoryMatch(topic, category.description ?? ""),
    );

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
}): string | null {
  if (input.categories.length === 0 || !input.topic.trim()) {
    return null;
  }

  const fresh = recommendArticleCategory(input.topic, input.categories);
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
