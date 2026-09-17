import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { LearningProgressStore } from "./operations-core";
import type {
  ContinueLearningRow,
  LearningProgressInsertPayload,
  LearningProgressRecord,
  PublishedLearningContent,
} from "./types";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  getContinueLearningItems,
  getLearningProgress,
  getLearningProgressUiState,
  markLearningCompleted,
  startLearning,
  updateLearningProgress,
} = (await import(
  pathToFileURL(join(testDir, "operations-core.ts")).href
)) as typeof import("./operations-core");

const TUTORIAL_PUBLISHED = "22222222-2222-4222-8222-222222222222";
const TUTORIAL_DRAFT = "26262626-2626-4262-8262-262626262626";
const TUTORIAL_MISSING = "25252525-2525-4252-8252-252525252525";
const LAB_PUBLISHED = "33333333-3333-4333-8333-333333333333";
const ARTICLE_PUBLISHED = "11111111-1111-4111-8111-111111111111";
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const NOW = new Date("2026-09-17T07:00:00.000Z");

type MemoryRow = LearningProgressRecord;

function publishedContent(
  id: string,
  type: "tutorial" | "lab",
): PublishedLearningContent {
  return {
    id,
    slug: type === "tutorial" ? "published-tutorial" : "published-lab",
    title: type === "tutorial" ? "Published Tutorial" : "Published Lab",
    status: "published",
    published_at: "2026-01-01T00:00:00.000Z",
    featured_image: null,
    estimated_time: "20 min",
    difficulty: "Beginner",
    category: "Networking",
  };
}

function createMemoryStore(options: {
  sessionUserId: string | null;
  published?: Partial<Record<"tutorials" | "labs", string[]>>;
  existing?: MemoryRow[];
}): LearningProgressStore & {
  rows: MemoryRow[];
  insertPayloads: LearningProgressInsertPayload[];
  cmsWrites: string[];
  stats: { listCalls: number };
  ownerIdsSeen: string[];
} {
  const rows: MemoryRow[] = [...(options.existing ?? [])];
  const insertPayloads: LearningProgressInsertPayload[] = [];
  const cmsWrites: string[] = [];
  const ownerIdsSeen: string[] = [];
  const stats = { listCalls: 0 };
  let clock = NOW.getTime();
  const published = {
    tutorials: new Set(options.published?.tutorials ?? []),
    labs: new Set(options.published?.labs ?? []),
  };

  function requireOwn(
    userId: string,
  ): { error: { code: string; message: string } } | null {
    ownerIdsSeen.push(userId);
    if (!options.sessionUserId || userId !== options.sessionUserId) {
      return { error: { code: "42501", message: "row-level security" } };
    }
    return null;
  }

  const store: LearningProgressStore = {
    now: () => {
      clock += 1000;
      return new Date(clock);
    },
    getSessionUser: async () =>
      options.sessionUserId ? { id: options.sessionUserId } : null,
    findPublishedContent: async (table, id) => ({
      data: published[table].has(id)
        ? publishedContent(id, table === "tutorials" ? "tutorial" : "lab")
        : null,
      error: null,
    }),
    findOwnProgress: async (column, contentId, userId) => {
      const denied = requireOwn(userId);
      if (denied) {
        return { data: null, error: denied.error };
      }
      const row = rows.find(
        (item) => item.user_id === userId && item[column] === contentId,
      );
      return { data: row ?? null, error: null };
    },
    insertProgress: async (payload) => {
      insertPayloads.push({ ...payload });
      if ("user_id" in payload) {
        return {
          data: null,
          error: {
            code: "42501",
            message: "forged user_id is not accepted on insert",
          },
        };
      }
      if (!options.sessionUserId) {
        return {
          data: null,
          error: { code: "42501", message: "row-level security" },
        };
      }

      const setCount =
        Number(payload.tutorial_id != null) + Number(payload.lab_id != null);
      if (setCount !== 1) {
        return {
          data: null,
          error: { code: "23514", message: "learning_progress_one_target" },
        };
      }

      const table = payload.tutorial_id ? "tutorials" : "labs";
      const contentId = payload.tutorial_id ?? payload.lab_id;
      if (!contentId || !published[table].has(contentId)) {
        return {
          data: null,
          error: {
            code: contentId === TUTORIAL_DRAFT ? "23514" : "23503",
            message:
              contentId === TUTORIAL_DRAFT
                ? "learning_progress_unpublished_or_missing"
                : "foreign key violation",
          },
        };
      }

      const duplicate = rows.some(
        (row) =>
          row.user_id === options.sessionUserId &&
          row.tutorial_id === payload.tutorial_id &&
          row.lab_id === payload.lab_id,
      );
      if (duplicate) {
        return {
          data: null,
          error: { code: "23505", message: "duplicate key" },
        };
      }

      const row: MemoryRow = {
        id: randomUUID(),
        user_id: options.sessionUserId,
        tutorial_id: payload.tutorial_id,
        lab_id: payload.lab_id,
        status: payload.status,
        progress_percent: payload.progress_percent,
        started_at: payload.started_at,
        last_activity_at: payload.last_activity_at,
        completed_at: payload.completed_at,
        created_at: payload.started_at,
        updated_at: payload.last_activity_at,
      };
      rows.push(row);
      return { data: row, error: null };
    },
    updateProgress: async (id, userId, patch) => {
      const denied = requireOwn(userId);
      if (denied) {
        return { data: null, error: denied.error };
      }
      const row = rows.find((item) => item.id === id && item.user_id === userId);
      if (!row) {
        return { data: null, error: null };
      }
      Object.assign(row, patch, {
        updated_at: new Date(clock).toISOString(),
      });
      return { data: row, error: null };
    },
    listOwnInProgressWithContent: async (userId, limit) => {
      stats.listCalls += 1;
      const denied = requireOwn(userId);
      if (denied) {
        return { data: null, error: denied.error };
      }

      const data: ContinueLearningRow[] = rows
        .filter(
          (row) => row.user_id === userId && row.status === "in_progress",
        )
        .sort(
          (a, b) =>
            new Date(b.last_activity_at).getTime() -
            new Date(a.last_activity_at).getTime(),
        )
        .slice(0, limit)
        .map((row) => ({
          ...row,
          tutorials: row.tutorial_id
            ? publishedContent(row.tutorial_id, "tutorial")
            : null,
          labs: row.lab_id ? publishedContent(row.lab_id, "lab") : null,
        }));

      return { data, error: null };
    },
  };

  return Object.assign(store, {
    rows,
    insertPayloads,
    cmsWrites,
    stats,
    ownerIdsSeen,
  });
}

