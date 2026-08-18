import {
  articleToCard,
  getArticleBySlug,
  type ArticlePattern,
} from "@/lib/articles";
import { DEFAULT_ARTICLE_AUTHOR } from "@/lib/articles/author";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import {
  featuredStory,
  latestStories,
  trendingStories,
} from "@/lib/sample-data";
import { newsArticles, threatResearch } from "@/lib/page-data";

function staticArticleToCard(
  slug: string,
  pattern?: ArticlePattern | null,
): PublicArticleCard | null {
  const article = getArticleBySlug(slug);
  if (!article) {
    return null;
  }

  const card = articleToCard(article);

  return {
    id: `static-${slug}`,
    slug: article.slug,
    title: card.headline,
    excerpt: card.description,
    category: card.category,
    categorySlug: null,
    categoryHref: article.categoryHref,
    author: DEFAULT_ARTICLE_AUTHOR,
    publishedAtIso: card.dateIso,
    publishedAtFormatted: card.date,
    readTime: card.readTime,
    featured: slug === featuredStory.slug,
    featured_image: null,
    pattern: pattern ?? card.pattern ?? "network",
    content: null,
  };
}

export function getStaticFeaturedFallback(): PublicArticleCard | null {
  return staticArticleToCard(featuredStory.slug, featuredStory.pattern);
}

export function getStaticTrendingFallback(): PublicArticleCard[] {
  return trendingStories
    .map((story) => staticArticleToCard(story.slug, story.pattern))
    .filter((story): story is PublicArticleCard => story !== null);
}

export function getStaticLatestFallback(): PublicArticleCard[] {
  return latestStories
    .map((story) => staticArticleToCard(story.slug))
    .filter((story): story is PublicArticleCard => story !== null);
}

export function getStaticNewsFallback(): PublicArticleCard[] {
  return newsArticles
    .map((article) => staticArticleToCard(article.slug, article.pattern))
    .filter((article): article is PublicArticleCard => article !== null);
}

export function getStaticThreatResearchFallback(): PublicArticleCard[] {
  return threatResearch
    .map((item) => staticArticleToCard(item.slug))
    .filter((article): article is PublicArticleCard => article !== null);
}

export function mergeArticlesWithFallback(
  primary: PublicArticleCard[],
  fallback: PublicArticleCard[],
  limit: number,
  usedSlugs: Set<string> = new Set(),
): PublicArticleCard[] {
  const merged: PublicArticleCard[] = [];

  for (const article of primary) {
    if (merged.length >= limit) {
      break;
    }
    if (usedSlugs.has(article.slug)) {
      continue;
    }
    merged.push(article);
    usedSlugs.add(article.slug);
  }

  for (const article of fallback) {
    if (merged.length >= limit) {
      break;
    }
    if (usedSlugs.has(article.slug)) {
      continue;
    }
    merged.push(article);
    usedSlugs.add(article.slug);
  }

  return merged;
}
