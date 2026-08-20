import { readQueryString } from "@/lib/admin/list-query";
import { articlePath } from "@/lib/articles";
import { getLabCategoryKey } from "@/lib/cyber-lab-list";
import { getArticleCategoryKey } from "@/lib/news-list";
import type { SearchContentType } from "@/lib/search";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import type { PublicLabCard } from "@/lib/supabase/public-labs";
import { labPath } from "@/lib/supabase/public-labs";
import type { RelatedContentItem } from "@/lib/supabase/public-related-content";
import type { PublicTutorialCard } from "@/lib/supabase/public-tutorials";
import { tutorialPath } from "@/lib/supabase/public-tutorials";
import { getTutorialCategoryKey } from "@/lib/tutorial-list";

const AI_SECURITY_CATEGORY_SLUGS = new Set([
  "ai-security",
  "ai-security-research",
  "llm-security",
  "artificial-intelligence",
]);

const AI_SECURITY_KEYWORDS = [
  "ai security",
  "artificial intelligence",
  "llm security",
  "large language model",
  "prompt injection",
  "ai phishing",
  "ai-powered",
  "ai assisted",
  "ai-assisted",
  "deepfake",
  "ai governance",
  "machine learning security",
  "adversarial ai",
  "generative ai",
  "llm",
];

export type AISecurityContentTypeFilter = "all" | SearchContentType;

export interface AISecurityListFilters {
  type: AISecurityContentTypeFilter;
}

export interface AISecurityTopic {
  title: string;
  description: string;
  href: string | null;
}

export interface AISecurityPageData {
  items: RelatedContentItem[];
  filters: AISecurityListFilters;
  filtersActive: boolean;
  totalMatching: number;
  topics: AISecurityTopic[];
}

interface AISecurityTopicDefinition {
  title: string;
  description: string;
  keywords: string[];
  searchQuery: string;
}

const AI_SECURITY_TOPIC_DEFINITIONS: AISecurityTopicDefinition[] = [
  {
    title: "LLM Security",
    description:
      "Enterprise LLM risks, data leakage controls and secure deployment guidance.",
    keywords: ["llm", "large language model", "llm security"],
    searchQuery: "llm security",
  },
  {
    title: "Prompt Injection",
    description:
      "Input validation, output filtering and architectural defences for LLM-integrated applications.",
    keywords: ["prompt injection", "prompt-injection"],
    searchQuery: "prompt injection",
  },
  {
    title: "AI-Powered Social Engineering",
    description:
      "Research into AI-assisted phishing, impersonation and social engineering techniques.",
    keywords: [
      "social engineering",
      "ai phishing",
      "ai-powered",
      "generative ai",
      "impersonation",
    ],
    searchQuery: "ai social engineering",
  },
  {
    title: "Deepfake & Identity Risk",
    description:
      "Synthetic media risks, identity verification challenges and defensive awareness.",
    keywords: ["deepfake", "synthetic media", "identity risk", "identity verification"],
    searchQuery: "deepfake",
  },
  {
    title: "AI Governance",
    description:
      "Policy, risk assessment and oversight models for responsible AI adoption.",
    keywords: ["ai governance", "governance framework", "responsible ai"],
    searchQuery: "ai governance",
  },
  {
    title: "Defensive AI",
    description:
      "Responsible use of AI for detection, triage, investigation and security operations.",
    keywords: [
      "defensive ai",
      "ai-assisted",
      "ai augmented",
      "anomaly detection",
      "security operations",
    ],
    searchQuery: "defensive ai",
  },
];

