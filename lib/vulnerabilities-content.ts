import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import { getArticleCategoryKey } from "@/lib/news-list";

const VULNERABILITY_CATEGORY_SLUGS = new Set([
  "vulnerabilities",
  "vulnerability-watch",
  "vulnerability-research",
]);

const VULNERABILITY_CATEGORY_KEYWORDS = [
  "vulnerabilit",
  "cve",
  "patching",
  "patch management",
  "exposure",
  "remediation",
];

export const VULNERABILITY_RESOURCES = [
  {
    title: "CISA Known Exploited Vulnerabilities (KEV)",
    description:
      "Official catalog of vulnerabilities known to be actively exploited, maintained by the U.S. Cybersecurity and Infrastructure Security Agency.",
    href: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
  },
  {
    title: "NIST National Vulnerability Database (NVD)",
    description:
      "U.S. government repository of vulnerability management data, including CVE records and severity metadata.",
    href: "https://nvd.nist.gov/",
  },
] as const;

const RESEARCH_TOPIC_DEFINITIONS = [
  {
    title: "Critical Vulnerabilities",
    description:
      "Published analysis of high-impact disclosed vulnerabilities and defensive priorities.",
    categoryFilter: "vulnerabilities",
  },
  {
    title: "Exploited Vulnerabilities",
    description:
      "Research on actively exploited flaws, prioritisation signals and defensive response.",
    categoryFilter: "vulnerabilities",
    requiredCategoryKeywords: ["exploit", "kev", "exploited"],
  },
  {
    title: "Patch Management",
    description:
      "Research and guidance on prioritising patches and reducing exposure windows.",
    categoryFilter: "vulnerabilities",
    requiredCategoryKeywords: ["patch"],
  },
  {
    title: "Exposure & Remediation",
    description:
      "Coverage focused on exposure reduction, remediation workflows and defensive hardening.",
    categoryFilter: "vulnerabilities",
    requiredCategoryKeywords: ["exposure", "remediation"],
  },
] as const;

export function getVulnerabilityTopicHref(categoryFilter: string): string {
  return `/news?category=${encodeURIComponent(categoryFilter)}`;
}

export function isVulnerabilityCategoryArticle(
  article: PublicArticleCard,
): boolean {
  const slug = article.categorySlug?.toLowerCase() ?? "";
  if (slug && VULNERABILITY_CATEGORY_SLUGS.has(slug)) {
    return true;
  }

  if (article.categoryHref === "/vulnerabilities") {
    return true;
  }

  const category = article.category.toLowerCase();
  return VULNERABILITY_CATEGORY_KEYWORDS.some((keyword) =>
    category.includes(keyword),
  );
}

export function filterVulnerabilityArticles(
  articles: PublicArticleCard[],
): PublicArticleCard[] {
  return articles.filter(isVulnerabilityCategoryArticle);
}

export function getVulnerabilityAnalysisArticles(
  articles: PublicArticleCard[],
): PublicArticleCard[] {
  return filterVulnerabilityArticles(articles);
}

export interface VulnerabilityResearchTopic {
  title: string;
  description: string;
  href: string;
}

function categoryHasKeyword(category: string, keywords: string[]): boolean {
  const normalized = category.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function getVulnerabilityResearchTopics(
  articles: PublicArticleCard[],
): VulnerabilityResearchTopic[] {
  const vulnerabilityArticles = filterVulnerabilityArticles(articles);
  const availableCategoryKeys = new Set(
    vulnerabilityArticles.map((article) => getArticleCategoryKey(article)),
  );

  const topics: VulnerabilityResearchTopic[] = [];
  const usedHrefs = new Set<string>();

  for (const topic of RESEARCH_TOPIC_DEFINITIONS) {
    if (!availableCategoryKeys.has(topic.categoryFilter)) {
      continue;
    }

    if ("requiredCategoryKeywords" in topic && topic.requiredCategoryKeywords) {
      const hasMatchingCategory = vulnerabilityArticles.some((article) =>
        categoryHasKeyword(article.category, [...topic.requiredCategoryKeywords]),
      );

      if (!hasMatchingCategory) {
        continue;
      }
    }

    const href = getVulnerabilityTopicHref(topic.categoryFilter);
    if (usedHrefs.has(href) && topics.some((entry) => entry.title === topic.title)) {
      continue;
    }

    topics.push({
      title: topic.title,
      description: topic.description,
      href,
    });
    usedHrefs.add(href);
  }

  for (const article of vulnerabilityArticles) {
    const categoryKey = getArticleCategoryKey(article);
    const href = getVulnerabilityTopicHref(categoryKey);

    if (usedHrefs.has(href)) {
      continue;
    }

    topics.push({
      title: article.category,
      description: `Browse published HimalCyberX analysis in ${article.category}.`,
      href,
    });
    usedHrefs.add(href);
  }

  return topics;
}
