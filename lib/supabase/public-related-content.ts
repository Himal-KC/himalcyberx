import { articlePath, type ArticlePattern } from "@/lib/articles";
import type { SearchContentType } from "@/lib/search";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import { getPublishedArticles } from "@/lib/supabase/public-articles";
import type { PublicLabCard } from "@/lib/supabase/public-labs";
import { getPublishedLabs, labPath } from "@/lib/supabase/public-labs";
import type { PublicTutorialCard } from "@/lib/supabase/public-tutorials";
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

const DEFAULT_CATEGORY_BY_TYPE: Record<SearchContentType, string> = {
  article: "Cybersecurity News",
  lab: "Cyber Lab",
  tutorial: "Tutorial",
};

function normalizeCategory(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function resolveCategory(
  value: string | null | undefined,
  type: SearchContentType,
): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_CATEGORY_BY_TYPE[type];
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
    normalizeCategory(item.category) ===
    normalizeCategory(resolveCategory(current.category, current.type));
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
  const currentCategory = resolveCategory(current.category, current.type);

  return items
    .filter(
      (item) => !(item.type === current.type && item.slug === current.slug),
    )
    .map((item) => ({
      item,
      score: getRelatedScore(item, {
        type: current.type,
        category: currentCategory,
      }),
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

function mapArticleCandidate(
  article: PublicArticleCard,
): RelatedContentItem | null {
  const slug = article.slug?.trim();
  const title = article.title?.trim();

  if (!slug || !title) {
    return null;
  }

  return {
    id: article.id,
    type: "article",
    slug,
    title,
    description: article.excerpt?.trim() || "",
    category: resolveCategory(article.category, "article"),
    featured_image: article.featured_image,
    pattern: article.pattern,
    href: articlePath(slug),
    publishedAtIso: article.publishedAtIso ?? null,
    publishedAtFormatted: article.publishedAtFormatted || undefined,
  };
}

function mapLabCandidate(lab: PublicLabCard): RelatedContentItem | null {
  const slug = lab.slug?.trim();
  const title = lab.title?.trim();

  if (!slug || !title) {
    return null;
  }

  return {
    id: slug,
    type: "lab",
    slug,
    title,
    description: lab.description?.trim() || "",
    category: resolveCategory(lab.category, "lab"),
    featured_image: lab.featured_image,
    pattern: "circuit",
    href: labPath(slug),
    publishedAtIso: lab.published_at,
    publishedAtFormatted: lab.publishedAtFormatted || undefined,
  };
}

function mapTutorialCandidate(
  tutorial: PublicTutorialCard,
): RelatedContentItem | null {
  const slug = tutorial.slug?.trim();
  const title = tutorial.title?.trim();

  if (!slug || !title) {
    return null;
  }

  return {
    id: slug,
    type: "tutorial",
    slug,
    title,
    description: tutorial.description?.trim() || "",
    category: resolveCategory(tutorial.category, "tutorial"),
    featured_image: tutorial.featured_image,
    pattern: "grid",
    href: tutorialPath(slug),
    publishedAtIso: tutorial.published_at,
    publishedAtFormatted: tutorial.publishedAtFormatted || undefined,
  };
}

export async function getRelatedContent(
  request: RelatedContentRequest,
): Promise<RelatedContentItem[]> {
  try {
    const [articles, labs, tutorials] = await Promise.all([
      getPublishedArticles(),
      getPublishedLabs(),
      getPublishedTutorials(),
    ]);

    const candidates = [
      ...articles.map(mapArticleCandidate),
      ...labs.map(mapLabCandidate),
      ...tutorials.map(mapTutorialCandidate),
    ].filter((item): item is RelatedContentItem => item !== null);

    return rankRelatedItems(candidates, request);
  } catch {
    return [];
  }
}
