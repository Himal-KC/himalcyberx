export const LEARNING_CONTENT_TYPES = ["tutorial", "lab"] as const;

export type LearningContentType = (typeof LEARNING_CONTENT_TYPES)[number];

export const LEARNING_PROGRESS_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
] as const;

export type LearningProgressStatus =
  (typeof LEARNING_PROGRESS_STATUSES)[number];

export type LearningProgressTarget = {
  contentType: LearningContentType;
  contentId: string;
};

export type LearningContentColumn = "tutorial_id" | "lab_id";

export type LearningContentTable = "tutorials" | "labs";

export type LearningProgressView = {
  contentType: LearningContentType;
  contentId: string;
  status: LearningProgressStatus;
  progressPercent: number;
  startedAt: string | null;
  lastActivityAt: string | null;
  completedAt: string | null;
};

export type LearningProgressRecord = {
  id: string;
  user_id: string;
  tutorial_id: string | null;
  lab_id: string | null;
  status: LearningProgressStatus;
  progress_percent: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LearningProgressInsertPayload = {
  tutorial_id: string | null;
  lab_id: string | null;
  status: Exclude<LearningProgressStatus, "not_started">;
  progress_percent: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
};

export type LearningProgressUpdatePayload = {
  status?: Exclude<LearningProgressStatus, "not_started">;
  progress_percent?: number;
  last_activity_at?: string;
  completed_at?: string | null;
  started_at?: string;
};

export type PublishedLearningContent = {
  id: string;
  slug: string;
  title: string;
  status: "published";
  published_at: string | null;
  featured_image: string | null;
  estimated_time: string | null;
  difficulty: string | null;
  category: string | null;
};

export type ContinueLearningItem = {
  progressId: string;
  contentType: LearningContentType;
  contentId: string;
  status: "in_progress";
  progressPercent: number;
  startedAt: string;
  lastActivityAt: string;
  title: string;
  slug: string;
  href: string;
  featuredImage: string | null;
  estimatedTime: string | null;
  difficulty: string | null;
  category: string | null;
};

export type ContinueLearningRow = LearningProgressRecord & {
  tutorials?: PublishedLearningContent | PublishedLearningContent[] | null;
  labs?: PublishedLearningContent | PublishedLearningContent[] | null;
};

export type LearningProgressOpError =
  | "unauthenticated"
  | "invalid_target"
  | "invalid_content"
  | "invalid_progress"
  | "invalid_transition"
  | "forbidden"
  | "unavailable";

export type LearningProgressOpResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: LearningProgressOpError };

export type LearningProgressUiState = {
  authenticated: boolean;
  progress: LearningProgressView | null;
};

export type ProgressCommand =
  | { type: "start" }
  | { type: "update"; progressPercent: number }
  | { type: "complete" };

export type ProgressMutationPlan =
  | { action: "none"; record: LearningProgressRecord }
  | { action: "insert"; payload: LearningProgressInsertPayload }
  | { action: "update"; id: string; patch: LearningProgressUpdatePayload }
  | { action: "reject"; error: Exclude<LearningProgressOpError, "unauthenticated"> };
