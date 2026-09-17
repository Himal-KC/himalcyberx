import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type {
  BookmarkStore,
  SavedContentInsertPayload,
  SavedContentRow,
} from "./types";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  getBookmarkUiState,
  isContentSaved,
  listSavedContent,
  removeBookmarkedContent,
  saveBookmarkedContent,
} = (await import(
  pathToFileURL(join(testDir, "core.ts")).href
)) as typeof import("./core");

const ARTICLE_PUBLISHED = "11111111-1111-4111-8111-111111111111";
const ARTICLE_DRAFT = "16161616-1616-4161-8161-161616161616";
const ARTICLE_MISSING = "15151515-1515-4151-8151-151515151515";
const TUTORIAL_PUBLISHED = "22222222-2222-4222-8222-222222222222";
const LAB_PUBLISHED = "33333333-3333-4333-8333-333333333333";
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

type MemoryRow = SavedContentRow & { user_id: string };

function createMemoryStore(options: {
  sessionUserId: string | null;
  published?: Partial<Record<"articles" | "tutorials" | "labs", string[]>>;
  existing?: MemoryRow[];
}): BookmarkStore & {
  rows: MemoryRow[];
  insertPayloads: SavedContentInsertPayload[];
  ownerIdsSeen: string[];
} {
  const rows: MemoryRow[] = [...(options.existing ?? [])];
  const insertPayloads: SavedContentInsertPayload[] = [];
  const ownerIdsSeen: string[] = [];
  const published = {
    articles: new Set(options.published?.articles ?? []),
    tutorials: new Set(options.published?.tutorials ?? []),
    labs: new Set(options.published?.labs ?? []),
  };

  function requireOwn(userId: string): { error: { code: string; message: string } } | null {
    ownerIdsSeen.push(userId);
    if (!options.sessionUserId) {
      return { error: { code: "42501", message: "row-level security" } };
    }
    if (userId !== options.sessionUserId) {
      return { error: { code: "42501", message: "row-level security" } };
    }
    return null;
  }

  const store: BookmarkStore = {
    getSessionUser: async () =>
      options.sessionUserId ? { id: options.sessionUserId } : null,
    findPublishedContent: async (table, id) => ({
      found: published[table].has(id),
    }),
    insertSavedContent: async (payload) => {
      insertPayloads.push({ ...payload });
      if ("user_id" in payload) {
        return {
          error: {
            code: "42501",
            message: "forged user_id is not accepted on insert",
          },
        };
      }
      if (!options.sessionUserId) {
        return { error: { code: "42501", message: "row-level security" } };
      }

      const setCount =
        Number(payload.article_id != null) +
        Number(payload.tutorial_id != null) +
        Number(payload.lab_id != null);
      if (setCount !== 1) {
        return { error: { code: "23514", message: "saved_content_one_target" } };
      }

      const table = payload.article_id
        ? "articles"
        : payload.tutorial_id
          ? "tutorials"
          : "labs";
      const contentId =
        payload.article_id ?? payload.tutorial_id ?? payload.lab_id;
      if (!contentId || !published[table].has(contentId)) {
        if (contentId === ARTICLE_DRAFT) {
          return {
            error: {
              code: "23514",
              message: "saved_content_unpublished_or_missing",
            },
          };
        }
        return { error: { code: "23503", message: "foreign key violation" } };
      }

      const duplicate = rows.some(
        (row) =>
          row.user_id === options.sessionUserId &&
          row.article_id === payload.article_id &&
          row.tutorial_id === payload.tutorial_id &&
          row.lab_id === payload.lab_id,
      );
      if (duplicate) {
        return { error: { code: "23505", message: "duplicate key" } };
      }

      rows.push({
        id: randomUUID(),
        user_id: options.sessionUserId,
        created_at: new Date().toISOString(),
        article_id: payload.article_id,
        tutorial_id: payload.tutorial_id,
        lab_id: payload.lab_id,
      });
      return { error: null };
    },
    findOwnSavedContent: async (column, contentId, userId) => {
      const denied = requireOwn(userId);
      if (denied) {
        return { data: null, error: denied.error };
      }
      const row = rows.find(
        (item) => item.user_id === userId && item[column] === contentId,
      );
      return { data: row ? { id: row.id } : null, error: null };
    },
    deleteOwnSavedContent: async (column, contentId, userId) => {
      const denied = requireOwn(userId);
      if (denied) {
        return { error: denied.error };
      }
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        const row = rows[index];
        if (row && row.user_id === userId && row[column] === contentId) {
          rows.splice(index, 1);
        }
      }
      return { error: null };
    },
    listOwnSavedContent: async (userId) => {
      const denied = requireOwn(userId);
      if (denied) {
        return { data: null, error: denied.error };
      }
      return {
        data: rows.filter((row) => row.user_id === userId),
        error: null,
      };
    },
  };

  return Object.assign(store, { rows, insertPayloads, ownerIdsSeen });
}

