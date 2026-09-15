import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const MAX_ARTICLE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_ARTICLE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const testDir = dirname(fileURLToPath(import.meta.url));

const {
  buildAgentFeaturedImageStoragePath,
  buildAgentRunImageMetadataUpdate,
  buildFeaturedImageAltText,
  buildFeaturedImagePrompt,
  buildImagePromptContext,
  buildLinkedContentImageAttachUpdate,
  calculateCenterCropRegion,
  contentTableForImageAttach,
  evaluateImageGenerationEligibility,
  isAgentGeneratedStoragePath,
  isGptImage2Family,
  listDisallowedImageAttachFields,
  promptContainsSecretLikeContent,
  promptIncludesSafetyInstructions,
  resolveOpenAiImageSize,
  storageFolderForContentType,
  summarizeResearchForImagePrompt,
  validateFeaturedImageMetadata,
  assertImageAttachPayloadSafe,
} = (await import(pathToFileURL(join(testDir, "image-core.ts")).href)) as typeof import("./image-core");

const { diagnosticsContainSecrets } = (await import(
  pathToFileURL(join(testDir, "image-log-core.ts")).href
)) as typeof import("./image-log-core");

const { FEATURED_IMAGE_HEIGHT, FEATURED_IMAGE_WIDTH } = (await import(
  pathToFileURL(join(testDir, "image-core.ts")).href
)) as typeof import("./image-core");

const VALID_RUN_ID = "00000000-0000-4000-8000-000000000001";

function buildPromptContext() {
  return buildImagePromptContext({
    contentType: "article",
    topic: "Passkeys for phishing-resistant authentication",
    title: "Passkeys in Enterprise Identity",
    description: "How device-bound credentials reduce phishing risk.",
    contentAngle: "Device-bound authentication replacing passwords",
    primaryKeyword: "passkeys",
    researchSummary: summarizeResearchForImagePrompt([
      "Passkeys bind credentials to devices.",
      "Phishing-resistant authentication reduces account takeover.",
    ]),
    reviewSummary: "Draft is grounded and ready for editorial review.",
  });
}

