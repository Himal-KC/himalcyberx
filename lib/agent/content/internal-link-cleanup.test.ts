import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const linkCore = (await import(
  pathToFileURL(join(testDir, "internal-link-cleanup-core.ts")).href
)) as typeof import("./internal-link-cleanup-core");

type ApprovedInternalCatalogItem =
  import("./internal-link-cleanup-core").ApprovedInternalCatalogItem;

const APPROVED_ID = "00000000-0000-4000-8000-000000000020";
const UNAPPROVED_ID = "00000000-0000-4000-8000-000000000021";

const catalog: ApprovedInternalCatalogItem[] = [
  {
    id: APPROVED_ID,
    contentType: "article",
    title: "Microsoft 365 Phishing Defense Guide",
    slug: "microsoft-365-phishing-defense-guide",
  },
];

describe("approved internal link deterministic cleanup", () => {
  it("inserts a canonical href for the first plain-text anchor occurrence", () => {
    const anchor = "Microsoft 365 Phishing Defense Guide";
    const content = `<p>Teams should read the ${anchor} before changing policies.</p>`;
    const resolved = linkCore.resolveApprovedInternalLinks({
      internalLinks: [
        {
          contentId: APPROVED_ID,
          contentType: "article",
          anchorText: anchor,
          suggestedSection: "Related guidance",
        },
      ],
      catalog,
    });

    const result = linkCore.applyApprovedInternalLinksToHtml({
      content,
      links: resolved,
    });

    assert.match(
      result.content,
      /<a href="\/articles\/microsoft-365-phishing-defense-guide">Microsoft 365 Phishing Defense Guide<\/a>/,
    );
    assert.deepEqual(result.linkedContentIds, [APPROVED_ID]);
  });

  it("does not duplicate an existing anchor with the same href", () => {
    const href = "/articles/microsoft-365-phishing-defense-guide";
    const content = `<p>See <a href="${href}">Microsoft 365 Phishing Defense Guide</a> for details.</p>`;
    const resolved = linkCore.resolveApprovedInternalLinks({
      internalLinks: [
        {
          contentId: APPROVED_ID,
          contentType: "article",
          anchorText: "Microsoft 365 Phishing Defense Guide",
          suggestedSection: "Related guidance",
        },
      ],
      catalog,
    });

    const result = linkCore.applyApprovedInternalLinksToHtml({
      content,
      links: resolved,
    });

    assert.equal(result.content, content);
    assert.deepEqual(result.linkedContentIds, []);
  });

  it("skips internal links that are not in the approved catalog", () => {
    const content =
      "<p>Reference the Microsoft 365 Phishing Defense Guide in planning.</p>";
    const resolved = linkCore.resolveApprovedInternalLinks({
      internalLinks: [
        {
          contentId: UNAPPROVED_ID,
          contentType: "article",
          anchorText: "Microsoft 365 Phishing Defense Guide",
          suggestedSection: "Unapproved",
        },
      ],
      catalog,
    });

    assert.equal(resolved.length, 0);
    const result = linkCore.applyApprovedInternalLinksToHtml({
      content,
      links: resolved,
    });
    assert.equal(result.content, content);
  });

  it("does not create a link when slug is invalid", () => {
    const badCatalog: ApprovedInternalCatalogItem[] = [
      {
        id: APPROVED_ID,
        contentType: "article",
        title: "Bad Slug Article",
        slug: "Invalid Slug With Spaces",
      },
    ];
    const resolved = linkCore.resolveApprovedInternalLinks({
      internalLinks: [
        {
          contentId: APPROVED_ID,
          contentType: "article",
          anchorText: "Bad Slug Article",
          suggestedSection: "Related",
        },
      ],
      catalog: badCatalog,
    });

    assert.equal(resolved.length, 0);
  });

  it("is idempotent when cleanup runs twice", () => {
    const content =
      "<p>Review Microsoft 365 Phishing Defense Guide during rollout.</p>";
    const resolved = linkCore.resolveApprovedInternalLinks({
      internalLinks: [
        {
          contentId: APPROVED_ID,
          contentType: "article",
          anchorText: "Microsoft 365 Phishing Defense Guide",
          suggestedSection: "Related guidance",
        },
      ],
      catalog,
    });

    const first = linkCore.applyApprovedInternalLinksToHtml({
      content,
      links: resolved,
    });
    const second = linkCore.applyApprovedInternalLinksToHtml({
      content: first.content,
      links: resolved,
    });

    assert.equal(second.content, first.content);
    assert.deepEqual(second.linkedContentIds, []);
  });
});
