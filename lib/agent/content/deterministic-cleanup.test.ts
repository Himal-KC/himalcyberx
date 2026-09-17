import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { GeneratedDraft } from "../generation/types";
import type { ReviewDraftSnapshot } from "../review/types";

const testDir = dirname(fileURLToPath(import.meta.url));
type ArticleDraft = Extract<GeneratedDraft, { contentType: "article" }>;

const structureCore = (await import(
  pathToFileURL(join(testDir, "draft-structure-core.ts")).href
)) as typeof import("./draft-structure-core");

const altCore = (await import(
  pathToFileURL(join(testDir, "featured-image-alt-core.ts")).href
)) as typeof import("./featured-image-alt-core");

const cleanupCore = (await import(
  pathToFileURL(join(testDir, "deterministic-cleanup-core.ts")).href
)) as typeof import("./deterministic-cleanup-core");

const { evaluateAltTextQuality } = (await import(
  pathToFileURL(join(testDir, "../readiness/readiness-gate-core.ts")).href
)) as typeof import("../readiness/readiness-gate-core");

const { getCurrentDraftFingerprintFromSnapshot } = (await import(
  pathToFileURL(join(testDir, "../readiness/readiness-gate-core.ts")).href
)) as typeof import("../readiness/readiness-gate-core");

const engineSource = readFileSync(
  join(testDir, "deterministic-cleanup-engine.ts"),
  "utf8",
);

const TITLE =
  "How Organizations Can Reduce Microsoft 365 Phishing and Account Compromise Risk";
const SLUG =
  "how-organizations-can-reduce-microsoft-365-phishing-and-account-compromise-risk";
const FEATURED_URL = "https://example.com/articles/agent-featured.webp";

function buildArticleDraft(content: string): ArticleDraft {
  return {
    contentType: "article",
    title: TITLE,
    slug: SLUG,
    excerpt: "Excerpt long enough for validation.",
    content,
    keyTakeaways: ["Takeaway from draft metadata"],
    seo: {
      seoTitle: TITLE,
      seoDescription: "SEO description long enough for checks.",
      seoKeywords: ["phishing", "microsoft 365"],
      ogTitle: TITLE,
      ogDescription: "OG description long enough for checks.",
    },
    sourceMappings: [],
    internalLinks: [],
    warnings: [],
    categoryRecommendation: "Security",
    primaryKeyword: "phishing",
    secondaryKeywords: ["microsoft 365"],
    generationPlan: {
      contentAngle: "Phishing risk reduction",
      audience: "Security teams",
      intent: "Inform",
      sectionPlan: ["Overview", "Sources"],
    },
  } satisfies ArticleDraft;
}

function buildSnapshot(draft: ArticleDraft): ReviewDraftSnapshot {
  return {
    agentRunId: "00000000-0000-4000-8000-000000000001",
    contentId: "00000000-0000-4000-8000-000000000010",
    contentType: "article",
    status: "draft",
    publishedAt: null,
    title: draft.title,
    slug: draft.slug,
    draft,
    sourceMappings: [],
    internalLinks: [],
    generationWarnings: [],
    reviewFingerprintFields: null,
  };
}

