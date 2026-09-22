import type { BookmarkContentType } from "@/lib/bookmarks/types";
import type { CompletedLearningItem, ContinueLearningItem } from "@/lib/learning/types";
import type { Profile } from "@/lib/supabase/types";

export const DEFAULT_DASHBOARD_PREVIEW_LIMIT = 6;

export type DashboardSavedItem = {
  id: string;
  createdAt: string;
  contentType: BookmarkContentType;
  contentId: string;
  title: string;
  slug: string;
  href: string;
  category: string | null;
  difficulty: string | null;
};

export type DashboardStats = {
  savedCount: number;
  inProgressCount: number;
  completedCount: number;
};

export type LearnerDashboardHeader = {
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  welcomeName: string;
};

export type LearnerDashboardData = {
  header: LearnerDashboardHeader;
  stats: DashboardStats;
  continueLearning: ContinueLearningItem[];
  completedLearning: CompletedLearningItem[];
  savedPreview: DashboardSavedItem[];
  savedTotal: number;
  profile: Profile;
};
