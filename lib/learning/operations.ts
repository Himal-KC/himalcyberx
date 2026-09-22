import "server-only";

import { getLearnerServerClient } from "@/lib/auth/session";
import {
  getContinueLearningItems as getContinueLearningItemsWithStore,
  getCompletedLearningItems as getCompletedLearningItemsWithStore,
  getLearningProgress as getLearningProgressWithStore,
  getLearningProgressStatusCounts as getLearningProgressStatusCountsWithStore,
  getLearningProgressUiState as getLearningProgressUiStateWithStore,
  markLearningCompleted as markLearningCompletedWithStore,
  startLearning as startLearningWithStore,
  updateLearningProgress as updateLearningProgressWithStore,
  type LearningProgressStore,
} from "@/lib/learning/operations-core";
import type {
  CompletedLearningItem,
  ContinueLearningItem,
  ContinueLearningRow,
  LearningContentColumn,
  LearningContentTable,
  LearningProgressInsertPayload,
  LearningProgressOpResult,
  LearningProgressRecord,
  LearningProgressUiState,
  LearningProgressUpdatePayload,
  LearningProgressView,
  PublishedLearningContent,
} from "@/lib/learning/types";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type LearnerClient = Extract<
  Awaited<ReturnType<typeof getLearnerServerClient>>,
  { ok: true }
>["supabase"];

const CONTENT_FIELDS =
  "id, slug, title, status, published_at, featured_image, estimated_time, difficulty, category";

const PROGRESS_FIELDS =
  "id, user_id, tutorial_id, lab_id, status, progress_percent, started_at, last_activity_at, completed_at, created_at, updated_at";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function mapPublishedContent(value: unknown): PublishedLearningContent | null {
  const row = Array.isArray(value) ? asRecord(value[0]) : asRecord(value);
  if (
    !row ||
    typeof row.id !== "string" ||
    typeof row.slug !== "string" ||
    row.status !== "published"
  ) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    title: typeof row.title === "string" ? row.title : "",
    status: "published",
    published_at: asNullableString(row.published_at),
    featured_image: asNullableString(row.featured_image),
    estimated_time: asNullableString(row.estimated_time),
    difficulty: asNullableString(row.difficulty),
    category: asNullableString(row.category),
  };
}

function mapProgressRecord(value: unknown): LearningProgressRecord | null {
  const row = asRecord(value);
  if (!row || typeof row.id !== "string" || typeof row.user_id !== "string") {
    return null;
  }

  const status = row.status;
  if (
    status !== "not_started" &&
    status !== "in_progress" &&
    status !== "completed"
  ) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    tutorial_id: asNullableString(row.tutorial_id),
    lab_id: asNullableString(row.lab_id),
    status,
    progress_percent:
      typeof row.progress_percent === "number" ? row.progress_percent : 0,
    started_at: typeof row.started_at === "string" ? row.started_at : "",
    last_activity_at:
      typeof row.last_activity_at === "string" ? row.last_activity_at : "",
    completed_at: asNullableString(row.completed_at),
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

function mapContinueLearningRow(value: unknown): ContinueLearningRow | null {
  const record = mapProgressRecord(value);
  if (!record) {
    return null;
  }

  const row = asRecord(value);
  return {
    ...record,
    tutorials: mapPublishedContent(row?.tutorials),
    labs: mapPublishedContent(row?.labs),
  };
}

function createSessionStore(
  supabase: LearnerClient,
  userId: string,
): LearningProgressStore {
  return {
    now: () => new Date(),
    getSessionUser: async () => ({ id: userId }),
    findPublishedContent: async (table: LearningContentTable, id: string) => {
      const { data, error } = await supabase
        .from(table)
        .select(CONTENT_FIELDS)
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();

      return {
        data: mapPublishedContent(data),
        error: error ? { code: error.code, message: error.message } : null,
      };
    },
    findOwnProgress: async (
      column: LearningContentColumn,
      contentId: string,
      ownerId: string,
    ) => {
      const { data, error } = await supabase
        .from("learning_progress")
        .select(PROGRESS_FIELDS)
        .eq(column, contentId)
        .eq("user_id", ownerId)
        .maybeSingle();

      return {
        data: mapProgressRecord(data),
        error: error ? { code: error.code, message: error.message } : null,
      };
    },
    insertProgress: async (payload: LearningProgressInsertPayload) => {
      const { data, error } = await supabase
        .from("learning_progress")
        .insert(payload)
        .select(PROGRESS_FIELDS)
        .maybeSingle();

      return {
        data: mapProgressRecord(data),
        error: error ? { code: error.code, message: error.message } : null,
      };
    },
    updateProgress: async (
      id: string,
      ownerId: string,
      patch: LearningProgressUpdatePayload,
    ) => {
      const { data, error } = await supabase
        .from("learning_progress")
        .update(patch)
        .eq("id", id)
        .eq("user_id", ownerId)
        .select(PROGRESS_FIELDS)
        .maybeSingle();

      return {
        data: mapProgressRecord(data),
        error: error ? { code: error.code, message: error.message } : null,
      };
    },
    listOwnInProgressWithContent: async (ownerId: string, limit: number) => {
      const { data, error } = await supabase
        .from("learning_progress")
        .select(
          `${PROGRESS_FIELDS}, tutorials(${CONTENT_FIELDS}), labs(${CONTENT_FIELDS})`,
        )
        .eq("user_id", ownerId)
        .eq("status", "in_progress")
        .order("last_activity_at", { ascending: false })
        .limit(limit);

      return {
        data: Array.isArray(data)
          ? data
              .map((row) => mapContinueLearningRow(row))
              .filter((row): row is ContinueLearningRow => row !== null)
          : [],
        error: error ? { code: error.code, message: error.message } : null,
      };
    },
    listOwnCompletedWithContent: async (ownerId: string, limit: number) => {
      const { data, error } = await supabase
        .from("learning_progress")
        .select(
          `${PROGRESS_FIELDS}, tutorials(${CONTENT_FIELDS}), labs(${CONTENT_FIELDS})`,
        )
        .eq("user_id", ownerId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(limit);

      return {
        data: Array.isArray(data)
          ? data
              .map((row) => mapContinueLearningRow(row))
              .filter((row): row is ContinueLearningRow => row !== null)
          : [],
        error: error ? { code: error.code, message: error.message } : null,
      };
    },
    countOwnProgressByStatus: async (
      ownerId: string,
      status: "in_progress" | "completed",
    ) => {
      const { count, error } = await supabase
        .from("learning_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ownerId)
        .eq("status", status);

      return {
        count: count ?? 0,
        error: error ? { code: error.code, message: error.message } : null,
      };
    },
  };
}

async function createAuthenticatedLearningStore(): Promise<
  | { ok: true; store: LearningProgressStore }
  | { ok: false; error: "unauthenticated" | "unavailable" }
> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "unavailable" };
  }

  const auth = await getLearnerServerClient();
  if (!auth.ok) {
    return { ok: false, error: "unauthenticated" };
  }

  return {
    ok: true,
    store: createSessionStore(auth.supabase, auth.user.id),
  };
}

