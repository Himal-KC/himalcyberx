import type {
  ContinueLearningItem,
  ContinueLearningRow,
  LearningContentColumn,
  LearningContentTable,
  LearningContentType,
  LearningProgressInsertPayload,
  LearningProgressOpError,
  LearningProgressRecord,
  LearningProgressStatus,
  LearningProgressTarget,
  LearningProgressUpdatePayload,
  LearningProgressView,
  ProgressCommand,
  ProgressMutationPlan,
  PublishedLearningContent,
} from "./types.ts";
import { LEARNING_CONTENT_TYPES } from "./types.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const DEFAULT_CONTINUE_LEARNING_LIMIT = 12;
export const MAX_CONTINUE_LEARNING_LIMIT = 50;

export function isLearningContentType(
  value: unknown,
): value is LearningContentType {
  return (
    typeof value === "string" &&
    (LEARNING_CONTENT_TYPES as readonly string[]).includes(value)
  );
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Accepts only contentType + contentId. Extra fields such as user_id are ignored.
 */
export function parseLearningTarget(input: unknown): LearningProgressTarget | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  if (!isLearningContentType(record.contentType) || !isUuid(record.contentId)) {
    return null;
  }

  return {
    contentType: record.contentType,
    contentId: record.contentId,
  };
}

export function parseProgressPercent(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      return null;
    }
    return value;
  }

  if (typeof value === "string" && /^(?:0|[1-9]\d?|100)$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }

  return null;
}

export function parseContinueLearningLimit(value: unknown): number {
  if (value === undefined || value === null) {
    return DEFAULT_CONTINUE_LEARNING_LIMIT;
  }

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_CONTINUE_LEARNING_LIMIT;
  }

  return Math.min(parsed, MAX_CONTINUE_LEARNING_LIMIT);
}

export function contentColumnForType(
  contentType: LearningContentType,
): LearningContentColumn {
  return contentType === "tutorial" ? "tutorial_id" : "lab_id";
}

export function contentTableForType(
  contentType: LearningContentType,
): LearningContentTable {
  return contentType === "tutorial" ? "tutorials" : "labs";
}

export function buildLearningProgressInsertKeys(
  contentType: LearningContentType,
  contentId: string,
): Pick<LearningProgressInsertPayload, "tutorial_id" | "lab_id"> {
  return {
    tutorial_id: contentType === "tutorial" ? contentId : null,
    lab_id: contentType === "lab" ? contentId : null,
  };
}

export function learningContentHref(
  contentType: LearningContentType,
  slug: string,
): string {
  return contentType === "tutorial" ? `/tutorials/${slug}` : `/cyber-lab/${slug}`;
}

export function notStartedView(
  target: LearningProgressTarget,
): LearningProgressView {
  return {
    contentType: target.contentType,
    contentId: target.contentId,
    status: "not_started",
    progressPercent: 0,
    startedAt: null,
    lastActivityAt: null,
    completedAt: null,
  };
}

export function viewFromRecord(
  record: LearningProgressRecord,
  target: LearningProgressTarget,
): LearningProgressView {
  return {
    contentType: target.contentType,
    contentId: target.contentId,
    status: record.status,
    progressPercent: record.progress_percent,
    startedAt: record.started_at,
    lastActivityAt: record.last_activity_at,
    completedAt: record.completed_at,
  };
}

export function isPublishedLearningContent(
  row: { status?: string | null; published_at?: string | null } | null,
  now: Date = new Date(),
): boolean {
  if (!row || row.status !== "published") {
    return false;
  }

  if (!row.published_at) {
    return true;
  }

  return new Date(row.published_at).getTime() <= now.getTime();
}

function insertPlan(
  keys: Pick<LearningProgressInsertPayload, "tutorial_id" | "lab_id">,
  status: Exclude<LearningProgressStatus, "not_started">,
  progressPercent: number,
  nowIso: string,
  completedAt: string | null,
): Extract<ProgressMutationPlan, { action: "insert" }> {
  return {
    action: "insert",
    payload: {
      ...keys,
      status,
      progress_percent: progressPercent,
      started_at: nowIso,
      last_activity_at: nowIso,
      completed_at: completedAt,
    },
  };
}

