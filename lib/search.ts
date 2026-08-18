export type SearchContentType = "article" | "lab" | "tutorial";

export interface SearchResult {
  id: string;
  type: SearchContentType;
  title: string;
  description: string;
  category: string;
  difficulty?: string;
  publishedAt?: string | null;
  publishedAtFormatted?: string;
  href: string;
}

export interface GroupedSearchResults {
  articles: SearchResult[];
  labs: SearchResult[];
  tutorials: SearchResult[];
}

export const SEARCH_FILTERS = [
  "All",
  "Articles",
  "Cyber Labs",
  "Tutorials",
] as const;

export type SearchFilter = (typeof SEARCH_FILTERS)[number];

export const OVERLAY_SUGGESTED_SEARCHES = [
  "Ransomware",
  "Microsoft",
  "Nmap",
  "Wireshark",
  "Network",
  "Phishing",
] as const;

export const POPULAR_TOPICS = [
  { label: "Ransomware", query: "ransomware" },
  { label: "Microsoft", query: "microsoft" },
  { label: "Network Security", query: "network" },
  { label: "Phishing", query: "phishing" },
  { label: "Wireshark", query: "wireshark" },
  { label: "Nmap", query: "nmap" },
] as const;

export const LEARNING_SUGGESTIONS = [
  { label: "Nmap", query: "nmap" },
  { label: "Wireshark", query: "wireshark" },
  { label: "Ransomware", query: "ransomware" },
  { label: "Phishing", query: "phishing" },
] as const;

export function getSearchTypeLabel(type: SearchContentType): string {
  const labels: Record<SearchContentType, string> = {
    article: "ARTICLE",
    lab: "CYBER LAB",
    tutorial: "TUTORIAL",
  };
  return labels[type];
}

export function getTypeBadgeClass(type: SearchContentType): string {
  const styles: Record<SearchContentType, string> = {
    article: "border-hcx-cyan/30 bg-hcx-cyan/10 text-hcx-cyan",
    lab: "border-hcx-green/30 bg-hcx-green/10 text-hcx-green",
    tutorial: "border-hcx-yellow/30 bg-hcx-yellow/10 text-hcx-yellow",
  };
  return styles[type];
}

export function countSearchResults(results: GroupedSearchResults): number {
  return results.articles.length + results.labs.length + results.tutorials.length;
}

export function flattenSearchResults(
  results: GroupedSearchResults,
): SearchResult[] {
  return [...results.articles, ...results.labs, ...results.tutorials];
}

export function filterGroupedSearchResults(
  results: GroupedSearchResults,
  filter: SearchFilter,
): GroupedSearchResults {
  switch (filter) {
    case "Articles":
      return { articles: results.articles, labs: [], tutorials: [] };
    case "Cyber Labs":
      return { articles: [], labs: results.labs, tutorials: [] };
    case "Tutorials":
      return { articles: [], labs: [], tutorials: results.tutorials };
    default:
      return results;
  }
}

export function getGroupedSectionTitle(
  type: SearchContentType,
): string {
  const titles: Record<SearchContentType, string> = {
    article: "ARTICLES",
    lab: "CYBER LABS",
    tutorial: "TUTORIALS",
  };
  return titles[type];
}
