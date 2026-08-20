import { readQueryString } from "@/lib/admin/list-query";
import { articlePath, type ArticlePattern } from "@/lib/articles";
import { getLabCategoryKey } from "@/lib/cyber-lab-list";
import { getArticleCategoryKey } from "@/lib/news-list";
import type { SearchContentType } from "@/lib/search";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import type { PublicLabCard } from "@/lib/supabase/public-labs";
import { labPath } from "@/lib/supabase/public-labs";
import type { PublicTutorialCard } from "@/lib/supabase/public-tutorials";
import { tutorialPath } from "@/lib/supabase/public-tutorials";

const FORENSICS_CATEGORY_SLUGS = new Set([
  "forensics",
  "digital-forensics",
  "dfir",
  "incident-response",
]);

const FORENSICS_KEYWORDS = [
  "digital forensics",
  "forensics",
  "dfir",
  "incident response",
  "evidence",
  "disk analysis",
  "memory analysis",
  "log analysis",
];

export type ForensicsContentTypeFilter = "all" | SearchContentType;

export interface ForensicsContentItem {
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

export interface ForensicsTopic {
  title: string;
  description: string;
  href: string;
}

export interface ForensicsListFilters {
  type: ForensicsContentTypeFilter;
}

export interface ForensicsPageData {
  items: ForensicsContentItem[];
  filters: ForensicsListFilters;
  filtersActive: boolean;
  totalMatching: number;
  topics: ForensicsTopic[];
}

function matchesForensicsText(...values: Array<string | null | undefined>): boolean {
  const normalized = values
    .map((value) => (value ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");

  if (!normalized) {
    return false;
  }

  return FORENSICS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function isForensicsArticle(article: PublicArticleCard): boolean {
  const slug = article.categorySlug?.toLowerCase() ?? "";
  if (slug && FORENSICS_CATEGORY_SLUGS.has(slug)) {
    return true;
  }

  if (article.categoryHref === "/forensics") {
    return true;
  }

  return matchesForensicsText(
    article.category,
    article.title,
    article.excerpt,
  );
}

function isForensicsLab(lab: PublicLabCard): boolean {
  return matchesForensicsText(
    lab.category,
    lab.title,
    lab.description,
  );
}

function isForensicsTutorial(tutorial: PublicTutorialCard): boolean {
  return matchesForensicsText(
    tutorial.category,
    tutorial.title,
    tutorial.description,
  );
}

function mapForensicsArticle(article: PublicArticleCard): ForensicsContentItem {
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
    publishedAtIso: article.publishedAtIso,
    publishedAtFormatted: article.publishedAtFormatted,
  };
}

function mapForensicsLab(lab: PublicLabCard): ForensicsContentItem {
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
    publishedAtIso: lab.published_at,
    publishedAtFormatted: lab.publishedAtFormatted || undefined,
  };
}

function mapForensicsTutorial(
  tutorial: PublicTutorialCard,
): ForensicsContentItem {
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
    publishedAtIso: tutorial.published_at,
    publishedAtFormatted: tutorial.publishedAtFormatted || undefined,
  };
}

function getPublishedTimestamp(item: ForensicsContentItem): number {
  if (!item.publishedAtIso) {
    return 0;
  }

  const timestamp = Date.parse(item.publishedAtIso);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortByPublishedDesc(items: ForensicsContentItem[]): ForensicsContentItem[] {
  return [...items].sort(
    (left, right) => getPublishedTimestamp(right) - getPublishedTimestamp(left),
  );
}

export function buildForensicsContentList(
  articles: PublicArticleCard[],
  labs: PublicLabCard[],
  tutorials: PublicTutorialCard[],
  limit = 6,
): ForensicsContentItem[] {
  const forensicsLabs = sortByPublishedDesc(
    labs.filter(isForensicsLab).map(mapForensicsLab),
  );
  const forensicsTutorials = sortByPublishedDesc(
    tutorials.filter(isForensicsTutorial).map(mapForensicsTutorial),
  );
  const forensicsArticles = sortByPublishedDesc(
    articles.filter(isForensicsArticle).map(mapForensicsArticle),
  );

  const prioritized = [
    ...forensicsLabs,
    ...forensicsTutorials,
    ...forensicsArticles,
  ];

  return prioritized.slice(0, limit);
}

export function buildAllForensicsContent(
  articles: PublicArticleCard[],
  labs: PublicLabCard[],
  tutorials: PublicTutorialCard[],
): ForensicsContentItem[] {
  const forensicsLabs = sortByPublishedDesc(
    labs.filter(isForensicsLab).map(mapForensicsLab),
  );
  const forensicsTutorials = sortByPublishedDesc(
    tutorials.filter(isForensicsTutorial).map(mapForensicsTutorial),
  );
  const forensicsArticles = sortByPublishedDesc(
    articles.filter(isForensicsArticle).map(mapForensicsArticle),
  );

  return [...forensicsLabs, ...forensicsTutorials, ...forensicsArticles];
}

export function parseForensicsFilters(
  params: Record<string, string | string[] | undefined>,
): ForensicsListFilters {
  const type = readQueryString(params.type);

  return {
    type:
      type === "article" || type === "lab" || type === "tutorial"
        ? type
        : "all",
  };
}

export function forensicsFiltersAreActive(filters: ForensicsListFilters): boolean {
  return filters.type !== "all";
}

export function filterForensicsByType(
  items: ForensicsContentItem[],
  type: ForensicsContentTypeFilter,
): ForensicsContentItem[] {
  if (type === "all") {
    return items;
  }

  return items.filter((item) => item.type === type);
}

function hasForensicsLabInCategory(
  labs: PublicLabCard[],
  categoryKey: string,
): boolean {
  return labs.some(
    (lab) => isForensicsLab(lab) && getLabCategoryKey(lab) === categoryKey,
  );
}

export function getForensicsTopics(
  articles: PublicArticleCard[],
  labs: PublicLabCard[],
  tutorials: PublicTutorialCard[],
): ForensicsTopic[] {
  const topics: ForensicsTopic[] = [];
  const usedHrefs = new Set<string>();

  function addTopic(topic: ForensicsTopic) {
    if (usedHrefs.has(topic.href)) {
      return;
    }

    usedHrefs.add(topic.href);
    topics.push(topic);
  }

  if (hasForensicsLabInCategory(labs, "digital-forensics")) {
    addTopic({
      title: "Disk & File System Analysis",
      description:
        "Hands-on labs focused on disk imaging, file systems and artifact recovery.",
      href: "/cyber-lab?category=digital-forensics",
    });
  }

  if (hasForensicsLabInCategory(labs, "network-security")) {
    addTopic({
      title: "Network Forensics",
      description:
        "Investigate network traffic, packet analysis and defensive monitoring workflows.",
      href: "/cyber-lab?category=network-security",
    });
  }

  if (hasForensicsLabInCategory(labs, "soc-and-incident-response")) {
    addTopic({
      title: "Incident Response",
      description:
        "SOC and incident response exercises for detection, triage and containment.",
      href: "/cyber-lab?category=soc-and-incident-response",
    });
  }

  const forensicsArticles = articles.filter(isForensicsArticle);
  const articleCategorySlug = forensicsArticles[0]
    ? getArticleCategoryKey(forensicsArticles[0])
    : null;

  if (articleCategorySlug) {
    addTopic({
      title: "Evidence Handling",
      description:
        "Published guidance on lawful evidence collection, preservation and analysis.",
      href: `/news?category=${encodeURIComponent(articleCategorySlug)}`,
    });
  }

  const logAnalysisTutorial = tutorials.find(
    (tutorial) =>
      isForensicsTutorial(tutorial) &&
      matchesForensicsText(tutorial.title, tutorial.description, "log analysis"),
  );

  if (logAnalysisTutorial) {
    addTopic({
      title: "Log Analysis",
      description:
        "Tutorial coverage for investigative log review and defensive analysis.",
      href: tutorialPath(logAnalysisTutorial.slug),
    });
  } else if (hasForensicsLabInCategory(labs, "soc-and-incident-response")) {
    addTopic({
      title: "Log Analysis",
      description:
        "Investigate security logs as part of SOC and incident response workflows.",
      href: "/cyber-lab?category=soc-and-incident-response",
    });
  }

  return topics;
}

export function buildForensicsPageData(
  catalog: {
    articles: PublicArticleCard[];
    labs: PublicLabCard[];
    tutorials: PublicTutorialCard[];
  },
  params: Record<string, string | string[] | undefined>,
  limit = 6,
): ForensicsPageData {
  const filters = parseForensicsFilters(params);
  const allMatching = buildAllForensicsContent(
    catalog.articles,
    catalog.labs,
    catalog.tutorials,
  );
  const filtered = filterForensicsByType(allMatching, filters.type);

  return {
    items: filtered.slice(0, limit),
    filters,
    filtersActive: forensicsFiltersAreActive(filters),
    totalMatching: allMatching.length,
    topics: getForensicsTopics(catalog.articles, catalog.labs, catalog.tutorials),
  };
}
