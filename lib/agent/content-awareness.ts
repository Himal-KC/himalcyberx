import { LAB_CATEGORIES } from "@/lib/labs/constants";
import { TUTORIAL_CATEGORIES } from "@/lib/tutorials/constants";
import { stripRichHtml } from "@/lib/content/html";
import type { AgentContentType } from "@/lib/supabase/types";
import type {
  ContentAwarenessResult,
  ContentDuplicateRisk,
  ContentSimilarityMatch,
  RecommendedCategory,
  SiteContentInventory,
} from "@/lib/agent/types";
import { recommendArticleCategory } from "./category/article-category-core";

export { recommendArticleCategory } from "./category/article-category-core";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "what",
  "when",
  "where",
  "why",
  "your",
  "this",
  "that",
  "about",
  "using",
  "use",
]);

export const DUPLICATE_RISK_HIGH_THRESHOLD = 80;
export const DUPLICATE_RISK_MEDIUM_THRESHOLD = 55;
export const SIMILAR_CONTENT_MIN_SCORE = 45;
export const RELATED_CONTENT_MIN_SCORE = 25;
export const RELATED_CONTENT_MAX_SCORE = 79;
export const MAX_DISPLAY_MATCHES = 5;

interface ScoredCandidate {
  contentType: AgentContentType;
  id: string;
  title: string;
  slug: string;
  similarityScore: number;
  reason: string;
  titleScore: number;
}

