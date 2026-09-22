import "server-only";

import { getLearnerServerClient } from "@/lib/auth/session";
import {
  buildDashboardHeader,
  buildDashboardStats,
  selectDashboardSavedItems,
  takeDashboardPreview,
  type DashboardSavedRow,
} from "@/lib/dashboard/dashboard-core";
import {
  DEFAULT_DASHBOARD_PREVIEW_LIMIT,
  type DashboardSavedItem,
  type LearnerDashboardData,
} from "@/lib/dashboard/types";
import {
  getCompletedLearningItems,
  getContinueLearningItems,
  getLearningProgressStatusCounts,
} from "@/lib/learning/operations";
import { DEFAULT_CONTINUE_LEARNING_LIMIT } from "@/lib/learning/progress-core";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { getOwnProfile } from "@/lib/supabase/profiles";
import { sanitizeStoredAvatarUrl } from "@/lib/storage/avatars";

const SAVED_DASHBOARD_SELECT =
  "id, created_at, article_id, tutorial_id, lab_id, articles(title, slug, category, status, published_at), tutorials(title, slug, category, difficulty, status, published_at), labs(title, slug, category, difficulty, status, published_at)";

function mapDashboardSavedRow(row: Record<string, unknown>): DashboardSavedRow {
  return {
    id: String(row.id ?? ""),
    created_at: String(row.created_at ?? ""),
    article_id: typeof row.article_id === "string" ? row.article_id : null,
    tutorial_id: typeof row.tutorial_id === "string" ? row.tutorial_id : null,
    lab_id: typeof row.lab_id === "string" ? row.lab_id : null,
    articles: row.articles as DashboardSavedRow["articles"],
    tutorials: row.tutorials as DashboardSavedRow["tutorials"],
    labs: row.labs as DashboardSavedRow["labs"],
  };
}

async function fetchSavedRowsForUser(
  supabase: Extract<
    Awaited<ReturnType<typeof getLearnerServerClient>>,
    { ok: true }
  >["supabase"],
): Promise<DashboardSavedItem[]> {
  const { data, error } = await supabase
    .from("saved_content")
    .select(SAVED_DASHBOARD_SELECT)
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return selectDashboardSavedItems(
    data.map((row) => mapDashboardSavedRow(row as Record<string, unknown>)),
  );
}

export async function loadLearnerDashboard(options?: {
  previewLimit?: number;
  continueLimit?: number;
  completedLimit?: number;
}): Promise<LearnerDashboardData | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const auth = await getLearnerServerClient();
  if (!auth.ok) {
    return null;
  }

  const previewLimit = options?.previewLimit ?? DEFAULT_DASHBOARD_PREVIEW_LIMIT;
  const continueLimit = options?.continueLimit ?? DEFAULT_CONTINUE_LEARNING_LIMIT;
  const completedLimit = options?.completedLimit ?? DEFAULT_DASHBOARD_PREVIEW_LIMIT;

  const [
    profile,
    savedCountResult,
    allSaved,
    continueResult,
    completedResult,
    progressCountsResult,
  ] = await Promise.all([
    getOwnProfile(auth.supabase, auth.user.id),
    auth.supabase
      .from("saved_content")
      .select("id", { count: "exact", head: true }),
    fetchSavedRowsForUser(auth.supabase),
    getContinueLearningItems(continueLimit),
    getCompletedLearningItems(completedLimit),
    getLearningProgressStatusCounts(),
  ]);

  if (!profile) {
    return null;
  }

  const progressCounts = progressCountsResult.ok
    ? progressCountsResult.data
    : { inProgress: 0, completed: 0 };

  const safeAvatar =
    profile.avatar_url && hasSupabaseEnv()
      ? sanitizeStoredAvatarUrl(
          profile.avatar_url,
          getSupabaseEnv().url,
          auth.user.id,
        )
      : null;

  const header = buildDashboardHeader({
    ...profile,
    avatar_url: safeAvatar,
  });

  return {
    profile: { ...profile, avatar_url: safeAvatar },
    header,
    stats: buildDashboardStats({
      savedCount: savedCountResult.count ?? 0,
      inProgressCount: progressCounts.inProgress,
      completedCount: progressCounts.completed,
    }),
    continueLearning: continueResult.ok ? continueResult.data : [],
    completedLearning: completedResult.ok ? completedResult.data : [],
    savedPreview: takeDashboardPreview(allSaved, previewLimit),
    savedTotal: allSaved.length,
  };
}

export async function loadLearnerSavedContent(): Promise<DashboardSavedItem[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const auth = await getLearnerServerClient();
  if (!auth.ok) {
    return [];
  }

  return fetchSavedRowsForUser(auth.supabase);
}
