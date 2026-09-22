import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  getCompletedLearningItems,
  getLearningProgressStatusCounts,
  type LearningProgressStore,
} from "../learning/operations-core.ts";
import type { ContinueLearningRow } from "../learning/types.ts";

const testDir = dirname(fileURLToPath(import.meta.url));

const core = (await import(
  pathToFileURL(join(testDir, "dashboard-core.ts")).href
)) as typeof import("./dashboard-core");

const progressCore = (await import(
  pathToFileURL(join(testDir, "..", "learning", "progress-core.ts")).href
)) as typeof import("../learning/progress-core");

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function publishedTutorial(id: string) {
  return {
    id,
    slug: "tutorial-slug",
    title: "Tutorial Title",
    status: "published" as const,
    published_at: "2026-01-01T00:00:00.000Z",
    featured_image: null,
    estimated_time: "20 min",
    difficulty: "Beginner",
    category: "Networking",
  };
}

describe("dashboard saved content selection", () => {
  it("orders saved items by created_at desc and omits unpublished embeds", () => {
    const items = core.selectDashboardSavedItems([
      {
        id: "1",
        created_at: "2026-09-10T00:00:00.000Z",
        article_id: "11111111-1111-4111-8111-111111111111",
        tutorial_id: null,
        lab_id: null,
        articles: {
          title: "Old Article",
          slug: "old",
          category: "News",
          status: "published",
          published_at: "2026-01-01T00:00:00.000Z",
        },
      },
      {
        id: "2",
        created_at: "2026-09-17T00:00:00.000Z",
        article_id: null,
        tutorial_id: "22222222-2222-4222-8222-222222222222",
        lab_id: null,
        tutorials: {
          title: "Draft Tutorial",
          slug: "draft",
          category: "Labs",
          status: "draft",
          published_at: null,
        },
      },
      {
        id: "3",
        created_at: "2026-09-15T00:00:00.000Z",
        article_id: null,
        tutorial_id: "33333333-3333-4333-8333-333333333333",
        lab_id: null,
        tutorials: {
          title: "Fresh Tutorial",
          slug: "fresh",
          category: "Cloud",
          difficulty: "Intermediate",
          status: "published",
          published_at: "2026-01-01T00:00:00.000Z",
        },
      },
    ]);

    assert.equal(items.length, 2);
    assert.equal(items[0]?.title, "Fresh Tutorial");
    assert.equal(items[0]?.difficulty, "Intermediate");
    assert.equal(items[1]?.title, "Old Article");
  });

  it("builds factual dashboard stats from counts", () => {
    assert.deepEqual(
      core.buildDashboardStats({
        savedCount: 4,
        inProgressCount: 2,
        completedCount: 1,
      }),
      { savedCount: 4, inProgressCount: 2, completedCount: 1 },
    );
  });

  it("limits dashboard previews without changing totals", () => {
    const preview = core.takeDashboardPreview([1, 2, 3, 4, 5, 6, 7], 6);
    assert.equal(preview.length, 6);
  });
});

describe("dashboard completed and continue ordering", () => {
  it("orders completed learning by completed_at desc", () => {
    const rows: ContinueLearningRow[] = [
      {
        id: "a",
        user_id: USER_A,
        tutorial_id: "22222222-2222-4222-8222-222222222222",
        lab_id: null,
        status: "completed",
        progress_percent: 100,
        started_at: "2026-09-01T00:00:00.000Z",
        last_activity_at: "2026-09-10T00:00:00.000Z",
        completed_at: "2026-09-10T00:00:00.000Z",
        created_at: "2026-09-01T00:00:00.000Z",
        updated_at: "2026-09-10T00:00:00.000Z",
        tutorials: publishedTutorial("22222222-2222-4222-8222-222222222222"),
      },
      {
        id: "b",
        user_id: USER_A,
        tutorial_id: null,
        lab_id: "33333333-3333-4333-8333-333333333333",
        status: "completed",
        progress_percent: 100,
        started_at: "2026-09-01T00:00:00.000Z",
        last_activity_at: "2026-09-17T00:00:00.000Z",
        completed_at: "2026-09-17T00:00:00.000Z",
        created_at: "2026-09-01T00:00:00.000Z",
        updated_at: "2026-09-17T00:00:00.000Z",
        labs: publishedTutorial("33333333-3333-4333-8333-333333333333"),
      },
    ];

    const items = progressCore.selectCompletedLearningItems(rows);
    assert.equal(items[0]?.contentType, "lab");
    assert.equal(items[1]?.contentType, "tutorial");
  });

  it("reports empty dashboard safely", () => {
    assert.equal(
      core.isEmptyDashboard({
        stats: { savedCount: 0, inProgressCount: 0, completedCount: 0 },
        continueLearning: [],
        completedLearning: [],
        savedPreview: [],
      }),
      true,
    );
  });
});

describe("dashboard progress counts from session store", () => {
  it("derives in-progress and completed counts for the signed-in user only", async () => {
    const store: LearningProgressStore = {
      now: () => new Date("2026-09-17T07:00:00.000Z"),
      getSessionUser: async () => ({ id: USER_A }),
      findPublishedContent: async () => ({ data: null, error: null }),
      findOwnProgress: async () => ({ data: null, error: null }),
      insertProgress: async () => ({ data: null, error: null }),
      updateProgress: async () => ({ data: null, error: null }),
      listOwnInProgressWithContent: async () => ({ data: [], error: null }),
      listOwnCompletedWithContent: async () => ({ data: [], error: null }),
      countOwnProgressByStatus: async (
        userId: string,
        status: "in_progress" | "completed",
      ) => {
        assert.equal(userId, USER_A);
        return {
          count: status === "in_progress" ? 2 : 3,
          error: null,
        };
      },
    };

    const result = await getLearningProgressStatusCounts(store);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.data, { inProgress: 2, completed: 3 });
    }
  });

  it("rejects unauthenticated progress count reads", async () => {
    const store: LearningProgressStore = {
      now: () => new Date(),
      getSessionUser: async () => null,
      findPublishedContent: async () => ({ data: null, error: null }),
      findOwnProgress: async () => ({ data: null, error: null }),
      insertProgress: async () => ({ data: null, error: null }),
      updateProgress: async () => ({ data: null, error: null }),
      listOwnInProgressWithContent: async () => ({ data: [], error: null }),
      listOwnCompletedWithContent: async () => ({ data: [], error: null }),
      countOwnProgressByStatus: async () => ({ count: 0, error: null }),
    };

    const result = await getCompletedLearningItems(store, 6);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "unauthenticated");
    }
  });
});
