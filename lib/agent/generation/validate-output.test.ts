import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  applyCanonicalHtmlRepairs,
  containsBackslashEscapedHtmlTags,
  containsEntityEscapedHtmlTags,
  containsMarkdownHrefValues,
  containsNestedAnchorTags,
  looksLikeRichHtml,
} = (await import(
  pathToFileURL(join(testDir, "../../content/canonical-html-repair-core.ts")).href
)) as typeof import("../../content/canonical-html-repair-core");

import sanitizeHtml from "sanitize-html";

const CISA_URL = "https://www.cisa.gov/stopransomware";

function canonicalizeRichContentForStorage(
  content: string,
  options?: { allowedSourceUrls?: readonly string[] },
): string {
  const repaired = applyCanonicalHtmlRepairs(content, options);
  if (!looksLikeRichHtml(repaired)) {
    return repaired;
  }

  const sanitized = sanitizeHtml(repaired, {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "h4",
      "strong",
      "ul",
      "ol",
      "li",
      "a",
      "br",
    ],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https"],
  });

  return applyCanonicalHtmlRepairs(sanitized, options).trim();
}

function assertArticleContentValid(content: string, allowed: string[]): void {
  const canonical = canonicalizeRichContentForStorage(content, {
    allowedSourceUrls: allowed,
  });
  assert.equal(containsMarkdownHrefValues(canonical), false);
  assert.equal(containsNestedAnchorTags(canonical), false);
  assert.equal(containsBackslashEscapedHtmlTags(canonical), false);
  assert.equal(containsEntityEscapedHtmlTags(canonical), false);
  assert.doesNotMatch(canonical, /javascript:/i);
}

describe("Phase 4 generated draft HTML validation pipeline", () => {
  it("passes clean canonical article content", () => {
    assertArticleContentValid(
      `<p>Maintain offline backups.</p><h2>Sources</h2><ul><li><a href="${CISA_URL}">CISA StopRansomware</a></li></ul>`,
      [CISA_URL],
    );
  });

  it("repairs escaped HTML before validation passes", () => {
    assertArticleContentValid("&lt;p&gt;Preparedness guidance.&lt;/p&gt;", [CISA_URL]);
  });

  it("repairs markdown source links in article content", () => {
    const canonical = canonicalizeRichContentForStorage(
      `<p>See [CISA guidance](${CISA_URL}) for details.</p>`,
      { allowedSourceUrls: [CISA_URL] },
    );
    assert.match(canonical, new RegExp(`href="${CISA_URL.replace(/\//g, "\\/")}"`));
  });

  it("repairs malformed allowed-source anchors in Sources section", () => {
    assertArticleContentValid(
      `<h2>Sources</h2><p><a href="Ransomware">${CISA_URL}">StopRansomware Guidance — CISA</a></p>`,
      [CISA_URL],
    );
  });

  it("flattens nested anchors with intervening markup", () => {
    assertArticleContentValid(
      `<p><a href="${CISA_URL}"><span><a href="${CISA_URL}">Nested source</a></span></a></p>`,
      [CISA_URL],
    );
  });

  it("passes Microsoft 365 phishing article with multiple catalog source links", () => {
    const microsoftUrl = "https://www.microsoft.com/security/blog/";
    const learnUrl = "https://learn.microsoft.com/en-us/security/";
    const cisaUrl = "https://www.cisa.gov/phishing";
    assertArticleContentValid(
      [
        "<p>Credential phishing against Microsoft 365 remains a top risk.</p>",
        "<h2>Reduce the risk</h2>",
        "<ul><li>Enable phishing-resistant MFA.</li><li>Review sign-in risk policies.</li></ul>",
        "<h2>Sources</h2>",
        "<ul>",
        `<li><a href="${microsoftUrl}">Microsoft Security Blog</a></li>`,
        `<li><a href="${learnUrl}">Microsoft Learn</a></li>`,
        `<li><a href="${cisaUrl}">CISA phishing guidance</a></li>`,
        "</ul>",
      ].join(""),
      [microsoftUrl, learnUrl, cisaUrl],
    );
  });

  it("strips stray article wrappers before validation", () => {
    const canonical = canonicalizeRichContentForStorage(
      `<article><p>Body</p><h2>Sources</h2><p><a href="${CISA_URL}">CISA</a></p></article>`,
      { allowedSourceUrls: [CISA_URL] },
    );
    assert.doesNotMatch(canonical, /<\/?article\b/i);
  });

  it("does not keep unknown source URLs clickable", () => {
    const canonical = canonicalizeRichContentForStorage(
      `<p><a href="https://evil.example/not-in-catalog">Unknown</a></p>`,
      { allowedSourceUrls: [CISA_URL] },
    );
    assert.doesNotMatch(canonical, /href="https:\/\/evil\.example/);
  });

  it("detects unrepaired markdown href corruption on raw model output", () => {
    const raw = `<p><a href="[${CISA_URL}](${CISA_URL})">Broken href</a></p>`;
    assert.equal(containsMarkdownHrefValues(raw), true);
  });

  it("does not invoke Phase 5, Phase 7, publish, image, or research from generation engine imports", () => {
    const source = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.doesNotMatch(
      source,
      /runAgentReview|runAgentReadinessEvaluation|publishAgentContent|runAgentFeaturedImageGeneration|runAgentResearch/i,
    );
    assert.match(source, /validateGeneratedDraftStructureDetailed/);
    assert.match(source, /sanitizeGeneratedRichFields/);
  });
});