describe("deterministic draft cleanup", () => {
  it("merges duplicate Key Takeaways into exactly one section", () => {
    const content = `<p>Intro</p>
<h2>Key Takeaways</h2><ul><li>First point</li></ul>
<h2>Key Takeaways</h2><ul><li>Second point</li></ul>`;

    const result = cleanupCore.applyArticleDeterministicCleanup({
      draft: buildArticleDraft(content),
      slug: SLUG,
      featuredImage: FEATURED_URL,
      featuredImageAlt: altCore.repairFeaturedImageAltText({
        title: TITLE,
        slug: SLUG,
        currentAlt: null,
        visualConcept: "Enterprise cloud email security environment",
        hasFeaturedImage: true,
      }),
      visualConcept: "Enterprise cloud email security environment",
    });

    assert.equal(structureCore.countKeyTakeawaysSections(result.draft.content), 1);
  });

  it("preserves unique takeaway list items safely", () => {
    const content = `<p>Intro</p>
<h2>Key Takeaways</h2><ul><li>Alpha</li><li>Beta</li></ul>
<h2>Key Takeaways</h2><ul><li>Gamma</li><li>Delta unique</li></ul>`;

    const result = cleanupCore.applyArticleDeterministicCleanup({
      draft: buildArticleDraft(content),
      slug: SLUG,
      featuredImage: FEATURED_URL,
      featuredImageAlt: altCore.repairFeaturedImageAltText({
        title: TITLE,
        slug: SLUG,
        currentAlt: null,
        visualConcept: "Enterprise cloud email security environment",
        hasFeaturedImage: true,
      }),
    });

    assert.match(result.draft.content, /<li>Alpha<\/li>/);
    assert.match(result.draft.content, /<li>Beta<\/li>/);
    assert.match(result.draft.content, /<li>Gamma<\/li>/);
    assert.match(result.draft.content, /<li>Delta unique<\/li>/);
    assert.equal(structureCore.countKeyTakeawaysSections(result.draft.content), 1);
  });

  it("is idempotent for structure cleanup", () => {
    const content = `<p>Intro</p>
<h2>Key Takeaways</h2><ul><li>One</li></ul>
<h2>Key Takeaways</h2><ul><li>Two</li></ul>`;
    const draft = buildArticleDraft(content);
    const first = cleanupCore.applyArticleDeterministicCleanup({
      draft,
      slug: SLUG,
      featuredImage: FEATURED_URL,
      featuredImageAlt: altCore.repairFeaturedImageAltText({
        title: TITLE,
        slug: SLUG,
        currentAlt: null,
        visualConcept: "Enterprise cloud email security environment",
        hasFeaturedImage: true,
      }),
    });
    const second = cleanupCore.applyArticleDeterministicCleanup({
      draft: first.draft,
      slug: SLUG,
      featuredImage: FEATURED_URL,
      featuredImageAlt: first.featuredImageAlt,
    });

    assert.equal(second.draft.content, first.draft.content);
    assert.equal(second.featuredImageAlt, first.featuredImageAlt);
  });

  it("leaves a single Key Takeaways section unchanged", () => {
    const content = `<p>Intro</p><h2>Key Takeaways</h2><ul><li>Only one</li></ul>`;
    const draft = buildArticleDraft(content);
    const result = cleanupCore.applyArticleDeterministicCleanup({
      draft,
      slug: SLUG,
      featuredImage: FEATURED_URL,
      featuredImageAlt: altCore.repairFeaturedImageAltText({
        title: TITLE,
        slug: SLUG,
        currentAlt: null,
        visualConcept: "Enterprise cloud email security environment",
        hasFeaturedImage: true,
      }),
    });

    assert.equal(result.draft.content.trim(), content.trim());
  });

  it("repairs slug-like alt text", () => {
    const badAlt = `${SLUG.replace(/-/g, " ")} editorial hero image`;
    const repaired = altCore.repairFeaturedImageAltText({
      title: TITLE,
      slug: SLUG,
      currentAlt: badAlt,
      visualConcept: "Enterprise cloud email security environment",
      hasFeaturedImage: true,
    });

    assert.ok(repaired);
    assert.doesNotMatch(repaired!, new RegExp(SLUG.replace(/-/g, " "), "i"));
  });

  it("repairs duplicated-title alt text", () => {
    const repaired = altCore.repairFeaturedImageAltText({
      title: TITLE,
      slug: SLUG,
      currentAlt: `${TITLE}: ${TITLE}`,
      visualConcept: "Enterprise cloud email security environment",
      hasFeaturedImage: true,
    });

    assert.ok(repaired);
    assert.notEqual(repaired!.toLowerCase(), TITLE.toLowerCase());
    assert.doesNotMatch(repaired!, new RegExp(`${TITLE}: ${TITLE}`));
  });

  it("repairs truncated alt text", () => {
    const repaired = altCore.repairFeaturedImageAltText({
      title: TITLE,
      slug: SLUG,
      currentAlt: "Wide editorial cybersecurity hero artwork depicting enterprise…",
      visualConcept: "Enterprise cloud email security environment",
      hasFeaturedImage: true,
    });

    assert.ok(repaired);
    assert.doesNotMatch(repaired!, /…|\.\.\.$/);
  });

  it("repaired alt passes the same Phase 7 validator", () => {
    const repaired = altCore.repairFeaturedImageAltText({
      title: TITLE,
      slug: SLUG,
      currentAlt: `${SLUG}: ${SLUG.replace(/-/g, " ")}…`,
      visualConcept: "Enterprise cloud email security environment",
      hasFeaturedImage: true,
    });

    assert.ok(repaired);
    assert.equal(
      altCore.featuredImageAltPassesPhase7Quality({
        altText: repaired,
        title: TITLE,
        slug: SLUG,
        hasFeaturedImage: true,
      }),
      true,
    );
    assert.deepEqual(evaluateAltTextQuality({
      altText: repaired,
      title: TITLE,
      slug: SLUG,
      hasFeaturedImage: true,
    }), []);
  });

  it("cleanup clears Phase 7 structure and alt-text quality findings", () => {
    const content = `<p>${"Body copy. ".repeat(40)}</p>
<h2>Key Takeaways</h2><ul><li>One</li></ul>
<h2>Key Takeaways</h2><ul><li>Two</li></ul>`;
    const cleaned = cleanupCore.applyArticleDeterministicCleanup({
      draft: buildArticleDraft(content),
      slug: SLUG,
      featuredImage: FEATURED_URL,
      featuredImageAlt: altCore.repairFeaturedImageAltText({
        title: TITLE,
        slug: SLUG,
        currentAlt: `${SLUG.replace(/-/g, " ")}…`,
        visualConcept: "Enterprise cloud email security environment",
        hasFeaturedImage: true,
      }),
    });

    assert.equal(structureCore.countKeyTakeawaysSections(cleaned.draft.content), 1);
    assert.deepEqual(
      evaluateAltTextQuality({
        altText: cleaned.featuredImageAlt,
        title: TITLE,
        slug: SLUG,
        hasFeaturedImage: true,
      }),
      [],
    );
  });

  it("does not invoke image generation in deterministic cleanup engine", () => {
    assert.doesNotMatch(engineSource, /runAgentFeaturedImageGeneration/);
    assert.doesNotMatch(engineSource, /generateFeaturedImage/);
  });

  it("does not invoke research in deterministic cleanup engine", () => {
    assert.doesNotMatch(engineSource, /runAgentResearch/);
  });

  it("does not publish or email from deterministic cleanup engine", () => {
    assert.doesNotMatch(engineSource, /runAgentContentPublication/);
    assert.doesNotMatch(engineSource, /notify_subscribers/);
  });

  it("keeps featured image URL unchanged when saving cleanup payload", () => {
    const revisionSaveSource = readFileSync(
      join(testDir, "../review/revision-save-core.ts"),
      "utf8",
    );
    assert.match(revisionSaveSource, /featured_image: input\.existingRow\.featured_image/);
    assert.doesNotMatch(engineSource, /generateFeaturedImage/);
  });

  it("changes draft fingerprint when body cleanup changes content", () => {
    const draft = buildArticleDraft(
      `<p>${"Body copy. ".repeat(20)}</p><h2>Key Takeaways</h2><ul><li>A</li></ul><h2>Key Takeaways</h2><ul><li>B</li></ul>`,
    );
    const before = getCurrentDraftFingerprintFromSnapshot(buildSnapshot(draft));
    const cleaned = cleanupCore.applyArticleDeterministicCleanup({
      draft,
      slug: SLUG,
      featuredImage: FEATURED_URL,
      featuredImageAlt: altCore.repairFeaturedImageAltText({
        title: TITLE,
        slug: SLUG,
        currentAlt: null,
        visualConcept: "Enterprise cloud email security environment",
        hasFeaturedImage: true,
      }),
    });
    const after = getCurrentDraftFingerprintFromSnapshot(buildSnapshot(cleaned.draft));
    assert.notEqual(before, after);
  });

  it("does not call OpenAI revision helpers in deterministic cleanup engine", () => {
    assert.doesNotMatch(engineSource, /reviseDraftWithOpenAi/);
    assert.doesNotMatch(engineSource, /runPhase5AutomaticSafeRevision/);
  });
});
