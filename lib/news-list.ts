import { matchesSearchQuery, readQueryString } from "@/lib/admin/list-query";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";

export type NewsSortOption = "newest" | "oldest" | "updated";

export interface NewsListFilters {
  q: string;
  category: string;
  sort: NewsSortOption;
}

export interface NewsCategoryOption {
  value: string;
  label: string;
}

export const DEFAULT_NEWS_LIST_FILTERS: NewsListFilters = {
  q: "",
  category: "all",
  sort: "newest",
};

export function getArticleCategoryKey(article: PublicArticleCard): string {
  return article.categorySlug ?? article.category.trim().toLowerCase();
}

export function parseNewsListFilters(
  params: Record<string, string | string[] | undefined>,
): NewsListFilters {
  const sort = readQueryString(params.sort);

  return {
    q: readQueryString(params.q),
    category: readQueryString(params.category) || "all",
    sort:
      sort === "oldest" || sort === "updated" ? sort : "newest",
  };
}

export function newsListFiltersAreActive(filters: NewsListFilters): boolean {
  return (
    Boolean(filters.q.trim()) ||
    filters.category !== "all" ||
    filters.sort !== "newest"
  );
}

export function extractNewsCategories(
  articles: PublicArticleCard[],
): NewsCategoryOption[] {
  const categories = new Map<string, string>();

  for (const article of articles) {
    const value = getArticleCategoryKey(article);
    categories.set(value, article.category);
  }

  return Array.from(categories.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function selectNewsFeaturedArticle(
  articles: PublicArticleCard[],
): PublicArticleCard | null {
  if (articles.length === 0) {
    return null;
  }

  return articles.find((article) => article.featured) ?? articles[0];
}

export function sortNewsArticles(
  articles: PublicArticleCard[],
  sort: NewsSortOption,
): PublicArticleCard[] {
  const sorted = [...articles];

  switch (sort) {
    case "oldest":
      return sorted.sort(
        (left, right) =>
          Date.parse(left.publishedAtIso) - Date.parse(right.publishedAtIso),
      );
    case "updated":
      return sorted.sort(
        (left, right) =>
          Date.parse(right.updatedAtIso) - Date.parse(left.updatedAtIso),
      );
    case "newest":
    default:
      return sorted.sort(
        (left, right) =>
          Date.parse(right.publishedAtIso) - Date.parse(left.publishedAtIso),
      );
  }
}

export function filterNewsArticles(
  articles: PublicArticleCard[],
  filters: NewsListFilters,
): PublicArticleCard[] {
  let result = articles;

  if (filters.q.trim()) {
    result = result.filter((article) =>
      matchesSearchQuery(filters.q, [article.title, article.excerpt]),
    );
  }

  if (filters.category !== "all") {
    result = result.filter(
      (article) => getArticleCategoryKey(article) === filters.category,
    );
  }

  return sortNewsArticles(result, filters.sort);
}

export interface NewsPageData {
  featured: PublicArticleCard | null;
  gridArticles: PublicArticleCard[];
  categories: NewsCategoryOption[];
  filters: NewsListFilters;
  filtersActive: boolean;
  totalPublished: number;
}

export function buildNewsPageData(
  articles: PublicArticleCard[],
  params: Record<string, string | string[] | undefined>,
): NewsPageData {
  const filters = parseNewsListFilters(params);
  const filtersActive = newsListFiltersAreActive(filters);
  const categories = extractNewsCategories(articles);
  const featured = filtersActive ? null : selectNewsFeaturedArticle(articles);
  const filtered = filterNewsArticles(articles, filters);
  const gridArticles = featured
    ? filtered.filter((article) => article.slug !== featured.slug)
    : filtered;

  return {
    featured,
    gridArticles,
    categories,
    filters,
    filtersActive,
    totalPublished: articles.length,
  };
}
