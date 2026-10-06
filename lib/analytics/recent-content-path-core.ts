import { articlePath } from "../articles.ts";

/** Keep aligned with `labPath` in lib/supabase/public-labs.ts */
function labPublicPath(slug: string): string {
  return `/cyber-lab/${slug}`;
}

/** Keep aligned with `tutorialPath` in lib/supabase/public-tutorials.ts */
function tutorialPublicPath(slug: string): string {
  return `/tutorials/${slug}`;
}

export type RecentContentType = "article" | "tutorial" | "lab";

export const RECENT_CONTENT_TYPE_LABELS: Record<RecentContentType, string> = {
  article: "Article",
  tutorial: "Tutorial",
  lab: "Lab",
};

export function normalizeAnalyticsPagePath(path: string): string {
  let normalized = path.trim();
  if (!normalized) {
    return "/";
  }

  const queryIndex = normalized.indexOf("?");
  if (queryIndex >= 0) {
    normalized = normalized.slice(0, queryIndex);
  }

  const hashIndex = normalized.indexOf("#");
  if (hashIndex >= 0) {
    normalized = normalized.slice(0, hashIndex);
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

export function isValidRecentContentSlug(slug: string): boolean {
  const trimmed = slug.trim();
  if (!trimmed || trimmed.includes("?") || trimmed.includes("#")) {
    return false;
  }

  if (trimmed.includes("..") || trimmed.startsWith("/")) {
    return false;
  }

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(trimmed);
}

export function buildRecentContentPublicPath(
  contentType: RecentContentType,
  slug: string,
): string | null {
  if (!isValidRecentContentSlug(slug)) {
    return null;
  }

  const normalizedSlug = slug.trim();

  switch (contentType) {
    case "article":
      return normalizeAnalyticsPagePath(articlePath(normalizedSlug));
    case "tutorial":
      return normalizeAnalyticsPagePath(tutorialPublicPath(normalizedSlug));
    case "lab":
      return normalizeAnalyticsPagePath(labPublicPath(normalizedSlug));
    default:
      return null;
  }
}

export function formatRecentContentPublishedRelative(
  publishedAtIso: string,
  now: Date = new Date(),
): string {
  const published = new Date(publishedAtIso);
  if (Number.isNaN(published.getTime())) {
    return "—";
  }

  const diffMs = now.getTime() - published.getTime();
  if (diffMs < 0) {
    return "Scheduled";
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / dayMs);
  if (days <= 0) {
    return "Today";
  }
  if (days === 1) {
    return "1 day ago";
  }
  return `${days} days ago`;
}
