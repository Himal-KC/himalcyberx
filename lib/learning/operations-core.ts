import {
  contentColumnForType,
  contentTableForType,
  isPublishedLearningContent,
  isRlsDenied,
  isUniqueViolation,
  mapWriteError,
  notStartedView,
  parseContinueLearningLimit,
  parseCompletedLearningLimit,
  parseLearningTarget,
  parseProgressPercent,
  planProgressMutation,
  selectCompletedLearningItems,
  selectContinueLearningItems,
  viewFromRecord,
} from "./progress-core.ts";
import type {
  CompletedLearningItem,
  ContinueLearningItem,
  ContinueLearningRow,
  LearningContentColumn,
  LearningContentTable,
  LearningProgressInsertPayload,
  LearningProgressOpResult,
  LearningProgressRecord,
  LearningProgressTarget,
  LearningProgressUiState,
  LearningProgressUpdatePayload,
  LearningProgressView,
  PublishedLearningContent,
} from "./types.ts";

export type LearningDbError = {
  code?: string;
  message: string;
};

export type LearningSessionUser = {
  id: string;
};

export type LearningProgressStore = {
  now: () => Date;
  getSessionUser: () => Promise<LearningSessionUser | null>;
  findPublishedContent: (
    table: LearningContentTable,
    id: string,
  ) => Promise<{ data: PublishedLearningContent | null; error: LearningDbError | null }>;
  findOwnProgress: (
    column: LearningContentColumn,
    contentId: string,
    userId: string,
  ) => Promise<{ data: LearningProgressRecord | null; error: LearningDbError | null }>;
  insertProgress: (
    payload: LearningProgressInsertPayload,
  ) => Promise<{ data: LearningProgressRecord | null; error: LearningDbError | null }>;
  updateProgress: (
    id: string,
    userId: string,
    patch: LearningProgressUpdatePayload,
  ) => Promise<{ data: LearningProgressRecord | null; error: LearningDbError | null }>;
  listOwnInProgressWithContent: (
    userId: string,
    limit: number,
  ) => Promise<{ data: ContinueLearningRow[] | null; error: LearningDbError | null }>;
  listOwnCompletedWithContent: (
    userId: string,
    limit: number,
  ) => Promise<{ data: ContinueLearningRow[] | null; error: LearningDbError | null }>;
  countOwnProgressByStatus: (
    userId: string,
    status: "in_progress" | "completed",
  ) => Promise<{ count: number; error: LearningDbError | null }>;
};

function invalidTarget(): LearningProgressOpResult<never> {
  return { ok: false, error: "invalid_target" };
}

function unauthenticated(): LearningProgressOpResult<never> {
  return { ok: false, error: "unauthenticated" };
}

function mapFetchError(
  error: LearningDbError | null,
): LearningProgressOpResult<never> | null {
  if (!error) {
    return null;
  }
  if (isRlsDenied(error)) {
    return { ok: false, error: "forbidden" };
  }
  return { ok: false, error: "unavailable" };
}

async function requireTargetAndUser(
  store: LearningProgressStore,
  input: unknown,
): Promise<
  | { ok: true; user: LearningSessionUser; target: LearningProgressTarget }
  | { ok: false; error: "unauthenticated" | "invalid_target" }
> {
  const target = parseLearningTarget(input);
  if (!target) {
    return { ok: false, error: "invalid_target" };
  }

  const user = await store.getSessionUser();
  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }

  return { ok: true, user, target };
}

async function requirePublishedContent(
  store: LearningProgressStore,
  target: LearningProgressTarget,
): Promise<LearningProgressOpResult<PublishedLearningContent>> {
  const { data, error } = await store.findPublishedContent(
    contentTableForType(target.contentType),
    target.contentId,
  );

  const fetchError = mapFetchError(error);
  if (fetchError) {
    return fetchError;
  }

  if (!data || !isPublishedLearningContent(data, store.now())) {
    return { ok: false, error: "invalid_content" };
  }

  return { ok: true, data };
}

async function loadOwnProgress(
  store: LearningProgressStore,
  target: LearningProgressTarget,
  userId: string,
): Promise<LearningProgressOpResult<LearningProgressRecord | null>> {
  const { data, error } = await store.findOwnProgress(
    contentColumnForType(target.contentType),
    target.contentId,
    userId,
  );

  const fetchError = mapFetchError(error);
  if (fetchError) {
    return fetchError;
  }

  return { ok: true, data };
}

async function persistPlan(
  store: LearningProgressStore,
  target: LearningProgressTarget,
  userId: string,
  plan: ReturnType<typeof planProgressMutation>,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  if (plan.action === "reject") {
    return { ok: false, error: plan.error };
  }

  if (plan.action === "none") {
    return { ok: true, data: viewFromRecord(plan.record, target) };
  }

  if (plan.action === "insert") {
    const { data, error } = await store.insertProgress(plan.payload);

    if (!error && data) {
      return { ok: true, data: viewFromRecord(data, target) };
    }

    if (error && isUniqueViolation(error)) {
      const existing = await loadOwnProgress(store, target, userId);
      if (!existing.ok) {
        return existing;
      }
      if (existing.data) {
        return { ok: true, data: viewFromRecord(existing.data, target) };
      }
      return { ok: false, error: "unavailable" };
    }

    if (error) {
      return { ok: false, error: mapWriteError(error) };
    }

    return { ok: false, error: "unavailable" };
  }

  const { data, error } = await store.updateProgress(plan.id, userId, plan.patch);

  if (error) {
    return { ok: false, error: mapWriteError(error) };
  }

  if (!data) {
    return { ok: false, error: "forbidden" };
  }

  return { ok: true, data: viewFromRecord(data, target) };
}

