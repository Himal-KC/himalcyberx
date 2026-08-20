import { cache } from "react";
import { articlePath } from "@/lib/articles";
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
import type { ArticlePattern } from "@/lib/articles";

export interface HomepageFeaturedItem {
  id: string;
  type: SearchContentType;
  slug: string;
  title: string;
  description: string;
  category: string;
  featured_image: string | null;
  pattern?: ArticlePattern | null;
  href: string;
  publishedAtFormatted?: string;
}

export interface HomepageDiscoveryData {
  featuredContent: HomepageFeaturedItem[];
  latestArticles: PublicArticleCard[];
  latestLabs: PublicLabCard[];
  latestTutorials: PublicTutorialCard[];
}

export const getHomepageContentCatalog = cache(async () => {
  const [articles, labs, tutorials] = await Promise.all([
    getPublishedArticles(),
    getPublishedLabs(),
    getPublishedTutorials(),
  ]);

  return { articles, labs, tutorials };
});

function mapFeaturedArticle(article: PublicArticleCard): HomepageFeaturedItem {
  return {
    id: article.id,
    type: "article",
    slug: article.slug,
    title: article.title,
    description: article.excerpt,
    category: article.category,
    featured_image: article.featured_image,
    pattern: article.pattern,
    href: articlePath(article.slug),
    publishedAtFormatted: article.publishedAtFormatted,
  };
}

function mapFeaturedLab(lab: PublicLabCard): HomepageFeaturedItem {
  return {
    id: lab.slug,
    type: "lab",
    slug: lab.slug,
    title: lab.title,
    description: lab.description,
    category: lab.category,
    featured_image: lab.featured_image,
    pattern: "circuit",
    href: labPath(lab.slug),
    publishedAtFormatted: lab.publishedAtFormatted || undefined,
  };
}

function mapFeaturedTutorial(
  tutorial: PublicTutorialCard,
): HomepageFeaturedItem {
  return {
    id: tutorial.slug,
    type: "tutorial",
    slug: tutorial.slug,
    title: tutorial.title,
    description: tutorial.description,
    category: tutorial.category,
    featured_image: tutorial.featured_image,
    pattern: "grid",
    href: tutorialPath(tutorial.slug),
    publishedAtFormatted: tutorial.publishedAtFormatted || undefined,
  };
}

function buildFeaturedContent(
  articles: PublicArticleCard[],
  labs: PublicLabCard[],
  tutorials: PublicTutorialCard[],
  limit = 3,
): HomepageFeaturedItem[] {
  const items: HomepageFeaturedItem[] = [];
  const usedKeys = new Set<string>();

  function add(item: HomepageFeaturedItem) {
    const key = `${item.type}-${item.slug}`;
    if (usedKeys.has(key) || items.length >= limit) {
      return;
    }

    usedKeys.add(key);
    items.push(item);
  }

  for (const article of articles.filter((entry) => entry.featured)) {
    add(mapFeaturedArticle(article));
  }

  for (const lab of labs.filter((entry) => entry.featured)) {
    add(mapFeaturedLab(lab));
  }

  for (const tutorial of tutorials.filter((entry) => entry.featured)) {
    add(mapFeaturedTutorial(tutorial));
  }

  return items;
}

export async function getHomepageDiscoveryData(): Promise<HomepageDiscoveryData> {
  const { articles, labs, tutorials } = await getHomepageContentCatalog();

  return {
    featuredContent: buildFeaturedContent(articles, labs, tutorials),
    latestArticles: articles.slice(0, 6),
    latestLabs: labs.slice(0, 3),
    latestTutorials: tutorials.slice(0, 3),
  };
}
