import { articlePath } from "@/lib/articles";
import { formatArticleDate } from "@/lib/articles";
import { isArticlePubliclyAvailable } from "@/lib/articles/publishing";
import type {
  GroupedSearchResults,
  SearchResult,
} from "@/lib/search";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { logQueryError } from "@/lib/supabase/errors";
import { labPath } from "@/lib/supabase/public-labs";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import { tutorialPath } from "@/lib/supabase/public-tutorials";
import type { Article, Category, Lab, Tutorial } from "@/lib/supabase/types";

const PUBLISHED = "published" as const;

const EMPTY_RESULTS: GroupedSearchResults = {
  articles: [],
  labs: [],
  tutorials: [],
};

export interface SearchLimits {
  articles?: number;
  labs?: number;
  tutorials?: number;
}

export interface SearchOptions {
  limits?: SearchLimits;
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/,/g, " ").slice(0, 120);
}

export function getSearchTerms(query: string): string[] {
  return normalizeSearchQuery(query)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function buildIlikePattern(query: string): string {
  return `%${escapeIlikePattern(normalizeSearchQuery(query))}%`;
}

function matchesAllTerms(parts: string[], terms: string[]): boolean {
  if (terms.length === 0) return false;
  const haystack = parts.join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

type ArticleSearchRow = Pick<
  Article,
  "id" | "slug" | "title" | "excerpt" | "published_at" | "status"
> & {
  categories: Pick<Category, "name"> | Pick<Category, "name">[] | null;
};

function resolveCategoryName(
  categories: ArticleSearchRow["categories"],
): string {
  if (!categories) return "";
  if (Array.isArray(categories)) {
    return categories[0]?.name ?? "";
  }
  return categories.name ?? "";
}

function mapArticleResult(row: ArticleSearchRow): SearchResult {
  return {
    id: row.id,
    type: "article",
    title: row.title,
    description: row.excerpt,
    category: resolveCategoryName(row.categories) || "Cybersecurity News",
    publishedAt: row.published_at,
    publishedAtFormatted: row.published_at
      ? formatArticleDate(row.published_at)
      : undefined,
    href: articlePath(row.slug),
  };
}

function mapLabResult(row: Pick<
  Lab,
  "id" | "slug" | "title" | "description" | "category" | "difficulty" | "published_at"
>): SearchResult {
  return {
    id: row.id,
    type: "lab",
    title: row.title,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    publishedAt: row.published_at,
    publishedAtFormatted: row.published_at
      ? formatArticleDate(row.published_at)
      : undefined,
    href: labPath(row.slug),
  };
}

function mapTutorialResult(row: Pick<
  Tutorial,
  "id" | "slug" | "title" | "description" | "category" | "difficulty" | "published_at"
>): SearchResult {
  return {
    id: row.id,
    type: "tutorial",
    title: row.title,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    publishedAt: row.published_at,
    publishedAtFormatted: row.published_at
      ? formatArticleDate(row.published_at)
      : undefined,
    href: tutorialPath(row.slug),
  };
}

function sortByPublishedAt<T extends { published_at: string | null }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const aTime = a.published_at ? Date.parse(a.published_at) : 0;
    const bTime = b.published_at ? Date.parse(b.published_at) : 0;
    return bTime - aTime;
  });
}

