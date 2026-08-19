import type { ArticlePattern } from "@/lib/articles";
import { resolvePublicAuthorDisplay } from "@/lib/articles/author";
import { calculateReadTime } from "@/lib/articles/read-time";
import {
  getStaticFeaturedFallback,
  getStaticLatestFallback,
  getStaticThreatResearchFallback,
  getStaticTrendingFallback,
  mergeArticlesWithFallback,
} from "@/lib/articles/static-fallback";
import { formatArticleDate } from "@/lib/articles";
import { getSiteSettings } from "@/lib/settings/site-settings";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { logQueryError } from "@/lib/supabase/errors";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import type { Article, Category } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const PUBLISHED = "published" as const;

const THREAT_CATEGORY_SLUGS = new Set([
  "threat-intelligence",
  "ransomware",
  "malware",
  "phishing",
  "threat-actor-research",
]);

const THREAT_CATEGORY_KEYWORDS = [
  "threat intelligence",
  "ransomware",
  "malware",
  "phishing",
  "threat actor",
];

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function normalizeArticleSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).trim().toLowerCase();
  } catch {
    return slug.trim().toLowerCase();
  }
}

function logArticleSlugLookup(
  requestedSlug: string,
  details: {
    found: boolean;
    errorCode?: string;
    errorMessage?: string;
    usedCategoryJoin?: boolean;
  },
): void {
  if (!isDevelopment()) {
    return;
  }

  console.info("[public-articles:getArticleBySlug]", {
    requestedSlug,
    found: details.found,
    errorCode: details.errorCode ?? null,
    errorMessage: details.errorMessage ?? null,
    usedCategoryJoin: details.usedCategoryJoin ?? null,
  });
}

type CategorySummary = Pick<Category, "name" | "slug">;

async function loadCategoryMap(
  supabase: SupabaseClient,
): Promise<Map<string, CategorySummary>> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug");

  if (error) {
    logQueryError("loadCategoryMap", error);
    return new Map();
  }

  return new Map(
    (data ?? []).map((category) => [
      category.id,
      {
        name: category.name,
        slug: category.slug,
      },
    ]),
  );
}

export type PublicArticleRow = Article & {
  categories: CategorySummary | null;
};

export interface PublicArticleCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string | null;
  categoryHref: string;
  author: string;
  publishedAtIso: string;
  publishedAtFormatted: string;
  updatedAtIso: string;
  readTime: string;
  featured: boolean;
  featured_image: string | null;
  pattern: ArticlePattern | null;
  content: string | null;
}

const CATEGORY_ROUTE_BY_SLUG: Record<string, string> = {
  "threat-intelligence": "/threats",
  ransomware: "/threats",
  malware: "/threats",
  phishing: "/threats",
  "threat-actor-research": "/threats",
  "ai-security": "/ai-security",
  "cybersecurity-news": "/news",
  news: "/news",
  vulnerabilities: "/vulnerabilities",
  forensics: "/forensics",
};

const CATEGORY_ROUTE_BY_NAME: Record<string, string> = {
  "threat intelligence": "/threats",
  "cybersecurity news": "/news",
  "ai security": "/ai-security",
  "vulnerability watch": "/vulnerabilities",
  "digital forensics": "/forensics",
};

export function resolveCategoryHref(category: CategorySummary | null): string {
  if (!category) {
    return "/news";
  }

  if (category.slug && CATEGORY_ROUTE_BY_SLUG[category.slug]) {
    return CATEGORY_ROUTE_BY_SLUG[category.slug];
  }

  const name = category.name?.toLowerCase().trim() ?? "";
  if (CATEGORY_ROUTE_BY_NAME[name]) {
    return CATEGORY_ROUTE_BY_NAME[name];
  }

  if (name.includes("threat")) return "/threats";
  if (name.includes("ai security") || name.includes("artificial intelligence")) {
    return "/ai-security";
  }
  if (name.includes("vulnerabilit")) return "/vulnerabilities";
  if (name.includes("forensic")) return "/forensics";

  return "/news";
}

export function mapPublicArticleCard(
  row: PublicArticleRow,
  authorFallback?: string,
): PublicArticleCard {
  const publishedAtIso = row.published_at ?? row.created_at;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.categories?.name ?? "Cybersecurity News",
    categorySlug: row.categories?.slug ?? null,
    categoryHref: resolveCategoryHref(row.categories),
    author: resolvePublicAuthorDisplay(row.author, authorFallback),
    publishedAtIso,
    publishedAtFormatted: formatArticleDate(publishedAtIso),
    updatedAtIso: row.updated_at ?? publishedAtIso,
    readTime: calculateReadTime(row.content, row.read_time),
    featured: row.featured,
    featured_image: row.featured_image,
    pattern: row.pattern,
    content: row.content,
  };
}

function mapRows(
  rows: Article[],
  categoryMap: Map<string, CategorySummary>,
  authorFallback?: string,
): PublicArticleCard[] {
  return rows.map((row) =>
    mapPublicArticleCard(
      {
        ...row,
        categories: row.category_id
          ? (categoryMap.get(row.category_id) ?? null)
          : null,
      },
      authorFallback,
    ),
  );
}

