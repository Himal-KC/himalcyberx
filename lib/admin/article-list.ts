import {
  isArticlePubliclyAvailable,
  isArticleScheduled,
} from "@/lib/articles/publishing";
import {
  matchesSearchQuery,
  readQueryString,
  type ContentSortOption,
} from "@/lib/admin/list-query";
import type { AdminArticleRow } from "@/lib/supabase/types";

export type ArticleStatusFilter = "all" | "published" | "draft" | "scheduled";
export type ArticleFeaturedFilter = "all" | "featured" | "not-featured";
export type ArticleSortOption = ContentSortOption | "scheduled-soon";

export interface ArticleListFilters {
  q: string;
  status: ArticleStatusFilter;
  category: string;
  featured: ArticleFeaturedFilter;
  sort: ArticleSortOption;
}

export const DEFAULT_ARTICLE_LIST_FILTERS: ArticleListFilters = {
  q: "",
  status: "all",
  category: "all",
  featured: "all",
  sort: "newest",
};

const ARTICLE_FILTER_KEYS = ["q", "status", "category", "featured", "sort"] as const;

export function parseArticleListFilters(
  params: Record<string, string | string[] | undefined>,
): ArticleListFilters {
  const status = readQueryString(params.status);
  const featured = readQueryString(params.featured);
  const sort = readQueryString(params.sort);

  return {
    q: readQueryString(params.q),
    status:
      status === "published" ||
      status === "draft" ||
      status === "scheduled"
        ? status
        : "all",
    category: readQueryString(params.category) || "all",
    featured:
      featured === "featured" || featured === "not-featured"
        ? featured
        : "all",
    sort:
      sort === "oldest" ||
      sort === "updated" ||
      sort === "scheduled-soon"
        ? sort
        : "newest",
  };
}

export function articleListFiltersAreActive(
  filters: ArticleListFilters,
): boolean {
  return (
    Boolean(filters.q.trim()) ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    filters.featured !== "all" ||
    filters.sort !== "newest"
  );
}

export function filterArticles(
  articles: AdminArticleRow[],
  filters: ArticleListFilters,
): AdminArticleRow[] {
  return articles.filter((article) => {
    if (
      !matchesSearchQuery(filters.q, [article.title, article.slug])
    ) {
      return false;
    }

    if (filters.status === "published" && !isArticlePubliclyAvailable(article)) {
      return false;
    }

    if (filters.status === "draft" && article.status !== "draft") {
      return false;
    }

    if (filters.status === "scheduled" && !isArticleScheduled(article)) {
      return false;
    }

    if (
      filters.category !== "all" &&
      article.category_id !== filters.category
    ) {
      return false;
    }

    if (filters.featured === "featured" && !article.featured) {
      return false;
    }

    if (filters.featured === "not-featured" && article.featured) {
      return false;
    }

    return true;
  });
}

export function sortArticles(
  articles: AdminArticleRow[],
  sort: ArticleSortOption,
): AdminArticleRow[] {
  const sorted = [...articles];

  switch (sort) {
    case "oldest":
      return sorted.sort(
        (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
      );
    case "updated":
      return sorted.sort(
        (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
      );
    case "scheduled-soon":
      return sorted.sort((a, b) => {
        const aScheduled = isArticleScheduled(a)
          ? Date.parse(a.published_at as string)
          : Number.POSITIVE_INFINITY;
        const bScheduled = isArticleScheduled(b)
          ? Date.parse(b.published_at as string)
          : Number.POSITIVE_INFINITY;

        if (aScheduled !== bScheduled) {
          return aScheduled - bScheduled;
        }

        return Date.parse(b.updated_at) - Date.parse(a.updated_at);
      });
    case "newest":
    default:
      return sorted.sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
      );
  }
}

export function applyArticleListFilters(
  articles: AdminArticleRow[],
  filters: ArticleListFilters,
): AdminArticleRow[] {
  return sortArticles(filterArticles(articles, filters), filters.sort);
}

export function buildArticleListSearchParams(
  filters: ArticleListFilters,
  preserve?: Record<string, string>,
): URLSearchParams {
  const params = new URLSearchParams();

  if (preserve?.success) {
    params.set("success", preserve.success);
  }

  if (filters.q.trim()) {
    params.set("q", filters.q.trim());
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.category !== "all") {
    params.set("category", filters.category);
  }

  if (filters.featured !== "all") {
    params.set("featured", filters.featured);
  }

  if (filters.sort !== "newest") {
    params.set("sort", filters.sort);
  }

  return params;
}

export { ARTICLE_FILTER_KEYS };