export function planProgressMutation(input: {
  current: LearningProgressRecord | null;
  command: ProgressCommand;
  nowIso: string;
  target: LearningProgressTarget;
}): ProgressMutationPlan {
  const keys = buildLearningProgressInsertKeys(
    input.target.contentType,
    input.target.contentId,
  );
  const current = input.current;

  if (input.command.type === "start") {
    if (!current || current.status === "not_started") {
      return insertPlan(keys, "in_progress", 0, input.nowIso, null);
    }
    return { action: "none", record: current };
  }

  if (input.command.type === "update") {
    const percent = input.command.progressPercent;

    if (current?.status === "completed") {
      if (percent === 100) {
        return { action: "none", record: current };
      }
      return { action: "reject", error: "invalid_transition" };
    }

    if (!current || current.status === "not_started") {
      return insertPlan(keys, "in_progress", percent, input.nowIso, null);
    }

    const patch: LearningProgressUpdatePayload = {
      progress_percent: percent,
      last_activity_at: input.nowIso,
    };

    return { action: "update", id: current.id, patch };
  }

  if (current?.status === "completed") {
    return { action: "none", record: current };
  }

  if (!current || current.status === "not_started") {
    return insertPlan(keys, "completed", 100, input.nowIso, input.nowIso);
  }

  return {
    action: "update",
    id: current.id,
    patch: {
      status: "completed",
      progress_percent: 100,
      last_activity_at: input.nowIso,
      completed_at: input.nowIso,
    },
  };
}

function embedRecord(
  value: PublishedLearningContent | PublishedLearningContent[] | null | undefined,
): PublishedLearningContent | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function resolveContinueLearningItem(
  row: ContinueLearningRow,
  now: Date = new Date(),
): ContinueLearningItem | null {
  if (row.status !== "in_progress") {
    return null;
  }

  const exclusiveCount =
    Number(row.tutorial_id != null) + Number(row.lab_id != null);
  if (exclusiveCount !== 1) {
    return null;
  }

  if (row.tutorial_id) {
    const content = embedRecord(row.tutorials);
    if (!content || !isPublishedLearningContent(content, now)) {
      return null;
    }
    const slug = content.slug.trim();
    if (!slug) {
      return null;
    }
    return {
      progressId: row.id,
      contentType: "tutorial",
      contentId: row.tutorial_id,
      status: "in_progress",
      progressPercent: row.progress_percent,
      startedAt: row.started_at,
      lastActivityAt: row.last_activity_at,
      title: content.title,
      slug,
      href: learningContentHref("tutorial", slug),
      featuredImage: content.featured_image,
      estimatedTime: content.estimated_time,
      difficulty: content.difficulty,
      category: content.category,
    };
  }

  if (row.lab_id) {
    const content = embedRecord(row.labs);
    if (!content || !isPublishedLearningContent(content, now)) {
      return null;
    }
    const slug = content.slug.trim();
    if (!slug) {
      return null;
    }
    return {
      progressId: row.id,
      contentType: "lab",
      contentId: row.lab_id,
      status: "in_progress",
      progressPercent: row.progress_percent,
      startedAt: row.started_at,
      lastActivityAt: row.last_activity_at,
      title: content.title,
      slug,
      href: learningContentHref("lab", slug),
      featuredImage: content.featured_image,
      estimatedTime: content.estimated_time,
      difficulty: content.difficulty,
      category: content.category,
    };
  }

  return null;
}

export function selectContinueLearningItems(
  rows: ContinueLearningRow[],
  now: Date = new Date(),
): ContinueLearningItem[] {
  return rows
    .map((row) => resolveContinueLearningItem(row, now))
    .filter((item): item is ContinueLearningItem => item !== null)
    .sort((a, b) => {
      const delta =
        new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
      return delta;
    });
}

export function isUniqueViolation(error: {
  code?: string;
  message?: string;
}): boolean {
  return error.code === "23505";
}

export function isForeignKeyViolation(error: {
  code?: string;
  message?: string;
}): boolean {
  return error.code === "23503";
}

export function isCheckOrPublishedViolation(error: {
  code?: string;
  message?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "23514" ||
    message.includes("learning_progress_unpublished_or_missing") ||
    message.includes("learning_progress_one_target") ||
    message.includes("learning_progress_percent_check") ||
    message.includes("learning_progress_completed_consistency") ||
    message.includes("learning_progress_identity_immutable")
  );
}

export function isRlsDenied(error: { code?: string; message?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied")
  );
}

export function mapWriteError(error: {
  code?: string;
  message?: string;
}): LearningProgressOpError {
  if (isForeignKeyViolation(error) || isCheckOrPublishedViolation(error)) {
    return "invalid_content";
  }
  if (isRlsDenied(error)) {
    return "forbidden";
  }
  return "unavailable";
}
