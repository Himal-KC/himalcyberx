import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  buildLearningProgressInsertKeys,
  isUuid,
  learningContentHref,
  parseContinueLearningLimit,
  parseLearningTarget,
  parseProgressPercent,
  planProgressMutation,
  selectContinueLearningItems,
} = (await import(
  pathToFileURL(join(testDir, "progress-core.ts")).href
)) as typeof import("./progress-core");

const TUTORIAL_ID = "22222222-2222-4222-8222-222222222222";
const LAB_ID = "33333333-3333-4333-8333-333333333333";
const ARTICLE_ID = "11111111-1111-4111-8111-111111111111";
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const NOW = "2026-09-17T07:00:00.000Z";

function inProgressRecord() {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    user_id: USER_A,
    tutorial_id: TUTORIAL_ID,
    lab_id: null,
    status: "in_progress" as const,
    progress_percent: 40,
    started_at: "2026-09-17T06:00:00.000Z",
    last_activity_at: "2026-09-17T06:30:00.000Z",
    completed_at: null,
    created_at: "2026-09-17T06:00:00.000Z",
    updated_at: "2026-09-17T06:30:00.000Z",
  };
}

function completedRecord() {
  return {
    ...inProgressRecord(),
    status: "completed" as const,
    progress_percent: 100,
    completed_at: "2026-09-17T06:45:00.000Z",
    last_activity_at: "2026-09-17T06:45:00.000Z",
  };
}

describe("learning target parsing", () => {
  it("accepts tutorial and lab UUIDs and rejects articles", () => {
    assert.deepEqual(
      parseLearningTarget({ contentType: "tutorial", contentId: TUTORIAL_ID }),
      { contentType: "tutorial", contentId: TUTORIAL_ID },
    );
    assert.deepEqual(
      parseLearningTarget({ contentType: "lab", contentId: LAB_ID }),
      { contentType: "lab", contentId: LAB_ID },
    );
    assert.equal(
      parseLearningTarget({ contentType: "article", contentId: ARTICLE_ID }),
      null,
    );
  });

  it("ignores forged user_id on the client payload", () => {
    const parsed = parseLearningTarget({
      contentType: "tutorial",
      contentId: TUTORIAL_ID,
      user_id: USER_B,
      userId: USER_B,
    });
    assert.deepEqual(parsed, {
      contentType: "tutorial",
      contentId: TUTORIAL_ID,
    });
    assert.equal(parsed && "user_id" in parsed, false);
    assert.equal(isUuid(USER_A), true);
    assert.equal(isUuid("not-a-uuid"), false);
  });
});

describe("progress percentage validation", () => {
  it("accepts integers 0-100 and numeric strings in range", () => {
    assert.equal(parseProgressPercent(0), 0);
    assert.equal(parseProgressPercent(50), 50);
    assert.equal(parseProgressPercent(100), 100);
    assert.equal(parseProgressPercent("7"), 7);
  });

  it("rejects out-of-range and non-integer values", () => {
    assert.equal(parseProgressPercent(-1), null);
    assert.equal(parseProgressPercent(101), null);
    assert.equal(parseProgressPercent(12.5), null);
    assert.equal(parseProgressPercent(Number.NaN), null);
    assert.equal(parseProgressPercent("1000"), null);
    assert.equal(parseProgressPercent("abc"), null);
    assert.equal(parseProgressPercent(undefined), null);
  });
});

