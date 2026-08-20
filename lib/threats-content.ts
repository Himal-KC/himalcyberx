import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import { isThreatCategoryArticle } from "@/lib/supabase/public-articles";

export const THREAT_TOPIC_CARDS = [
  {
    category: "Ransomware",
    title: "Ransomware Operations",
    description:
      "Analysis of ransomware campaigns, extortion tactics, infrastructure and defensive strategies.",
    label: "Threat Research",
    accent: "red" as const,
    icon: "ransomware" as const,
    categoryFilter: "ransomware",
  },
  {
    category: "Malware",
    title: "Malware Research",
    description:
      "Technical analysis of malicious software, delivery techniques and evolving malware families.",
    label: "Malware Analysis",
    accent: "cyan" as const,
    icon: "malware" as const,
    categoryFilter: "malware",
  },
  {
    category: "Phishing",
    title: "Phishing & Social Engineering",
    description:
      "Research into credential theft, impersonation, social engineering and modern phishing campaigns.",
    label: "Social Engineering",
    accent: "orange" as const,
    icon: "phishing" as const,
    categoryFilter: "phishing",
  },
  {
    category: "APT Groups",
    title: "Threat Actors / APT Groups",
    description:
      "Analysis of sophisticated threat actors, long-term campaigns and targeted cyber operations.",
    label: "Threat Actor Research",
    accent: "green" as const,
    icon: "apt" as const,
    categoryFilter: "threat-actor-research",
  },
] as const;

export function getThreatTopicHref(categoryFilter: string): string {
  return `/news?category=${encodeURIComponent(categoryFilter)}`;
}

export function filterThreatArticles(
  articles: PublicArticleCard[],
): PublicArticleCard[] {
  return articles.filter(isThreatCategoryArticle);
}

export function getThreatAnalysisArticles(
  articles: PublicArticleCard[],
): PublicArticleCard[] {
  return filterThreatArticles(articles);
}