async function searchArticles(
  query: string,
  terms: string[],
  limit?: number,
): Promise<SearchResult[]> {
  const supabase = createPublicServerClient();
  const pattern = buildIlikePattern(query);
  const orFilter = `title.ilike.${pattern},excerpt.ilike.${pattern},slug.ilike.${pattern}`;

  const [{ data: textMatches, error: textError }, { data: categories, error: categoryError }] =
    await Promise.all([
      supabase
        .from("articles")
        .select("id, slug, title, excerpt, published_at, status, categories(name)")
        .eq("status", PUBLISHED)
        .or(orFilter),
      supabase.from("categories").select("id, name").ilike("name", pattern),
    ]);

  if (textError) {
    logQueryError("searchArticles:text", textError);
  }

  if (categoryError) {
    logQueryError("searchArticles:categories", categoryError);
  }

  let categoryArticles: ArticleSearchRow[] = [];
  const categoryIds = (categories ?? []).map((category) => category.id);

  if (categoryIds.length > 0) {
    const { data, error } = await supabase
      .from("articles")
      .select("id, slug, title, excerpt, published_at, status, categories(name)")
      .eq("status", PUBLISHED)
      .in("category_id", categoryIds);

    if (error) {
      logQueryError("searchArticles:categoryArticles", error);
    } else {
      categoryArticles = (data ?? []) as unknown as ArticleSearchRow[];
    }
  }

  const merged = dedupeById([
    ...((textMatches ?? []) as unknown as ArticleSearchRow[]),
    ...categoryArticles,
  ]);

  const publiclyAvailable = merged.filter((row) =>
    isArticlePubliclyAvailable(row),
  );

  const filtered = publiclyAvailable.filter((row) =>
    matchesAllTerms(
      [
        row.title,
        row.excerpt,
        row.slug,
        resolveCategoryName(row.categories),
      ],
      terms,
    ),
  );

  const sorted = sortByPublishedAt(filtered);
  const sliced = typeof limit === "number" ? sorted.slice(0, limit) : sorted;

  return sliced.map(mapArticleResult);
}

async function searchLabs(
  query: string,
  terms: string[],
  limit?: number,
): Promise<SearchResult[]> {
  const supabase = createPublicServerClient();
  const pattern = buildIlikePattern(query);
  const orFilter = `title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern},slug.ilike.${pattern}`;

  const { data, error } = await supabase
    .from("labs")
    .select("id, slug, title, description, category, difficulty, published_at")
    .eq("status", PUBLISHED)
    .or(orFilter);

  if (error) {
    logQueryError("searchLabs", error);
    return [];
  }

  const filtered = ((data ?? []) as Lab[]).filter((row) =>
    matchesAllTerms(
      [row.title, row.description, row.category, row.slug],
      terms,
    ),
  );

  const sorted = sortByPublishedAt(filtered);
  const sliced = typeof limit === "number" ? sorted.slice(0, limit) : sorted;

  return sliced.map(mapLabResult);
}

async function searchTutorials(
  query: string,
  terms: string[],
  limit?: number,
): Promise<SearchResult[]> {
  const supabase = createPublicServerClient();
  const pattern = buildIlikePattern(query);
  const orFilter = `title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern},slug.ilike.${pattern}`;

  const { data, error } = await supabase
    .from("tutorials")
    .select("id, slug, title, description, category, difficulty, published_at")
    .eq("status", PUBLISHED)
    .or(orFilter);

  if (error) {
    logQueryError("searchTutorials", error);
    return [];
  }

  const filtered = ((data ?? []) as Tutorial[]).filter((row) =>
    matchesAllTerms(
      [row.title, row.description, row.category, row.slug],
      terms,
    ),
  );

  const sorted = sortByPublishedAt(filtered);
  const sliced = typeof limit === "number" ? sorted.slice(0, limit) : sorted;

  return sliced.map(mapTutorialResult);
}

export async function searchPublishedContent(
  query: string,
  options: SearchOptions = {},
): Promise<GroupedSearchResults> {
  const normalized = normalizeSearchQuery(query);
  const terms = getSearchTerms(normalized);

  if (terms.length < 2 && normalized.length < 2) {
    return EMPTY_RESULTS;
  }

  if (!hasSupabaseEnv()) {
    return EMPTY_RESULTS;
  }

  try {
    const [articles, labs, tutorials] = await Promise.all([
      searchArticles(normalized, terms, options.limits?.articles),
      searchLabs(normalized, terms, options.limits?.labs),
      searchTutorials(normalized, terms, options.limits?.tutorials),
    ]);

    return { articles, labs, tutorials };
  } catch {
    return EMPTY_RESULTS;
  }
}

export const QUICK_SEARCH_LIMITS: SearchLimits = {
  articles: 5,
  labs: 3,
  tutorials: 3,
};