function userBArticleBookmark(): MemoryRow {
  return {
    id: "bbbbbbbb-0000-4000-8000-bbbbbbbbbbbb",
    user_id: USER_B,
    created_at: "2026-01-01T00:00:00.000Z",
    article_id: ARTICLE_PUBLISHED,
    tutorial_id: null,
    lab_id: null,
    articles: { title: "User B article", slug: "user-b-article" },
  };
}

describe("bookmark operations identity and ownership", () => {
  it("derives identity from session and ignores client user_id", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: { articles: [ARTICLE_PUBLISHED] },
    });

    const result = await saveBookmarkedContent(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
      user_id: USER_B,
    });

    assert.equal(result.ok, true);
    assert.equal(store.rows[0]?.user_id, USER_A);
    assert.equal("user_id" in store.insertPayloads[0]!, false);
  });

  it("does not let user A list or delete user B bookmarks", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: { articles: [ARTICLE_PUBLISHED] },
      existing: [userBArticleBookmark()],
    });

    const listed = await listSavedContent(store);
    assert.equal(listed.ok, true);
    if (listed.ok) {
      assert.equal(listed.data.length, 0);
    }
    assert.deepEqual(store.ownerIdsSeen, [USER_A]);

    const removed = await removeBookmarkedContent(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });
    assert.equal(removed.ok, true);
    assert.equal(store.rows.length, 1);
    assert.equal(store.rows[0]?.user_id, USER_B);
  });

  it("treats unauthenticated writes as unauthenticated", async () => {
    const store = createMemoryStore({
      sessionUserId: null,
      published: { articles: [ARTICLE_PUBLISHED] },
    });

    const saved = await saveBookmarkedContent(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });
    const removed = await removeBookmarkedContent(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });
    const listed = await listSavedContent(store);
    const ui = await getBookmarkUiState(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });

    assert.equal(saved.ok, false);
    if (!saved.ok) {
      assert.equal(saved.error, "unauthenticated");
    }
    assert.equal(removed.ok, false);
    if (!removed.ok) {
      assert.equal(removed.error, "unauthenticated");
    }
    assert.equal(listed.ok, false);
    if (!listed.ok) {
      assert.equal(listed.error, "unauthenticated");
    }
    assert.deepEqual(ui, { authenticated: false, saved: false });
    assert.equal(store.rows.length, 0);
  });
});

describe("bookmark save/remove semantics", () => {
  it("saves article, tutorial, and lab content", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: {
        articles: [ARTICLE_PUBLISHED],
        tutorials: [TUTORIAL_PUBLISHED],
        labs: [LAB_PUBLISHED],
      },
    });

    const article = await saveBookmarkedContent(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });
    const tutorial = await saveBookmarkedContent(store, {
      contentType: "tutorial",
      contentId: TUTORIAL_PUBLISHED,
    });
    const lab = await saveBookmarkedContent(store, {
      contentType: "lab",
      contentId: LAB_PUBLISHED,
    });

    assert.equal(article.ok, true);
    assert.equal(tutorial.ok, true);
    assert.equal(lab.ok, true);
    assert.equal(store.rows.length, 3);
  });

  it("treats duplicate saves as idempotent success", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: { articles: [ARTICLE_PUBLISHED] },
    });

    const first = await saveBookmarkedContent(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });
    const second = await saveBookmarkedContent(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.equal(store.rows.length, 1);
  });

  it("treats removing a missing bookmark as idempotent success", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: { articles: [ARTICLE_PUBLISHED] },
    });

    const removed = await removeBookmarkedContent(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });
    assert.equal(removed.ok, true);
    if (removed.ok) {
      assert.equal(removed.data.saved, false);
    }
  });

  it("rejects unpublished and missing content", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: { articles: [ARTICLE_PUBLISHED] },
    });

    const draft = await saveBookmarkedContent(store, {
      contentType: "article",
      contentId: ARTICLE_DRAFT,
    });
    const missing = await saveBookmarkedContent(store, {
      contentType: "article",
      contentId: ARTICLE_MISSING,
    });

    assert.equal(draft.ok, false);
    if (!draft.ok) {
      assert.equal(draft.error, "invalid_content");
    }
    assert.equal(missing.ok, false);
    if (!missing.ok) {
      assert.equal(missing.error, "invalid_content");
    }
    assert.equal(store.rows.length, 0);
  });

  it("reports saved state for the session user only", async () => {
    const store = createMemoryStore({
      sessionUserId: USER_A,
      published: { articles: [ARTICLE_PUBLISHED] },
      existing: [userBArticleBookmark()],
    });

    const before = await isContentSaved(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });
    assert.equal(before.ok, true);
    if (before.ok) {
      assert.equal(before.data.saved, false);
    }

    await saveBookmarkedContent(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });

    const after = await isContentSaved(store, {
      contentType: "article",
      contentId: ARTICLE_PUBLISHED,
    });
    assert.equal(after.ok, true);
    if (after.ok) {
      assert.equal(after.data.saved, true);
    }
  });
});