async function queryPublishedArticles(
  options?: {
    featured?: boolean;
    limit?: number;
  },
): Promise<PublicArticleCard[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = createPublicServerClient();
    let query = supabase
      .from("articles")
      .select("*")
      .eq("status", PUBLISHED)
      .order("published_at", { ascending: false, nullsFirst: false });

    if (options?.featured) {
      query = query.eq("featured", true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const [{ data, error }, categoryMap, settings] = await Promise.all([
      query,
      loadCategoryMap(supabase),
      getSiteSettings(),
    ]);

    if (error) {
      logQueryError("queryPublishedArticles", error);
      return [];
    }

    return mapRows(
      (data ?? []) as Article[],
      categoryMap,
      settings.publicAuthorName,
    );
  } catch {
    return [];
  }
}

export async function getPublishedArticles(): Promise<PublicArticleCard[]> {
  return queryPublishedArticles();
}

export async function getFeaturedArticles(): Promise<PublicArticleCard[]> {
  return queryPublishedArticles({ featured: true });
}

export async function getLatestArticles(
  limit = 12,
): Promise<PublicArticleCard[]> {
  return queryPublishedArticles({ limit });
}

export function isThreatCategoryArticle(article: PublicArticleCard): boolean {
  const slug = article.categorySlug?.toLowerCase() ?? "";
  if (slug && THREAT_CATEGORY_SLUGS.has(slug)) {
    return true;
  }

  const name = article.category.toLowerCase();
  return THREAT_CATEGORY_KEYWORDS.some((keyword) => name.includes(keyword));
}

export async function getThreatIntelligenceArticles(
  limit = 6,
): Promise<PublicArticleCard[]> {
  const published = await getPublishedArticles();
  return published.filter(isThreatCategoryArticle).slice(0, limit);
}

export async function getArticleBySlug(
  slug: string,
): Promise<PublicArticleCard | null> {
  const requestedSlug = normalizeArticleSlug(slug);

  if (!hasSupabaseEnv()) {
    logArticleSlugLookup(requestedSlug, { found: false });
    return null;
  }

  try {
    const supabase = createPublicServerClient();

    const [{ data, error }, categoryMap, settings] = await Promise.all([
      supabase
        .from("articles")
        .select("*")
        .eq("slug", requestedSlug)
        .eq("status", PUBLISHED)
        .maybeSingle(),
      loadCategoryMap(supabase),
      getSiteSettings(),
    ]);

    if (error) {
      logArticleSlugLookup(requestedSlug, {
        found: false,
        errorCode: error.code,
        errorMessage: error.message,
      });
      logQueryError("getArticleBySlug", error);
      return null;
    }

    if (!data) {
      logArticleSlugLookup(requestedSlug, { found: false });
      return null;
    }

    logArticleSlugLookup(requestedSlug, {
      found: true,
      usedCategoryJoin: false,
    });

    return mapPublicArticleCard(
      {
        ...(data as Article),
        categories: data.category_id
          ? (categoryMap.get(data.category_id) ?? null)
          : null,
      },
      settings.publicAuthorName,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    logArticleSlugLookup(requestedSlug, {
      found: false,
      errorMessage: message,
    });
    return null;
  }
}

export async function getArticlesByCategory(
  categorySlug: string,
): Promise<PublicArticleCard[]> {
  const articles = await getPublishedArticles();
  return articles.filter((article) => article.categorySlug === categorySlug);
}

export async function getRelatedArticles(
  slug: string,
  categorySlug: string | null,
  limit = 3,
): Promise<PublicArticleCard[]> {
  const published = await getPublishedArticles();
  const sameCategory = published.filter(
    (article) =>
      article.slug !== slug &&
      categorySlug &&
      article.categorySlug === categorySlug,
  );
  const others = published.filter(
    (article) =>
      article.slug !== slug &&
      (!categorySlug || article.categorySlug !== categorySlug),
  );

  return [...sameCategory, ...others].slice(0, limit);
}

export async function getPublishedArticleSlugs(): Promise<string[]> {
  const articles = await getPublishedArticles();
  return articles.map((article) => article.slug);
}

export interface HomepageArticles {
  featured: PublicArticleCard | null;
  trending: PublicArticleCard[];
  latest: PublicArticleCard[];
  threatArticles: PublicArticleCard[];
}

export async function getHomepageArticles(): Promise<HomepageArticles> {
  const [featuredArticles, latestArticles, threatDbArticles] = await Promise.all([
    getFeaturedArticles(),
    getLatestArticles(12),
    getThreatIntelligenceArticles(4),
  ]);

  const usedSlugs = new Set<string>();

  const featured =
    featuredArticles[0] ??
    latestArticles.find((article) => article.featured) ??
    latestArticles[0] ??
    getStaticFeaturedFallback();

  if (featured) {
    usedSlugs.add(featured.slug);
  }

  const trending = mergeArticlesWithFallback(
    latestArticles,
    getStaticTrendingFallback(),
    3,
    usedSlugs,
  );

  const latest = mergeArticlesWithFallback(
    latestArticles,
    getStaticLatestFallback(),
    3,
    usedSlugs,
  );

  const threatArticles = mergeArticlesWithFallback(
    threatDbArticles,
    getStaticThreatResearchFallback(),
    4,
    new Set(),
  );

  return {
    featured,
    trending,
    latest,
    threatArticles,
  };
}