export function normalizeAwarenessText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeAwarenessText(value: string): string[] {
  const normalized = normalizeAwarenessText(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function uniqueTokens(values: string[]): Set<string> {
  return new Set(values);
}

export function jaccardTokenSimilarity(
  left: Set<string>,
  right: Set<string>,
): number {
  if (left.size === 0 && right.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  const union = left.size + right.size - intersection;
  if (union === 0) {
    return 0;
  }

  return intersection / union;
}

function sharedTokenSample(
  topicTokens: Set<string>,
  candidateTokens: Set<string>,
  limit = 4,
): string[] {
  const shared: string[] = [];
  for (const token of topicTokens) {
    if (candidateTokens.has(token)) {
      shared.push(token);
      if (shared.length >= limit) {
        break;
      }
    }
  }

  return shared;
}

function buildMatchReason(
  topicTokens: Set<string>,
  candidateTokens: Set<string>,
  titleScore: number,
  contentType: AgentContentType,
): string {
  if (titleScore >= 95) {
    return "Very similar title";
  }

  if (titleScore >= 80) {
    return "Closely matching title";
  }

  const shared = sharedTokenSample(topicTokens, candidateTokens);
  if (shared.length > 0) {
    return `Shares key terms: ${shared.join(", ")}`;
  }

  const label =
    contentType === "article"
      ? "article"
      : contentType === "tutorial"
        ? "tutorial"
        : "cyber lab";

  return `Related ${label} already covers this concept`;
}

function scoreTextPair(
  topicTokens: Set<string>,
  text: string,
): number {
  const candidateTokens = uniqueTokens(tokenizeAwarenessText(text));
  return Math.round(jaccardTokenSimilarity(topicTokens, candidateTokens) * 100);
}

function scoreAgainstTopic(
  topic: string,
  title: string,
  secondaryTexts: string[],
): { score: number; titleScore: number; reason: string; contentType: AgentContentType } {
  const normalizedTopic = normalizeAwarenessText(topic);
  const normalizedTitle = normalizeAwarenessText(title);
  const topicTokens = uniqueTokens(tokenizeAwarenessText(topic));

  let titleScore = 0;
  if (normalizedTopic && normalizedTitle) {
    if (normalizedTopic === normalizedTitle) {
      titleScore = 100;
    } else if (
      normalizedTitle.includes(normalizedTopic) ||
      normalizedTopic.includes(normalizedTitle)
    ) {
      titleScore = 92;
    } else {
      titleScore = scoreTextPair(topicTokens, title);
    }
  }

  let secondaryScore = 0;
  for (const text of secondaryTexts) {
    const plain = stripRichHtml(text);
    secondaryScore = Math.max(secondaryScore, scoreTextPair(topicTokens, plain));
  }

  const score = Math.min(
    100,
    Math.round(titleScore * 0.7 + secondaryScore * 0.3),
  );

  return {
    score,
    titleScore,
    reason: "",
    contentType: "article",
  };
}

function toMatch(
  candidate: ScoredCandidate,
): ContentSimilarityMatch {
  return {
    contentType: candidate.contentType,
    id: candidate.id,
    title: candidate.title,
    slug: candidate.slug,
    similarityScore: candidate.similarityScore,
    reason: candidate.reason,
  };
}

function scoreInventory(
  topic: string,
  inventory: SiteContentInventory,
): ScoredCandidate[] {
  const topicTokens = uniqueTokens(tokenizeAwarenessText(topic));
  const candidates: ScoredCandidate[] = [];

  for (const article of inventory.articles) {
    const scored = scoreAgainstTopic(topic, article.title, [
      article.excerpt,
      article.seoTitle ?? "",
      article.seoDescription ?? "",
      ...(article.seoKeywords ?? []),
    ]);
    candidates.push({
      contentType: "article",
      id: article.id,
      title: article.title,
      slug: article.slug,
      similarityScore: scored.score,
      titleScore: scored.titleScore,
      reason: buildMatchReason(topicTokens, uniqueTokens(tokenizeAwarenessText(article.title)), scored.titleScore, "article"),
    });
  }

  for (const tutorial of inventory.tutorials) {
    const scored = scoreAgainstTopic(topic, tutorial.title, [
      tutorial.description,
      tutorial.introduction ?? "",
      tutorial.requirements ?? "",
      tutorial.instructions ?? "",
      tutorial.keyTakeaways ?? "",
    ]);
    candidates.push({
      contentType: "tutorial",
      id: tutorial.id,
      title: tutorial.title,
      slug: tutorial.slug,
      similarityScore: scored.score,
      titleScore: scored.titleScore,
      reason: buildMatchReason(topicTokens, uniqueTokens(tokenizeAwarenessText(tutorial.title)), scored.titleScore, "tutorial"),
    });
  }

  for (const lab of inventory.labs) {
    const scored = scoreAgainstTopic(topic, lab.title, [
      lab.description,
      lab.introduction ?? "",
      lab.learningObjectives ?? "",
      lab.instructions ?? "",
      lab.expectedResult ?? "",
    ]);
    candidates.push({
      contentType: "lab",
      id: lab.id,
      title: lab.title,
      slug: lab.slug,
      similarityScore: scored.score,
      titleScore: scored.titleScore,
      reason: buildMatchReason(topicTokens, uniqueTokens(tokenizeAwarenessText(lab.title)), scored.titleScore, "lab"),
    });
  }

  return candidates.sort((a, b) => b.similarityScore - a.similarityScore);
}

export function resolveDuplicateRisk(
  maxScore: number,
): ContentDuplicateRisk {
  if (maxScore >= DUPLICATE_RISK_HIGH_THRESHOLD) {
    return "high";
  }

  if (maxScore >= DUPLICATE_RISK_MEDIUM_THRESHOLD) {
    return "medium";
  }

  return "low";
}

function pickSimilarContent(
  candidates: ScoredCandidate[],
): ContentSimilarityMatch[] {
  return candidates
    .filter((candidate) => candidate.similarityScore >= SIMILAR_CONTENT_MIN_SCORE)
    .slice(0, MAX_DISPLAY_MATCHES)
    .map(toMatch);
}

function pickRelatedContent(
  candidates: ScoredCandidate[],
  similar: ContentSimilarityMatch[],
): ContentSimilarityMatch[] {
  const similarIds = new Set(similar.map((item) => `${item.contentType}:${item.id}`));

  return candidates
    .filter((candidate) => {
      const key = `${candidate.contentType}:${candidate.id}`;
      if (similarIds.has(key)) {
        return false;
      }

      return (
        candidate.similarityScore >= RELATED_CONTENT_MIN_SCORE &&
        candidate.similarityScore <= RELATED_CONTENT_MAX_SCORE
      );
    })
    .slice(0, MAX_DISPLAY_MATCHES)
    .map(toMatch);
}

function scoreCategoryMatch(topic: string, categoryText: string): number {
  const topicTokens = uniqueTokens(tokenizeAwarenessText(topic));
  const categoryTokens = uniqueTokens(tokenizeAwarenessText(categoryText));
  return Math.round(jaccardTokenSimilarity(topicTokens, categoryTokens) * 100);
}


function collectTutorialCategoryOptions(
  inventory: SiteContentInventory,
): string[] {
  const fromInventory = inventory.tutorials
    .map((tutorial) => tutorial.category.trim())
    .filter(Boolean);
  return [...new Set([...TUTORIAL_CATEGORIES, ...fromInventory])];
}

function collectLabCategoryOptions(inventory: SiteContentInventory): string[] {
  const fromInventory = inventory.labs
    .map((lab) => lab.category.trim())
    .filter(Boolean);
  return [...new Set([...LAB_CATEGORIES, ...fromInventory])];
}

function recommendTextCategory(
  topic: string,
  options: string[],
): RecommendedCategory {
  let bestName = "";
  let bestScore = 0;

  for (const option of options) {
    const score = scoreCategoryMatch(topic, option);
    if (score > bestScore) {
      bestScore = score;
      bestName = option;
    }
  }

  if (bestScore < 15) {
    return { id: null, name: "" };
  }

  return { id: null, name: bestName };
}

function buildContentGapSummary(
  contentType: AgentContentType,
  similar: ContentSimilarityMatch[],
  related: ContentSimilarityMatch[],
): string {
  const typesPresent = new Set<AgentContentType>();
  for (const item of [...similar, ...related]) {
    typesPresent.add(item.contentType);
  }

  const hasArticle = typesPresent.has("article");
  const hasTutorial = typesPresent.has("tutorial");
  const hasLab = typesPresent.has("lab");

  if (similar.length === 0 && related.length === 0) {
    return "No closely matching content exists. This appears to be a new content opportunity.";
  }

  if (contentType === "article") {
    if (hasArticle && !hasTutorial && !hasLab) {
      return "A general article may already cover this area, but no dedicated tutorial or cyber lab currently covers this topic.";
    }
    if (!hasArticle && (hasTutorial || hasLab)) {
      return "Hands-on tutorial or lab content exists, but there is no article explaining this topic at a broader level.";
    }
  }

  if (contentType === "tutorial") {
    if (hasTutorial && !hasArticle && !hasLab) {
      return "A similar tutorial exists, but there is no broader article or guided lab covering this topic.";
    }
    if (!hasTutorial && hasArticle) {
      return "A related article exists, but no dedicated tutorial currently walks through this topic step by step.";
    }
    if (!hasTutorial && hasLab) {
      return "A related cyber lab exists, but no tutorial currently introduces this topic in a guided learning format.";
    }
  }

  if (contentType === "lab") {
    if (hasLab && !hasArticle && !hasTutorial) {
      return "A similar cyber lab exists, but there is no supporting article or tutorial for this topic.";
    }
    if (!hasLab && (hasArticle || hasTutorial)) {
      return "Related article or tutorial content exists, but no cyber lab currently provides hands-on practice for this topic.";
    }
  }

  if (hasArticle && hasTutorial && hasLab) {
    return "Similar content exists across articles, tutorials, and cyber labs. Consider a distinct angle or deeper specialization.";
  }

  return "Some related HimalCyberX content exists. Review similar items before creating a new piece.";
}

export function analyzeContentAwareness({
  contentType,
  topic,
  inventory,
}: {
  contentType: AgentContentType;
  topic: string;
  inventory: SiteContentInventory;
}): ContentAwarenessResult {
  const candidates = scoreInventory(topic, inventory);
  const maxScore = candidates[0]?.similarityScore ?? 0;
  const duplicateRisk = resolveDuplicateRisk(maxScore);
  const similarContent = pickSimilarContent(candidates);
  const relatedContent = pickRelatedContent(candidates, similarContent);

  const recommendedCategory =
    contentType === "article"
      ? recommendArticleCategory(topic, inventory.categories)
      : contentType === "tutorial"
        ? recommendTextCategory(topic, collectTutorialCategoryOptions(inventory))
        : recommendTextCategory(topic, collectLabCategoryOptions(inventory));

  const contentGapSummary = buildContentGapSummary(
    contentType,
    similarContent,
    relatedContent,
  );

  return {
    duplicateRisk,
    similarContent,
    relatedContent,
    recommendedCategory,
    contentGapSummary,
  };
}

export function isSafeToContinueAnalysis(
  duplicateRisk: ContentDuplicateRisk,
): boolean {
  return duplicateRisk !== "high";
}