function userBTutorialProgress(): MemoryRow {
  return {
    id: "bbbbbbbb-0000-4000-8000-bbbbbbbbbbbb",
    user_id: USER_B,
    tutorial_id: TUTORIAL_PUBLISHED,
    lab_id: null,
    status: "in_progress",
    progress_percent: 25,
    started_at: "2026-09-16T00:00:00.000Z",
    last_activity_at: "2026-09-16T12:00:00.000Z",
    completed_at: null,
    created_at: "2026-09-16T00:00:00.000Z",
    updated_at: "2026-09-16T12:00:00.000Z",
  };
}

describe("learning progress identity and ownership", () => {
  it("derives identity from session and ignores client user_id", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: { tutorials: [TUTORIAL_PUBLISHED] },
    });

    const result = await startLearning(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
      user_id: USER_B,
      userId: USER_B,
    });

    assert.equal(result.ok, true);
    assert.equal(store.rows[0]?.user_id, USER_A);
    assert.equal("user_id" in store.insertPayloads[0]!, false);
    assert.deepEqual(store.ownerIdsSeen, [USER_A]);
  });

  it("does not let learner A read or mutate learner B progress", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: { tutorials: [TUTORIAL_PUBLISHED] },
      existing: [userBTutorialProgress()],
    });

    const retrieved = await getLearningProgress(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
    });
    assert.equal(retrieved.ok, true);
    if (retrieved.ok) {
      assert.equal(retrieved.data.status, "not_started");
    }

    const continued = await getContinueLearningItems(store);
    assert.equal(continued.ok, true);
    if (continued.ok) {
      assert.equal(continued.data.length, 0);
    }

    await startLearning(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
    });

    const bRow = store.rows.find((row) => row.user_id === USER_B);
    assert.equal(bRow?.progress_percent, 25);
    assert.equal(bRow?.status, "in_progress");
    assert.equal(store.rows.filter((row) => row.user_id === USER_A).length, 1);
  });

  it("rejects anonymous mutations and continue-learning reads", async () => {
    const store = createMemoryStore({
      sessionUserId: null,
      published: { tutorials: [TUTORIAL_PUBLISHED] },
    });

    const started = await startLearning(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
    });
    const completed = await markLearningCompleted(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
    });
    const updated = await updateLearningProgress(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
      progressPercent: 20,
    });
    const continued = await getContinueLearningItems(store);
    const ui = await getLearningProgressUiState(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
    });

    assert.equal(started.ok, false);
    if (!started.ok) {
      assert.equal(started.error, "unauthenticated");
    }
    assert.equal(completed.ok, false);
    if (!completed.ok) {
      assert.equal(completed.error, "unauthenticated");
    }
    assert.equal(updated.ok, false);
    if (!updated.ok) {
      assert.equal(updated.error, "unauthenticated");
    }
    assert.equal(continued.ok, false);
    if (!continued.ok) {
      assert.equal(continued.error, "unauthenticated");
    }
    assert.equal(ui.authenticated, false);
    assert.equal(store.rows.length, 0);
    assert.equal(store.cmsWrites.length, 0);
  });
});