export async function startLearning(
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  const store = await createAuthenticatedLearningStore();
  if (!store.ok) {
    return { ok: false, error: store.error };
  }
  return startLearningWithStore(store.store, input);
}

export async function updateLearningProgress(
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  const store = await createAuthenticatedLearningStore();
  if (!store.ok) {
    return { ok: false, error: store.error };
  }
  return updateLearningProgressWithStore(store.store, input);
}

export async function markLearningCompleted(
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  const store = await createAuthenticatedLearningStore();
  if (!store.ok) {
    return { ok: false, error: store.error };
  }
  return markLearningCompletedWithStore(store.store, input);
}

export async function getLearningProgress(
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  const store = await createAuthenticatedLearningStore();
  if (!store.ok) {
    return { ok: false, error: store.error };
  }
  return getLearningProgressWithStore(store.store, input);
}

export async function getContinueLearningItems(
  limit?: unknown,
): Promise<LearningProgressOpResult<ContinueLearningItem[]>> {
  const store = await createAuthenticatedLearningStore();
  if (!store.ok) {
    return { ok: false, error: store.error };
  }
  return getContinueLearningItemsWithStore(store.store, limit);
}

export async function getCompletedLearningItems(
  limit?: unknown,
): Promise<LearningProgressOpResult<CompletedLearningItem[]>> {
  const store = await createAuthenticatedLearningStore();
  if (!store.ok) {
    return { ok: false, error: store.error };
  }
  return getCompletedLearningItemsWithStore(store.store, limit);
}

export async function getLearningProgressStatusCounts(): Promise<
  LearningProgressOpResult<{ inProgress: number; completed: number }>
> {
  const store = await createAuthenticatedLearningStore();
  if (!store.ok) {
    return { ok: false, error: store.error };
  }
  return getLearningProgressStatusCountsWithStore(store.store);
}

export async function getLearningProgressUiState(
  input: unknown,
): Promise<LearningProgressUiState> {
  if (!hasSupabaseEnv()) {
    return { authenticated: false, progress: null };
  }

  const auth = await getLearnerServerClient();
  if (!auth.ok) {
    return { authenticated: false, progress: null };
  }

  return getLearningProgressUiStateWithStore(
    createSessionStore(auth.supabase, auth.user.id),
    input,
  );
}
