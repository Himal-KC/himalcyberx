import type { ArticlePattern } from "@/lib/articles";
import {
  getStaticNewsFallback,
  mergeArticlesWithFallback,
} from "@/lib/articles/static-fallback";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";

export interface NewsListItem {
  id: string;
  slug: string;
  category: string;
  headline: string;
  description: string;
  author: string;
  date: string;
  dateIso: string;
  readTime: string;
  featured: boolean;
  pattern: ArticlePattern;
  featured_image: string | null;
}

function mapDbArticleToNewsItem(
  article: PublicArticleCard,
  featured = false,
): NewsListItem {
  return {
    id: article.id,
    slug: article.slug,
    category: article.category,
    headline: article.title,
    description: article.excerpt,
    author: article.author,
    date: article.publishedAtFormatted,
    dateIso: article.publishedAtIso,
    readTime: article.readTime,
    featured,
    pattern: article.pattern ?? "network",
    featured_image: article.featured_image,
  };
}

export function buildNewsListItems(
  dbArticles: PublicArticleCard[],
): NewsListItem[] {
  const merged = mergeArticlesWithFallback(
    dbArticles,
    getStaticNewsFallback(),
    Math.max(6, dbArticles.length + getStaticNewsFallback().length),
  );

  if (merged.length === 0) {
    return [];
  }

  const featuredArticle =
    merged.find((article) => article.featured) ?? merged[0];

  return merged.map((article) =>
    mapDbArticleToNewsItem(article, article.id === featuredArticle.id),
  );
}

export function mapPublicArticleToGridCard(article: PublicArticleCard) {
  return {
    id: article.id,
    slug: article.slug,
    category: article.category,
    headline: article.title,
    description: article.excerpt,
    author: article.author,
    date: article.publishedAtFormatted,
    dateIso: article.publishedAtIso,
    readTime: article.readTime,
    pattern: article.pattern ?? "network",
    featured_image: article.featured_image,
    featured_image_alt: article.featured_image_alt,
  };
}