describe("progress state transitions", () => {
  const target = { contentType: "tutorial" as const, contentId: TUTORIAL_ID };

  it("starts from not_started as in_progress at 0%", () => {
    const plan = planProgressMutation({
      current: null,
      command: { type: "start" },
      nowIso: NOW,
      target,
    });
    assert.equal(plan.action, "insert");
    if (plan.action === "insert") {
      assert.equal(plan.payload.status, "in_progress");
      assert.equal(plan.payload.progress_percent, 0);
      assert.equal(plan.payload.completed_at, null);
      assert.equal(plan.payload.tutorial_id, TUTORIAL_ID);
      assert.equal(plan.payload.lab_id, null);
      assert.equal("user_id" in plan.payload, false);
    }
  });

  it("treats start as idempotent for in_progress and completed", () => {
    const inProgress = planProgressMutation({
      current: inProgressRecord(),
      command: { type: "start" },
      nowIso: NOW,
      target,
    });
    const completed = planProgressMutation({
      current: completedRecord(),
      command: { type: "start" },
      nowIso: NOW,
      target,
    });
    assert.equal(inProgress.action, "none");
    assert.equal(completed.action, "none");
    if (completed.action === "none") {
      assert.equal(completed.record.completed_at, "2026-09-17T06:45:00.000Z");
    }
  });

  it("updates percent on in_progress and rejects lowering completed work", () => {
    const updated = planProgressMutation({
      current: inProgressRecord(),
      command: { type: "update", progressPercent: 80 },
      nowIso: NOW,
      target,
    });
    assert.equal(updated.action, "update");
    if (updated.action === "update") {
      assert.equal(updated.patch.progress_percent, 80);
      assert.equal(updated.patch.last_activity_at, NOW);
    }

    const rejected = planProgressMutation({
      current: completedRecord(),
      command: { type: "update", progressPercent: 40 },
      nowIso: NOW,
      target,
    });
    assert.equal(rejected.action, "reject");
    if (rejected.action === "reject") {
      assert.equal(rejected.error, "invalid_transition");
    }

    const keepCompleted = planProgressMutation({
      current: completedRecord(),
      command: { type: "update", progressPercent: 100 },
      nowIso: NOW,
      target,
    });
    assert.equal(keepCompleted.action, "none");
  });

  it("sets completed_at once and preserves it on repeat complete", () => {
    const first = planProgressMutation({
      current: inProgressRecord(),
      command: { type: "complete" },
      nowIso: NOW,
      target,
    });
    assert.equal(first.action, "update");
    if (first.action === "update") {
      assert.equal(first.patch.status, "completed");
      assert.equal(first.patch.progress_percent, 100);
      assert.equal(first.patch.completed_at, NOW);
    }

    const second = planProgressMutation({
      current: completedRecord(),
      command: { type: "complete" },
      nowIso: "2026-09-18T00:00:00.000Z",
      target,
    });
    assert.equal(second.action, "none");
    if (second.action === "none") {
      assert.equal(second.record.completed_at, "2026-09-17T06:45:00.000Z");
    }
  });
});

describe("continue-learning selection", () => {
  it("keeps recent in-progress published tutorials/labs and skips the rest", () => {
    const items = selectContinueLearningItems(
      [
        {
          ...inProgressRecord(),
          id: "1",
          last_activity_at: "2026-09-17T05:00:00.000Z",
          tutorials: {
            id: TUTORIAL_ID,
            slug: "older-tutorial",
            title: "Older",
            status: "published",
            published_at: "2026-01-01T00:00:00.000Z",
            featured_image: null,
            estimated_time: "20 min",
            difficulty: "Beginner",
            category: "Networking",
          },
        },
        {
          ...inProgressRecord(),
          id: "2",
          tutorial_id: null,
          lab_id: LAB_ID,
          last_activity_at: "2026-09-17T08:00:00.000Z",
          labs: {
            id: LAB_ID,
            slug: "newer-lab",
            title: "Newer",
            status: "published",
            published_at: "2026-01-01T00:00:00.000Z",
            featured_image: null,
            estimated_time: "30 min",
            difficulty: "Intermediate",
            category: "Forensics",
          },
        },
        {
          ...completedRecord(),
          id: "3",
          tutorials: {
            id: TUTORIAL_ID,
            slug: "done",
            title: "Done",
            status: "published",
            published_at: "2026-01-01T00:00:00.000Z",
            featured_image: null,
            estimated_time: null,
            difficulty: null,
            category: null,
          },
        },
        {
          ...inProgressRecord(),
          id: "4",
          last_activity_at: "2026-09-17T09:00:00.000Z",
          tutorials: {
            id: TUTORIAL_ID,
            slug: "drafty",
            title: "Hidden",
            status: "published",
            published_at: "2099-01-01T00:00:00.000Z",
            featured_image: null,
            estimated_time: null,
            difficulty: null,
            category: null,
          },
        },
      ],
      new Date("2026-09-17T10:00:00.000Z"),
    );

    assert.deepEqual(
      items.map((item) => item.slug),
      ["newer-lab", "older-tutorial"],
    );
    assert.equal(items[0]?.href, "/cyber-lab/newer-lab");
    assert.equal(items[1]?.href, "/tutorials/older-tutorial");
    assert.equal(parseContinueLearningLimit(999), 50);
  });

  it("builds exclusive-arc insert keys without a user_id field", () => {
    assert.deepEqual(buildLearningProgressInsertKeys("lab", LAB_ID), {
      tutorial_id: null,
      lab_id: LAB_ID,
    });
    assert.equal(learningContentHref("tutorial", "x"), "/tutorials/x");
  });
});
