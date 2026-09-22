import { bookmarkContentHref } from "../bookmarks/core.ts";
import type { BookmarkContentType } from "../bookmarks/types.ts";
import { isPublishedAtPubliclyAvailable } from "../articles/publishing.ts";
import type { CompletedLearningItem, ContinueLearningItem } from "../learning/types.ts";
import type {
  DashboardSavedItem,
  DashboardStats,
  LearnerDashboardHeader,
} from "./types";
import type { Profile } from "../supabase/types.ts";

export type SavedContentEmbed = {
  title: string | null;
  slug: string | null;
  category?: string | null;
  difficulty?: string | null;
  status?: string | null;
  published_at?: string | null;
};

export type DashboardSavedRow = {
  id: string;
  created_at: string;
  article_id: string | null;
  tutorial_id: string | null;
  lab_id: string | null;
  articles?: SavedContentEmbed | SavedContentEmbed[] | null;
  tutorials?: SavedContentEmbed | SavedContentEmbed[] | null;
  labs?: SavedContentEmbed | SavedContentEmbed[] | null;
};

function embed(value: SavedContentEmbed | SavedContentEmbed[] | null | undefined) {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function isPublishedEmbed(
  record: SavedContentEmbed | null,
): record is SavedContentEmbed {
  if (!record || record.status !== "published") {
    return false;
  }
  return isPublishedAtPubliclyAvailable(record.published_at ?? null);
}

export function resolveDashboardSavedItem(
  row: DashboardSavedRow,
): DashboardSavedItem | null {
  const exclusiveCount =
    Number(row.article_id != null) +
    Number(row.tutorial_id != null) +
    Number(row.lab_id != null);

  if (exclusiveCount !== 1) {
    return null;
  }

  if (row.article_id) {
    const content = embed(row.articles);
    if (!isPublishedEmbed(content)) {
      return null;
    }
    const slug = content.slug?.trim() ?? "";
    const title = content.title?.trim() ?? "";
    if (!slug || !title) {
      return null;
    }
    return {
      id: row.id,
      createdAt: row.created_at,
      contentType: "article",
      contentId: row.article_id,
      title,
      slug,
      href: bookmarkContentHref("article", slug),
      category: content.category?.trim() || null,
      difficulty: null,
    };
  }

  if (row.tutorial_id) {
    const content = embed(row.tutorials);
    if (!isPublishedEmbed(content)) {
      return null;
    }
    const slug = content.slug?.trim() ?? "";
    const title = content.title?.trim() ?? "";
    if (!slug || !title) {
      return null;
    }
    return {
      id: row.id,
      createdAt: row.created_at,
      contentType: "tutorial",
      contentId: row.tutorial_id,
      title,
      slug,
      href: bookmarkContentHref("tutorial", slug),
      category: content.category?.trim() || null,
      difficulty: content.difficulty?.trim() || null,
    };
  }

  if (row.lab_id) {
    const content = embed(row.labs);
    if (!isPublishedEmbed(content)) {
      return null;
    }
    const slug = content.slug?.trim() ?? "";
    const title = content.title?.trim() ?? "";
    if (!slug || !title) {
      return null;
    }
    return {
      id: row.id,
      createdAt: row.created_at,
      contentType: "lab",
      contentId: row.lab_id,
      title,
      slug,
      href: bookmarkContentHref("lab", slug),
      category: content.category?.trim() || null,
      difficulty: content.difficulty?.trim() || null,
    };
  }

  return null;
}

export function selectDashboardSavedItems(
  rows: DashboardSavedRow[],
): DashboardSavedItem[] {
  return rows
    .map((row) => resolveDashboardSavedItem(row))
    .filter((item): item is DashboardSavedItem => item !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function takeDashboardPreview<T>(items: T[], limit: number): T[] {
  return items.slice(0, Math.max(0, limit));
}

export function buildDashboardStats(input: {
  savedCount: number;
  inProgressCount: number;
  completedCount: number;
}): DashboardStats {
  return {
    savedCount: Math.max(0, input.savedCount),
    inProgressCount: Math.max(0, input.inProgressCount),
    completedCount: Math.max(0, input.completedCount),
  };
}

export function buildDashboardHeader(
  profile: Pick<Profile, "display_name" | "username" | "avatar_url">,
): LearnerDashboardHeader {
  const displayName = profile.display_name?.trim() || null;
  const username = profile.username?.trim() || null;
  const welcomeName = displayName || username || "Learner";

  return {
    displayName,
    username,
    avatarUrl: profile.avatar_url,
    welcomeName,
  };
}

export function contentTypeLabel(contentType: BookmarkContentType): string {
  if (contentType === "article") {
    return "Article";
  }
  if (contentType === "tutorial") {
    return "Tutorial";
  }
  return "Lab";
}

export function learningTypeLabel(
  contentType: ContinueLearningItem["contentType"] | CompletedLearningItem["contentType"],
): string {
  return contentType === "tutorial" ? "Tutorial" : "Lab";
}

export function isEmptyDashboard(input: {
  stats: DashboardStats;
  continueLearning: ContinueLearningItem[];
  completedLearning: CompletedLearningItem[];
  savedPreview: DashboardSavedItem[];
}): boolean {
  return (
    input.stats.savedCount === 0 &&
    input.stats.inProgressCount === 0 &&
    input.stats.completedCount === 0 &&
    input.continueLearning.length === 0 &&
    input.completedLearning.length === 0 &&
    input.savedPreview.length === 0
  );
}
