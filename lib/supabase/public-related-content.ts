import { articlePath, type ArticlePattern } from "@/lib/articles";
import type { SearchContentType } from "@/lib/search";
import { getPublishedArticles } from "@/lib/supabase/public-articles";
import { getPublishedLabs, labPath } from "@/lib/supabase/public-labs";
import {
  getPublishedTutorials,
  tutorialPath,
} from "@/lib/supabase/public-tutorials";

export interface RelatedContentItem {
  id: string;
  type: SearchContentType;
  slug: string;
  title: string;
  description: string;
  category: string;
  featured_image: string | null;
  pattern?: ArticlePattern | null;
  href: string;
  publishedAtIso: string | null;
  publishedAtFormatted?: string;
}

export interface RelatedContentRequest {
  type: SearchContentType;
  slug: string;
  category: string;
  limit?: number;
}

const TYPE_PREFERENCE: Record<SearchContentType, SearchContentType[]> = {
  article: ["article", "lab", "tutorial"],
  lab: ["lab", "tutorial", "article"],
  tutorial: ["tutorial", "lab", "article"],
};

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase();
}

function getPublishedTimestamp(item: RelatedContentItem): number {
  if (!item.publishedAtIso) {
    return 0;
  }

  const timestamp = Date.parse(item.publishedAtIso);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getRelatedScore(
  item: RelatedContentItem,
  current: Pick<RelatedContentRequest, "type" | "category">,
): number {
  const sameCategory =
    normalizeCategory(item.category) === normalizeCategory(current.category);
  const sameType = item.type === current.type;

  if (sameType && sameCategory) {
    return 0;
  }

  if (sameType) {
    return 1;
  }

  if (sameCategory) {
    return 2;
  }

  return 3;
}

function rankRelatedItems(
  items: RelatedContentItem[],
  current: RelatedContentRequest,
): RelatedContentItem[] {
  const limit = current.limit ?? 3;
  const typePreference = TYPE_PREFERENCE[current.type];

  return items
    .filter(
      (item) => !(item.type === current.type && item.slug === current.slug),
    )
    .map((item) => ({
      item,
      score: getRelatedScore(item, current),
      publishedAt: getPublishedTimestamp(item),
      typeRank: typePreference.indexOf(item.type),
    }))
    .sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }

      if (a.publishedAt !== b.publishedAt) {
        return b.publishedAt - a.publishedAt;
      }

      return a.typeRank - b.typeRank;
    })
    .map((entry) => entry.item)
    .slice(0, limit);
}

export async function getRelatedContent(
  request: RelatedContentRequest,
): Promise<RelatedContentItem[]> {
  const [articles, labs, tutorials] = await Promise.all([
    getPublishedArticles(),
    getPublishedLabs(),
    getPublishedTutorials(),
  ]);

  const candidates: RelatedContentItem[] = [
    ...articles.map((article) => ({
      id: article.id,
      type: "article" as const,
      slug: article.slug,
      title: article.title,
      description: article.excerpt,
      category: article.category,
      featured_image: article.featured_image,
      pattern: article.pattern,
      href: articlePath(article.slug),
      publishedAtIso: article.publishedAtIso,
      publishedAtFormatted: article.publishedAtFormatted,
    })),
    ...labs.map((lab) => ({
      id: lab.slug,
      type: "lab" as const,
      slug: lab.slug,
      title: lab.title,
      description: lab.description,
      category: lab.category,
      featured_image: lab.featured_image,
      pattern: "circuit" as const,
      href: labPath(lab.slug),
      publishedAtIso: lab.published_at,
      publishedAtFormatted: lab.publishedAtFormatted,
    })),
    ...tutorials.map((tutorial) => ({
      id: tutorial.slug,
      type: "tutorial" as const,
      slug: tutorial.slug,
      title: tutorial.title,
      description: tutorial.description,
      category: tutorial.category,
      featured_image: tutorial.featured_image,
      pattern: "grid" as const,
      href: tutorialPath(tutorial.slug),
      publishedAtIso: tutorial.published_at,
      publishedAtFormatted: tutorial.publishedAtFormatted,
    })),
  ];

  return rankRelatedItems(candidates, request);
}