async function mutateProgress(
  store: LearningProgressStore,
  input: unknown,
  command: Parameters<typeof planProgressMutation>[0]["command"],
): Promise<LearningProgressOpResult<LearningProgressView>> {
  const resolved = await requireTargetAndUser(store, input);
  if (!resolved.ok) {
    return resolved;
  }

  const published = await requirePublishedContent(store, resolved.target);
  if (!published.ok) {
    return published;
  }

  const existing = await loadOwnProgress(
    store,
    resolved.target,
    resolved.user.id,
  );
  if (!existing.ok) {
    return existing;
  }

  const plan = planProgressMutation({
    current: existing.data,
    command,
    nowIso: store.now().toISOString(),
    target: resolved.target,
  });

  return persistPlan(store, resolved.target, resolved.user.id, plan);
}

export async function startLearning(
  store: LearningProgressStore,
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  return mutateProgress(store, input, { type: "start" });
}

export async function updateLearningProgress(
  store: LearningProgressStore,
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  const target = parseLearningTarget(input);
  if (!target) {
    return invalidTarget();
  }

  const record = input as Record<string, unknown>;
  const percent = parseProgressPercent(record.progressPercent);
  if (percent === null) {
    return { ok: false, error: "invalid_progress" };
  }

  return mutateProgress(store, input, { type: "update", progressPercent: percent });
}

export async function markLearningCompleted(
  store: LearningProgressStore,
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  return mutateProgress(store, input, { type: "complete" });
}

export async function getLearningProgress(
  store: LearningProgressStore,
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  const resolved = await requireTargetAndUser(store, input);
  if (!resolved.ok) {
    return resolved;
  }

  const published = await requirePublishedContent(store, resolved.target);
  if (!published.ok) {
    return published;
  }

  const existing = await loadOwnProgress(
    store,
    resolved.target,
    resolved.user.id,
  );
  if (!existing.ok) {
    return existing;
  }

  if (!existing.data) {
    return { ok: true, data: notStartedView(resolved.target) };
  }

  return { ok: true, data: viewFromRecord(existing.data, resolved.target) };
}

export async function getContinueLearningItems(
  store: LearningProgressStore,
  limit?: unknown,
): Promise<LearningProgressOpResult<ContinueLearningItem[]>> {
  const user = await store.getSessionUser();
  if (!user) {
    return unauthenticated();
  }

  const parsedLimit = parseContinueLearningLimit(limit);
  const { data, error } = await store.listOwnInProgressWithContent(
    user.id,
    parsedLimit,
  );

  const fetchError = mapFetchError(error);
  if (fetchError) {
    return fetchError;
  }

  return {
    ok: true,
    data: selectContinueLearningItems(data ?? [], store.now()),
  };
}

export async function getCompletedLearningItems(
  store: LearningProgressStore,
  limit?: unknown,
): Promise<LearningProgressOpResult<CompletedLearningItem[]>> {
  const user = await store.getSessionUser();
  if (!user) {
    return unauthenticated();
  }

  const parsedLimit = parseCompletedLearningLimit(limit);
  const { data, error } = await store.listOwnCompletedWithContent(
    user.id,
    parsedLimit,
  );

  const fetchError = mapFetchError(error);
  if (fetchError) {
    return fetchError;
  }

  return {
    ok: true,
    data: selectCompletedLearningItems(data ?? [], store.now()),
  };
}

export async function getLearningProgressStatusCounts(
  store: LearningProgressStore,
): Promise<
  LearningProgressOpResult<{ inProgress: number; completed: number }>
> {
  const user = await store.getSessionUser();
  if (!user) {
    return unauthenticated();
  }

  const [inProgressResult, completedResult] = await Promise.all([
    store.countOwnProgressByStatus(user.id, "in_progress"),
    store.countOwnProgressByStatus(user.id, "completed"),
  ]);

  const inProgressError = mapFetchError(inProgressResult.error);
  if (inProgressError) {
    return inProgressError;
  }

  const completedError = mapFetchError(completedResult.error);
  if (completedError) {
    return completedError;
  }

  return {
    ok: true,
    data: {
      inProgress: inProgressResult.count,
      completed: completedResult.count,
    },
  };
}

export async function getLearningProgressUiState(
  store: LearningProgressStore,
  input: unknown,
): Promise<LearningProgressUiState> {
  const target = parseLearningTarget(input);
  const user = await store.getSessionUser();

  if (!user) {
    return {
      authenticated: false,
      progress: target ? notStartedView(target) : null,
    };
  }

  if (!target) {
    return { authenticated: true, progress: null };
  }

  const result = await getLearningProgress(store, input);
  if (!result.ok) {
    return { authenticated: true, progress: notStartedView(target) };
  }

  return { authenticated: true, progress: result.data };
}
