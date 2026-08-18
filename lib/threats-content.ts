import {
  getStaticThreatResearchFallback,
  mergeArticlesWithFallback,
} from "@/lib/articles/static-fallback";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import {
  isThreatCategoryArticle,
} from "@/lib/supabase/public-articles";

export const THREAT_SECTION_DEFINITIONS = [
  {
    slug: "threat-intelligence",
    title: "Threat Intelligence",
    keywords: ["threat intelligence"],
  },
  {
    slug: "ransomware",
    title: "Ransomware",
    keywords: ["ransomware"],
  },
  {
    slug: "malware",
    title: "Malware",
    keywords: ["malware"],
  },
  {
    slug: "phishing",
    title: "Phishing",
    keywords: ["phishing"],
  },
  {
    slug: "threat-actor-research",
    title: "Threat Actor Research",
    keywords: ["threat actor", "apt"],
  },
] as const;

function matchesThreatSection(
  article: PublicArticleCard,
  section: (typeof THREAT_SECTION_DEFINITIONS)[number],
): boolean {
  const slug = article.categorySlug?.toLowerCase() ?? "";
  if (slug === section.slug) {
    return true;
  }

  const category = article.category.toLowerCase();
  return section.keywords.some((keyword) => category.includes(keyword));
}

export function filterThreatArticles(
  articles: PublicArticleCard[],
): PublicArticleCard[] {
  return articles.filter(isThreatCategoryArticle);
}

export function buildThreatResearchList(
  dbArticles: PublicArticleCard[],
  limit = 8,
): PublicArticleCard[] {
  const threatArticles = filterThreatArticles(dbArticles);
  return mergeArticlesWithFallback(
    threatArticles,
    getStaticThreatResearchFallback(),
    limit,
  );
}

export interface ThreatSectionArticles {
  slug: string;
  title: string;
  articles: PublicArticleCard[];
}

export function buildThreatSections(
  dbArticles: PublicArticleCard[],
  articlesPerSection = 2,
): ThreatSectionArticles[] {
  const threatArticles = filterThreatArticles(dbArticles);
  const staticFallback = getStaticThreatResearchFallback();

  return THREAT_SECTION_DEFINITIONS.map((section) => {
    const sectionDbArticles = threatArticles.filter((article) =>
      matchesThreatSection(article, section),
    );
    const sectionStaticFallback = staticFallback.filter((article) =>
      matchesThreatSection(article, section),
    );

    return {
      slug: section.slug,
      title: section.title,
      articles: mergeArticlesWithFallback(
        sectionDbArticles,
        sectionStaticFallback,
        articlesPerSection,
      ),
    };
  });
}