describe("Agent featured image core", () => {
  it("builds article, tutorial, and lab attachment updates", () => {
    const update = buildLinkedContentImageAttachUpdate({
      featuredImage: "https://example.com/articles/agent.webp",
      featuredImageAlt: "Editorial cybersecurity artwork depicting passkeys.",
    });

    assert.equal(update.featured_image, "https://example.com/articles/agent.webp");
    assert.equal(
      update.featured_image_alt,
      "Editorial cybersecurity artwork depicting passkeys.",
    );
    assert.deepEqual(listDisallowedImageAttachFields(update), []);
    assert.equal(contentTableForImageAttach("article"), "articles");
    assert.equal(contentTableForImageAttach("tutorial"), "tutorials");
    assert.equal(contentTableForImageAttach("lab"), "labs");
  });

  it("validates exact 1536x864 output and rejects invalid dimensions", () => {
    const valid = validateFeaturedImageMetadata({
      width: FEATURED_IMAGE_WIDTH,
      height: FEATURED_IMAGE_HEIGHT,
      mimeType: "image/webp",
      byteSize: 1024,
      maxBytes: MAX_ARTICLE_IMAGE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_ARTICLE_IMAGE_TYPES,
    });
    assert.equal(valid.valid, true);

    const invalid = validateFeaturedImageMetadata({
      width: 1536,
      height: 1024,
      mimeType: "image/webp",
      byteSize: 1024,
      maxBytes: MAX_ARTICLE_IMAGE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_ARTICLE_IMAGE_TYPES,
    });
    assert.equal(invalid.valid, false);
    if (!invalid.valid) {
      assert.equal(invalid.errorCode, "IMAGE_DIMENSION_INVALID");
    }
  });

  it("rejects unsupported MIME types and oversize files", () => {
    const mimeInvalid = validateFeaturedImageMetadata({
      width: FEATURED_IMAGE_WIDTH,
      height: FEATURED_IMAGE_HEIGHT,
      mimeType: "image/gif",
      byteSize: 1024,
      maxBytes: MAX_ARTICLE_IMAGE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_ARTICLE_IMAGE_TYPES,
    });
    assert.equal(mimeInvalid.valid, false);
    if (!mimeInvalid.valid) {
      assert.equal(mimeInvalid.errorCode, "IMAGE_MIME_INVALID");
    }

    const tooLarge = validateFeaturedImageMetadata({
      width: FEATURED_IMAGE_WIDTH,
      height: FEATURED_IMAGE_HEIGHT,
      mimeType: "image/webp",
      byteSize: MAX_ARTICLE_IMAGE_SIZE_BYTES + 1,
      maxBytes: MAX_ARTICLE_IMAGE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_ARTICLE_IMAGE_TYPES,
    });
    assert.equal(tooLarge.valid, false);
    if (!tooLarge.valid) {
      assert.equal(tooLarge.errorCode, "IMAGE_TOO_LARGE");
    }
  });

  it("uses safe agent storage paths and provenance checks", () => {
    const path = buildAgentFeaturedImageStoragePath("articles", VALID_RUN_ID, 1234567890);
    assert.equal(path, `articles/agent-${VALID_RUN_ID}-1234567890.webp`);
    assert.equal(isAgentGeneratedStoragePath(path, VALID_RUN_ID), true);
    assert.equal(
      isAgentGeneratedStoragePath("articles/manual-upload.webp", VALID_RUN_ID),
      false,
    );
    assert.equal(storageFolderForContentType("tutorial"), "tutorials");
    assert.equal(storageFolderForContentType("lab"), "labs");
  });

  it("allows PASS and NEEDS_REVIEW reviews and blocks missing or FAIL reviews", () => {
    assert.equal(
      evaluateImageGenerationEligibility({
        hasReview: true,
        reviewStatus: "pass",
      }).allowed,
      true,
    );
    assert.equal(
      evaluateImageGenerationEligibility({
        hasReview: true,
        reviewStatus: "needs_review",
      }).allowed,
      true,
    );

    const missing = evaluateImageGenerationEligibility({
      hasReview: false,
      reviewStatus: null,
    });
    assert.equal(missing.allowed, false);
    if (!missing.allowed) {
      assert.equal(missing.errorCode, "REVIEW_REQUIRED");
    }

    const failed = evaluateImageGenerationEligibility({
      hasReview: true,
      reviewStatus: "fail",
    });
    assert.equal(failed.allowed, false);
    if (!failed.allowed) {
      assert.equal(failed.errorCode, "REVIEW_FAILED");
    }
  });

  it("updates only image attach fields and leaves other fields out of payload", () => {
    const payload = buildLinkedContentImageAttachUpdate({
      featuredImage: "https://example.com/image.webp",
      featuredImageAlt: "Alt text",
    });
    const safety = assertImageAttachPayloadSafe(payload as Record<string, unknown>);
    assert.equal(safety.safe, true);
    assert.deepEqual(Object.keys(payload).sort(), [
      "featured_image",
      "featured_image_alt",
    ]);
  });

  it("preserves old image metadata and only appends agent image provenance", () => {
    const metadata = buildAgentRunImageMetadataUpdate({
      existingMetadata: {
        sourceMappings: [{ sectionKey: "intro", claim: "Claim", sourceUrls: [] }],
      },
      storagePath: `articles/agent-${VALID_RUN_ID}-123.webp`,
      publicUrl: "https://example.com/articles/agent.webp",
    });

    assert.ok(Array.isArray(metadata.agentFeaturedImages));
    assert.ok(metadata.latestFeaturedImage);
    assert.ok(metadata.sourceMappings);
  });

  it("builds topic-specific prompts with safety instructions and no secret-like content", () => {
    const context = buildPromptContext();
    const prompt = buildFeaturedImagePrompt(context);

    assert.match(prompt, /Passkeys in Enterprise Identity/);
    assert.match(prompt, /device-bound authentication/i);
    assert.equal(promptIncludesSafetyInstructions(prompt), true);
    assert.equal(promptContainsSecretLikeContent(prompt), false);
    assert.equal(prompt.includes(VALID_RUN_ID), false);
  });

  it("builds reasonable alt text without starting with Image of", () => {
    const alt = buildFeaturedImageAltText({
      visualConcept: "Device-bound authentication replacing passwords",
      topic: "Passkeys for phishing-resistant authentication",
    });

    assert.ok(alt.length >= 40);
    assert.ok(alt.length <= 160);
    assert.equal(/^image of/i.test(alt), false);
  });

  it("resolves native OpenAI sizes by model family", () => {
    assert.equal(resolveOpenAiImageSize("gpt-image-1.5"), "1536x1024");
    assert.equal(resolveOpenAiImageSize("gpt-image-2"), "1536x864");
    assert.equal(isGptImage2Family("gpt-image-2.5-flare"), true);
    assert.equal(isGptImage2Family("gpt-image-1.5"), false);
  });

  it("calculates center crop regions for landscape normalization", () => {
    const crop = calculateCenterCropRegion(1536, 1024);
    assert.equal(crop.width, 1536);
    assert.equal(crop.height, 864);
    assert.equal(crop.top, 80);
    assert.equal(crop.left, 0);
  });

  it("keeps diagnostics free of secrets and base64 payloads", () => {
    assert.equal(
      diagnosticsContainSecrets({
        checkpoint: "image_model_success",
        model: "gpt-image-1.5",
      }),
      false,
    );
    assert.equal(
      diagnosticsContainSecrets({
        prompt: "data:image/png;base64,abc",
      }),
      true,
    );
  });
});

