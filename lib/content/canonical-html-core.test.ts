import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  applyCanonicalHtmlRepairs,
  containsBackslashEscapedHtmlTags,
  containsMarkdownHrefValues,
  containsNestedAnchorTags,
  flattenNestedAnchorTags,
  looksLikeRichHtml,
  normalizeAnchorHrefValue,
  recoverEscapedHtmlMarkup,
  unwrapBlockElementsFromParagraphs,
} = (await import(
  pathToFileURL(join(testDir, "canonical-html-repair-core.ts")).href
)) as typeof import("./canonical-html-repair-core");

import sanitizeHtml from "sanitize-html";

function sanitizeForTests(html: string): string {
  return sanitizeHtml(html, {
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
}

function canonicalizeRichContentForStorage(
  content: string,
  options?: { allowedSourceUrls?: readonly string[] },
): string {
  const repaired = applyCanonicalHtmlRepairs(content, options);
  if (!looksLikeRichHtml(repaired)) {
    return repaired;
  }

  const sanitized = sanitizeForTests(repaired);
  return flattenNestedAnchorTags(
    applyCanonicalHtmlRepairs(sanitized, options),
  ).trim();
}

const CISA_URL =
  "https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-243a";

describe("canonical article body HTML", () => {
  it("preserves normal paragraph HTML through canonicalization", () => {
    const input = "<p>Preparedness guidance for holidays.</p>";
    const output = canonicalizeRichContentForStorage(input);
    assert.equal(output, input);
  });

  it("preserves h2, paragraph, and list structure", () => {
    const input =
      "<h2>Overview</h2><p>Summary.</p><ul><li>Item one</li><li>Item two</li></ul>";
    const output = canonicalizeRichContentForStorage(input);
    assert.match(output, /<h2>Overview<\/h2>/);
    assert.match(output, /<ul>/);
    assert.match(output, /<li>Item one<\/li>/);
  });

  it("preserves strong tags", () => {
    const input = "<p><strong>Important</strong> guidance.</p>";
    const output = canonicalizeRichContentForStorage(input);
    assert.match(output, /<strong>Important<\/strong>/);
  });

  it("preserves verified anchor href with exact URL", () => {
    const input = `<p><a href="${CISA_URL}">Ransomware Awareness for Holidays and Weekends</a></p>`;
    const output = canonicalizeRichContentForStorage(input, {
      allowedSourceUrls: [CISA_URL],
    });
    assert.match(output, new RegExp(`href="${CISA_URL.replace(/\//g, "\\/")}"`));
    assert.match(output, />Ransomware Awareness for Holidays and Weekends</);
  });

  it("rejects markdown syntax as href values", () => {
    const markdownHref = `[${CISA_URL}](${CISA_URL})`;
    const normalized = normalizeAnchorHrefValue(markdownHref, [CISA_URL]);
    assert.equal(normalized, CISA_URL);
    assert.doesNotMatch(normalized ?? "", /^\[/);
  });

  it("repairs nested anchor tags", () => {
    const input = `<p><a href="${CISA_URL}"><a href="${CISA_URL}">Nested</a></a></p>`;
    const output = flattenNestedAnchorTags(input);
    assert.equal(containsNestedAnchorTags(output), false);
    assert.match(output, />Nested</);
  });

  it("recovers backslash-escaped HTML before persistence", () => {
    const escaped = String.raw`\<p>Recovered paragraph.\</p>`;
    assert.equal(containsBackslashEscapedHtmlTags(escaped), true);
    const output = recoverEscapedHtmlMarkup(escaped);
    assert.match(output, /^<p>Recovered paragraph\.<\/p>$/);
  });

  it("unwraps block HTML incorrectly wrapped in paragraph tags", () => {
    const input = "<p><h2>Section</h2></p><p>Body copy.</p>";
    const output = unwrapBlockElementsFromParagraphs(input);
    assert.match(output, /^<h2>Section<\/h2><p>Body copy\.<\/p>$/);
  });

  it("aligns Phase 5 review body with canonical CMS content", () => {
    const dbContent = "&lt;p&gt;Canonical body.&lt;/p&gt;";
    const reviewBody = canonicalizeRichContentForStorage(dbContent);
    assert.equal(reviewBody, "<p>Canonical body.</p>");
  });

  it("keeps semantic fingerprint normalization compatible with canonical HTML", () => {
    const semantic = (html: string) =>
      html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const a = semantic(canonicalizeRichContentForStorage("<p>Same text.</p>"));
    const b = semantic("<p><strong>Same</strong> text.</p>");
    assert.equal(a, b);
  });

  it("uses prepareRichContentForSave on manual article updates", () => {
    const source = readFileSync(
      join(testDir, "../actions/articles.ts"),
      "utf8",
    );
    assert.match(source, /content: prepareRichContentForSave\(input\.content\)/);
  });

  it("serializes Phase 5 review context with canonical bodyHtml", () => {
    const source = readFileSync(
      join(testDir, "../agent/review/build-context-core.ts"),
      "utf8",
    );
    assert.match(source, /bodyHtml: resolveReviewBodyHtmlFromSnapshot/);
    assert.doesNotMatch(source, /body: context\.draftSnapshot\.draft/);
  });

  it("uses the same canonical boundary for generated draft save preparation", () => {
    const prepared = canonicalizeRichContentForStorage(
      `[CISA advisory](${CISA_URL})`,
    );
    assert.match(prepared, new RegExp(`href="${CISA_URL.replace(/\//g, "\\/")}"`));
  });

  it("loads tutorial and lab rich fields through the same canonical boundary", () => {
    const source = readFileSync(
      join(testDir, "../agent/review/load-draft.ts"),
      "utf8",
    );
    assert.match(source, /canonicalizeTutorialRow/);
    assert.match(source, /canonicalizeLabRow/);
  });

  it("rejects disallowed source URLs during agent canonicalization", () => {
    const output = canonicalizeRichContentForStorage(
      `<p><a href="${CISA_URL}">CISA</a></p>`,
      { allowedSourceUrls: ["https://example.com/other"] },
    );
    assert.doesNotMatch(output, /href=/);
    assert.match(output, />CISA</);
  });

  it("sanitizes scripts and event handlers", () => {
    const output = canonicalizeRichContentForStorage(
      '<p>Safe</p><script>alert(1)</script><p onclick="x">Bad</p>',
    );
    assert.doesNotMatch(output, /<script/i);
    assert.doesNotMatch(output, /onclick/i);
  });

  it("does not require research or OpenAI for HTML repair", () => {
    const source = readFileSync(join(testDir, "canonical-html-core.ts"), "utf8");
    assert.doesNotMatch(source, /openai|tavily|runAgentResearch/i);
  });

  it("does not trigger publish or email side effects", () => {
    const saveSource = readFileSync(join(testDir, "sanitize-on-save.ts"), "utf8");
    assert.doesNotMatch(saveSource, /publishAgentContent|notifySubscriber/i);
  });

  it("detects markdown href corruption patterns", () => {
    const broken = `<a href="[${CISA_URL}](${CISA_URL})">Title</a>`;
    assert.equal(containsMarkdownHrefValues(broken), true);
    const fixed = canonicalizeRichContentForStorage(broken, {
      allowedSourceUrls: [CISA_URL],
    });
    assert.equal(containsMarkdownHrefValues(fixed), false);
  });

  it("uses the same canonical HTML at public render time", () => {
    const source = readFileSync(
      join(testDir, "../../components/content/RichContentRenderer.tsx"),
      "utf8",
    );
    assert.match(source, /canonicalizeRichContentForStorage\(content\)/);
  });
});
