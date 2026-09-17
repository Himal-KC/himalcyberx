import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  bookmarkContentHref,
  buildSavedContentInsert,
  isUuid,
  listInsertPayloadKeys,
  parseBookmarkTarget,
  resolveBookmarkFromRow,
} = (await import(
  pathToFileURL(join(testDir, "core.ts")).href
)) as typeof import("./core");

const ARTICLE_ID = "11111111-1111-4111-8111-111111111111";
const TUTORIAL_ID = "22222222-2222-4222-8222-222222222222";
const LAB_ID = "33333333-3333-4333-8333-333333333333";
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("bookmark target parsing", () => {
  it("accepts article, tutorial, and lab UUIDs", () => {
    assert.deepEqual(
      parseBookmarkTarget({ contentType: "article", contentId: ARTICLE_ID }),
      { contentType: "article", contentId: ARTICLE_ID },
    );
    assert.deepEqual(
      parseBookmarkTarget({ contentType: "tutorial", contentId: TUTORIAL_ID }),
      { contentType: "tutorial", contentId: TUTORIAL_ID },
    );
    assert.deepEqual(
      parseBookmarkTarget({ contentType: "lab", contentId: LAB_ID }),
      { contentType: "lab", contentId: LAB_ID },
    );
  });

  it("ignores forged user_id on the client payload", () => {
    const parsed = parseBookmarkTarget({
      contentType: "article",
      contentId: ARTICLE_ID,
      user_id: USER_B,
      userId: USER_B,
    });
    assert.deepEqual(parsed, {
      contentType: "article",
      contentId: ARTICLE_ID,
    });
    assert.equal(parsed && "user_id" in parsed, false);
  });

  it("rejects invalid content types and non-UUID ids", () => {
    assert.equal(
      parseBookmarkTarget({ contentType: "agent", contentId: ARTICLE_ID }),
      null,
    );
    assert.equal(
      parseBookmarkTarget({ contentType: "article", contentId: "not-a-uuid" }),
      null,
    );
    assert.equal(parseBookmarkTarget(null), null);
    assert.equal(isUuid(USER_A), true);
    assert.equal(isUuid("abcd"), false);
  });
});

describe("exclusive-arc insert payload", () => {
  it("sets exactly one FK and never includes user_id", () => {
    const article = buildSavedContentInsert({
      contentType: "article",
      contentId: ARTICLE_ID,
    });
    assert.deepEqual(article, {
      article_id: ARTICLE_ID,
      tutorial_id: null,
      lab_id: null,
    });
    assert.deepEqual(listInsertPayloadKeys(article).sort(), [
      "article_id",
      "lab_id",
      "tutorial_id",
    ]);

    const tutorial = buildSavedContentInsert({
      contentType: "tutorial",
      contentId: TUTORIAL_ID,
    });
    assert.equal(tutorial.tutorial_id, TUTORIAL_ID);
    assert.equal(tutorial.article_id, null);
    assert.equal(tutorial.lab_id, null);

    const lab = buildSavedContentInsert({
      contentType: "lab",
      contentId: LAB_ID,
    });
    assert.equal(lab.lab_id, LAB_ID);
    assert.equal(lab.article_id, null);
    assert.equal(lab.tutorial_id, null);
  });

  it("maps exclusive-arc rows to saved items", () => {
    const item = resolveBookmarkFromRow({
      id: "44444444-4444-4444-8444-444444444444",
      created_at: "2026-01-01T00:00:00.000Z",
      article_id: ARTICLE_ID,
      tutorial_id: null,
      lab_id: null,
      articles: { title: "MFA Guide", slug: "mfa-guide" },
    });
    assert.equal(item?.contentType, "article");
    assert.equal(item?.href, "/articles/mfa-guide");
    assert.equal(bookmarkContentHref("lab", "packet-lab"), "/cyber-lab/packet-lab");
  });

  it("rejects rows that set more than one content FK", () => {
    assert.equal(
      resolveBookmarkFromRow({
        id: "55555555-5555-4555-8555-555555555555",
        created_at: "2026-01-01T00:00:00.000Z",
        article_id: ARTICLE_ID,
        tutorial_id: TUTORIAL_ID,
        lab_id: null,
      }),
      null,
    );
  });
});