describe("Agent featured image engine boundaries", () => {
  it("uses a dedicated image rate-limit scope", () => {
    const rateLimitSource = readFileSync(
      join(testDir, "../../rate-limit/index.ts"),
      "utf8",
    );
    assert.match(rateLimitSource, /"agent-image-generation"/);
    assert.match(rateLimitSource, /requests: 3, window: "30 m"/);
  });

  it("does not expose OpenAI or service-role credentials in the action layer", () => {
    const actionSource = readFileSync(
      join(testDir, "../../actions/agent.ts"),
      "utf8",
    );
    assert.match(actionSource, /generateAgentFeaturedImage/);
    assert.match(actionSource, /getAuthenticatedServerClient\("generateAgentFeaturedImage"\)/);
    assert.match(actionSource, /runAgentFeaturedImageGeneration/);
    assert.equal(actionSource.includes("NEXT_PUBLIC_OPENAI_API_KEY"), false);
    assert.equal(actionSource.includes("service_role"), false);
  });

  it("uses server-side OpenAI generation and buffer upload only", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.match(engineSource, /generateFeaturedImageWithOpenAi/);
    assert.match(engineSource, /uploadImageBuffer/);
    assert.match(engineSource, /processFeaturedImageBuffer/);
    assert.match(engineSource, /activeImageGenerations/);
    assert.equal(engineSource.includes("runAgentResearch"), false);
    assert.equal(engineSource.includes("runAgentGeneration"), false);
    assert.equal(engineSource.includes("runAgentReview"), false);
    assert.equal(engineSource.includes("publishArticle"), false);
    assert.equal(engineSource.includes("publishTutorial"), false);
  });

  it("restores safe stage after failures and deletes only agent-generated paths", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.match(engineSource, /stage: "fact_check"/);
    assert.match(engineSource, /isAgentGeneratedStoragePath/);
    assert.match(engineSource, /deleteArticleImage/);
    assert.match(engineSource, /previousStoragePath/);
  });

  it("validates linked draft ownership before attach", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.match(engineSource, /validateContentBelongsToRun/);
    assert.match(engineSource, /\.eq\("agent_run_id", trimmedRunId\)/);
  });

  it("supports resumed workflow through dedicated UI and resume payload", () => {
    const resumeSource = readFileSync(
      join(testDir, "../resume/resume-run.ts"),
      "utf8",
    );
    assert.match(resumeSource, /featured_image/);
    assert.match(resumeSource, /featuredImage:/);

    const panelSource = readFileSync(
      join(testDir, "../../../components/admin/agent/AgentFeaturedImagePanel.tsx"),
      "utf8",
    );
    assert.match(panelSource, /Phase 6 — Featured Image/);
    assert.match(panelSource, /generateAgentFeaturedImage/);
  });

  it("configures HCX_IMAGE_MODEL server-side with webp output", () => {
    const configSource = readFileSync(
      join(testDir, "../openai/config.ts"),
      "utf8",
    );
    assert.match(configSource, /HCX_IMAGE_MODEL/);
    assert.match(configSource, /HCX_IMAGE_OUTPUT_FORMAT/);
    assert.match(configSource, /gpt-image-2/);
  });
});

describe("Agent featured image failure preservation contracts", () => {
  it("documents rollback points for model, processing, upload, and attach failures", () => {
    const engineSource = readFileSync(join(testDir, "engine.ts"), "utf8");
    assert.match(engineSource, /IMAGE_MODEL_ERROR/);
    assert.match(engineSource, /processed\.errorCode/);
    assert.match(engineSource, /IMAGE_UPLOAD_FAILED/);
    assert.match(engineSource, /IMAGE_ATTACH_FAILED/);
    assert.match(engineSource, /previousImageUrl/);
    assert.match(engineSource, /if \(!generated\.ok\)/);
    assert.match(engineSource, /if \(!processed\.ok\)/);
    assert.match(engineSource, /if \(!uploaded\.data/);
    assert.match(engineSource, /if \(attachError\)/);
  });

  it("uses safe trace checkpoints without logging full prompts or base64", () => {
    const logSource = readFileSync(join(testDir, "image-log-core.ts"), "utf8");
    assert.match(logSource, /image_start/);
    assert.match(logSource, /image_complete/);
    assert.match(logSource, /sanitizePromptForLogging/);
    assert.match(logSource, /diagnosticsContainSecrets/);
  });
});