describe("learning progress content and state rules", () => {
  it("rejects articles, drafts, missing content, and invalid percents", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: { tutorials: [TUTORIAL_PUBLISHED], labs: [LAB_PUBLISHED] },
    });

    const article = await startLearning(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });
    const draft = await startLearning(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_DRAFT,
    });
    const missing = await startLearning(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_MISSING,
    });
    const badPercent = await updateLearningProgress(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
      progressPercent: 140,
    });

    assert.equal(article.ok, false);
    if (!article.ok) {
      assert.equal(article.error, "invalid_target");
    }
    assert.equal(draft.ok, false);
    if (!draft.ok) {
      assert.equal(draft.error, "invalid_content");
    }
    assert.equal(missing.ok, false);
    if (!missing.ok) {
      assert.equal(missing.error, "invalid_content");
    }
    assert.equal(badPercent.ok, false);
    if (!badPercent.ok) {
      assert.equal(badPercent.error, "invalid_progress");
    }
    assert.equal(store.rows.length, 0);
  });

  it("starts, updates, completes, and stays idempotent", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: { tutorials: [TUTORIAL_PUBLISHED], labs: [LAB_PUBLISHED] },
    });

    const started = await startLearning(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
    });
    const startedAgain = await startLearning(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
    });
    const updated = await updateLearningProgress(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
      progressPercent: 55,
    });
    const completed = await markLearningCompleted(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
    });
    const completedAgain = await markLearningCompleted(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
    });
    const uncomplete = await updateLearningProgress(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
      progressPercent: 10,
    });

    assert.equal(started.ok, true);
    assert.equal(startedAgain.ok, true);
    assert.equal(updated.ok, true);
    assert.equal(completed.ok, true);
    assert.equal(completedAgain.ok, true);
    assert.equal(uncomplete.ok, false);
    if (uncomplete.ok === false) {
      assert.equal(uncomplete.error, "invalid_transition");
    }
    assert.equal(store.rows.length, 1);
    assert.equal(store.rows[0]?.status, "completed");
    assert.equal(store.rows[0]?.progress_percent, 100);
    assert.ok(store.rows[0]?.completed_at);
    if (completed.ok && completedAgain.ok) {
      assert.equal(completed.data.completedAt, completedAgain.data.completedAt);
    }
  });

  it("returns continue-learning in one joined query ordered by last_activity_at", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: { tutorials: [TUTORIAL_PUBLISHED], labs: [LAB_PUBLISHED] },
    });

    await startLearning(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
    });
    await startLearning(store, {
      contentType: "lab",
      contentId: LAB_PUBLISHED,
    });
    await updateLearningProgress(store, {
      contentType: "lab",
      contentId: LAB_PUBLISHED,
      progressPercent: 30,
    });

    const continued = await getContinueLearningItems(store, 10);
    assert.equal(continued.ok, true);
    if (continued.ok) {
      assert.deepEqual(
        continued.data.map((item) => item.contentType),
        ["lab", "tutorial"],
      );
    }
    assert.equal(store.stats.listCalls, 1);
    assert.equal(store.cmsWrites.length, 0);
  });
});