function normalizeText(...values: Array<string | null | undefined>): string {
  return values
    .map((value) => (value ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
}

function matchesAISecurityKeywords(
  ...values: Array<string | null | undefined>
): boolean {
  const normalized = normalizeText(...values);

  if (!normalized) {
    return false;
  }

  return AI_SECURITY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function isAISecurityArticle(article: PublicArticleCard): boolean {
  const slug = article.categorySlug?.toLowerCase() ?? "";

  if (slug && AI_SECURITY_CATEGORY_SLUGS.has(slug)) {
    return true;
  }

  if (article.categoryHref === "/ai-security") {
    return true;
  }

  return matchesAISecurityKeywords(
    article.category,
    article.title,
    article.excerpt,
  );
}

function isAISecurityLab(lab: PublicLabCard): boolean {
  return matchesAISecurityKeywords(lab.category, lab.title, lab.description);
}

function isAISecurityTutorial(tutorial: PublicTutorialCard): boolean {
  return matchesAISecurityKeywords(
    tutorial.category,
    tutorial.title,
    tutorial.description,
  );
}

function matchesTopicKeywords(
  topic: AISecurityTopicDefinition,
  ...values: Array<string | null | undefined>
): boolean {
  const normalized = normalizeText(...values);

  if (!normalized) {
    return false;
  }

  return topic.keywords.some((keyword) => normalized.includes(keyword));
}

function mapAISecurityArticle(article: PublicArticleCard): RelatedContentItem {
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

function mapAISecurityLab(lab: PublicLabCard): RelatedContentItem {
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

function mapAISecurityTutorial(
  tutorial: PublicTutorialCard,
): RelatedContentItem {
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

function getPublishedTimestamp(item: RelatedContentItem): number {
  if (!item.publishedAtIso) {
    return 0;
  }

  const timestamp = Date.parse(item.publishedAtIso);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortByPublishedDesc(items: RelatedContentItem[]): RelatedContentItem[] {
  return [...items].sort(
    (left, right) => getPublishedTimestamp(right) - getPublishedTimestamp(left),
  );
}

export function buildAllAISecurityContent(
  articles: PublicArticleCard[],
  labs: PublicLabCard[],
  tutorials: PublicTutorialCard[],
): RelatedContentItem[] {
  const aiArticles = sortByPublishedDesc(
    articles.filter(isAISecurityArticle).map(mapAISecurityArticle),
  );
  const aiTutorials = sortByPublishedDesc(
    tutorials.filter(isAISecurityTutorial).map(mapAISecurityTutorial),
  );
  const aiLabs = sortByPublishedDesc(
    labs.filter(isAISecurityLab).map(mapAISecurityLab),
  );

  return [...aiArticles, ...aiTutorials, ...aiLabs];
}

export function parseAISecurityFilters(
  params: Record<string, string | string[] | undefined>,
): AISecurityListFilters {
  const type = readQueryString(params.type);

  return {
    type:
      type === "article" || type === "lab" || type === "tutorial"
        ? type
        : "all",
  };
}

export function aiSecurityFiltersAreActive(
  filters: AISecurityListFilters,
): boolean {
  return filters.type !== "all";
}

export function filterAISecurityByType(
  items: RelatedContentItem[],
  type: AISecurityContentTypeFilter,
): RelatedContentItem[] {
  if (type === "all") {
    return items;
  }

  return items.filter((item) => item.type === type);
}

function resolveTopicArticleHref(
  matches: PublicArticleCard[],
): string | null {
  if (matches.length === 0) {
    return null;
  }

  if (matches.length === 1) {
    return articlePath(matches[0].slug);
  }

  const categoryKey = getArticleCategoryKey(matches[0]);
  const sameCategory = matches.every(
    (article) => getArticleCategoryKey(article) === categoryKey,
  );

  if (sameCategory) {
    return `/news?category=${encodeURIComponent(categoryKey)}`;
  }

  return articlePath(matches[0].slug);
}

function resolveTopicTutorialHref(
  matches: PublicTutorialCard[],
  searchQuery: string,
): string | null {
  if (matches.length === 0) {
    return null;
  }

  if (matches.length === 1) {
    return tutorialPath(matches[0].slug);
  }

  return `/tutorials?q=${encodeURIComponent(searchQuery)}`;
}

function resolveTopicLabHref(
  matches: PublicLabCard[],
  searchQuery: string,
): string | null {
  if (matches.length === 0) {
    return null;
  }

  if (matches.length === 1) {
    return labPath(matches[0].slug);
  }

  const categoryKey = getLabCategoryKey(matches[0]);
  const sameCategory = matches.every(
    (lab) => getLabCategoryKey(lab) === categoryKey,
  );

  if (sameCategory) {
    return `/cyber-lab?category=${encodeURIComponent(categoryKey)}`;
  }

  return `/cyber-lab?q=${encodeURIComponent(searchQuery)}`;
}

function resolveTopicHref(
  topic: AISecurityTopicDefinition,
  articles: PublicArticleCard[],
  labs: PublicLabCard[],
  tutorials: PublicTutorialCard[],
): string | null {
  const articleMatches = articles
    .filter(isAISecurityArticle)
    .filter((article) =>
      matchesTopicKeywords(
        topic,
        article.title,
        article.excerpt,
        article.category,
      ),
    )
    .sort(
      (left, right) =>
        Date.parse(right.publishedAtIso ?? "") -
        Date.parse(left.publishedAtIso ?? ""),
    );

  const articleHref = resolveTopicArticleHref(articleMatches);
  if (articleHref) {
    return articleHref;
  }

  const tutorialMatches = tutorials
    .filter(isAISecurityTutorial)
    .filter((tutorial) =>
      matchesTopicKeywords(
        topic,
        tutorial.title,
        tutorial.description,
        tutorial.category,
      ),
    )
    .sort(
      (left, right) =>
        Date.parse(right.published_at ?? "") -
        Date.parse(left.published_at ?? ""),
    );

  const tutorialHref = resolveTopicTutorialHref(
    tutorialMatches,
    topic.searchQuery,
  );
  if (tutorialHref) {
    return tutorialHref;
  }

  const labMatches = labs
    .filter(isAISecurityLab)
    .filter((lab) =>
      matchesTopicKeywords(topic, lab.title, lab.description, lab.category),
    )
    .sort(
      (left, right) =>
        Date.parse(right.published_at ?? "") -
        Date.parse(left.published_at ?? ""),
    );

  const labHref = resolveTopicLabHref(labMatches, topic.searchQuery);
  if (labHref) {
    return labHref;
  }

  const aiSecurityArticles = articles.filter(isAISecurityArticle);
  if (
    aiSecurityArticles.length > 0 &&
    (topic.title === "LLM Security" || topic.title === "AI Governance")
  ) {
    const categoryKey = getArticleCategoryKey(aiSecurityArticles[0]);
    return `/news?category=${encodeURIComponent(categoryKey)}`;
  }

  const aiSecurityTutorials = tutorials.filter(isAISecurityTutorial);
  if (aiSecurityTutorials.length > 0 && topic.title === "Defensive AI") {
    if (aiSecurityTutorials.length === 1) {
      return tutorialPath(aiSecurityTutorials[0].slug);
    }

    const categoryKey = getTutorialCategoryKey(aiSecurityTutorials[0]);
    return `/tutorials?category=${encodeURIComponent(categoryKey)}`;
  }

  return null;
}

export function getAISecurityTopics(
  articles: PublicArticleCard[],
  labs: PublicLabCard[],
  tutorials: PublicTutorialCard[],
): AISecurityTopic[] {
  return AI_SECURITY_TOPIC_DEFINITIONS.map((topic) => ({
    title: topic.title,
    description: topic.description,
    href: resolveTopicHref(topic, articles, labs, tutorials),
  }));
}

export function buildAISecurityPageData(
  catalog: {
    articles: PublicArticleCard[];
    labs: PublicLabCard[];
    tutorials: PublicTutorialCard[];
  },
  params: Record<string, string | string[] | undefined>,
  limit = 6,
): AISecurityPageData {
  const filters = parseAISecurityFilters(params);
  const allMatching = buildAllAISecurityContent(
    catalog.articles,
    catalog.labs,
    catalog.tutorials,
  );
  const filtered = filterAISecurityByType(allMatching, filters.type);

  return {
    items: filtered.slice(0, limit),
    filters,
    filtersActive: aiSecurityFiltersAreActive(filters),
    totalMatching: allMatching.length,
    topics: getAISecurityTopics(
      catalog.articles,
      catalog.labs,
      catalog.tutorials,
    ),
  };
}
