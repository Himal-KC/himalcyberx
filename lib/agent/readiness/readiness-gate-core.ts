import { createHash } from "node:crypto";
import type { GroundingAuditResult } from "../generation/types";
import type { Phase5HumanReviewAcceptanceRecord } from "../review/human-acceptance-core";
import type { AgentReviewRecord, ReviewDraftSnapshot, SolReviewOutput } from "../review/types";
import type {
  PersistedReadinessResult,
  ReadinessChecksSummary,
  ReadinessIssue,
  ReadinessStatus,
} from "./types";

// Mirror quality-gate-core materiality helpers — keep definitions identical.
const MATERIAL_STATUSES = new Set(["unsupported", "conflicting"]);

const CRITICAL_SEVERITIES = new Set(["critical", "major"]);

const CRITICAL_CLAIM_TYPES = new Set([
  "cve_id",
  "cvss",
  "kev_status",
  "patch_id",
  "exploitation",
  "security_impact",
]);

function hasMaterialUnsupportedFinding(review: { findings: SolReviewOutput["findings"] }): boolean {
  return review.findings.some(
    (finding) =>
      MATERIAL_STATUSES.has(finding.status) &&
      (CRITICAL_SEVERITIES.has(finding.severity) ||
        CRITICAL_CLAIM_TYPES.has(finding.claimType)),
  );
}

function hasMaterialConflictingFinding(review: { findings: SolReviewOutput["findings"] }): boolean {
  return review.findings.some(
    (finding) =>
      finding.status === "conflicting" &&
      (CRITICAL_SEVERITIES.has(finding.severity) ||
        CRITICAL_CLAIM_TYPES.has(finding.claimType)),
  );
}

function isPhase5HumanAcceptanceCurrentlyValid(input: {
  acceptance: Phase5HumanReviewAcceptanceRecord | null;
  agentRunId: string;
  review: AgentReviewRecord | null;
  currentDraftFingerprint: string;
}): boolean {
  if (!input.acceptance || !input.review) {
    return false;
  }

  if (input.acceptance.agentRunId !== input.agentRunId) {
    return false;
  }

  if (input.acceptance.agentReviewId !== input.review.id) {
    return false;
  }

  if (input.acceptance.draftFingerprint !== input.currentDraftFingerprint) {
    return false;
  }

  if (input.review.draftFingerprint !== input.currentDraftFingerprint) {
    return false;
  }

  return true;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function buildDraftFingerprint(snapshot: ReviewDraftSnapshot): string {
  const payload = snapshot.reviewFingerprintFields
    ? {
        contentId: snapshot.contentId,
        contentType: snapshot.contentType,
        agentRunId: snapshot.agentRunId,
        fields: snapshot.reviewFingerprintFields,
      }
    : {
        contentId: snapshot.contentId,
        contentType: snapshot.contentType,
        title: snapshot.title,
        slug: snapshot.slug,
        draft: snapshot.draft,
        sourceMappings: snapshot.sourceMappings,
        internalLinks: snapshot.internalLinks,
        generationWarnings: snapshot.generationWarnings,
      };

  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export function getCurrentDraftFingerprintFromSnapshot(
  snapshot: ReviewDraftSnapshot,
): string {
  return buildDraftFingerprint(snapshot);
}

function stripRichHtml(content: string): string {
  return content
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function getRichContentTextLength(content: string): number {
  return stripRichHtml(content).length;
}

function getArticleContentTextLength(content: string): number {
  return getRichContentTextLength(content);
}

function resolveArticleSeo(source: {
  title: string;
  excerpt: string;
  seo_title?: string | null;
  seo_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  featured_image_alt?: string | null;
}) {
  const metaTitle = source.seo_title?.trim() || source.title.trim();
  const metaDescription = source.seo_description?.trim() || source.excerpt.trim();
  const ogTitle =
    source.og_title?.trim() || source.seo_title?.trim() || source.title.trim();
  const ogDescription =
    source.og_description?.trim() ||
    source.seo_description?.trim() ||
    source.excerpt.trim();
  const imageAlt = source.featured_image_alt?.trim() || source.title.trim();

  return {
    metaTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    imageAlt,
    usesTitleFallback: !source.seo_title?.trim(),
    usesExcerptFallback: !source.seo_description?.trim(),
    usesOgTitleFallback: !source.og_title?.trim(),
    usesOgDescriptionFallback: !source.og_description?.trim(),
    usesImageAltFallback: !source.featured_image_alt?.trim(),
  };
}

export interface ReadinessArticleContent {
  contentType: "article";
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string | null;
  categoryId: string | null;
  status: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  factCheckStatus: string | null;
}

export interface ReadinessTutorialContent {
  contentType: "tutorial";
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string | null;
  difficulty: string | null;
  estimatedTime: string | null;
  requirements: string | null;
  introduction: string | null;
  instructions: string | null;
  keyTakeaways: string | null;
  securityNotes: string | null;
  status: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  factCheckStatus: string | null;
}

export interface ReadinessLabContent {
  contentType: "lab";
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string | null;
  difficulty: string | null;
  estimatedTime: string | null;
  learningObjectives: string | null;
  requirementsTools: string | null;
  introduction: string | null;
  instructions: string | null;
  expectedResult: string | null;
  securityNotes: string | null;
  status: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  factCheckStatus: string | null;
}

export type ReadinessContentRow =
  | ReadinessArticleContent
  | ReadinessTutorialContent
  | ReadinessLabContent;

export interface ReadinessImageMetadata {
  storagePath: string;
  publicUrl: string;
  attachedAt: string;
  width?: number;
  height?: number;
  mimeType?: string;
  byteSize?: number;
}

export interface EvaluateReadinessGateInput {
  content: ReadinessContentRow;
  review: AgentReviewRecord | null;
  currentDraftFingerprint: string;
  groundingAudit: GroundingAuditResult;
  invalidSourceUrls: string[];
  invalidInternalLinks: string[];
  latestFeaturedImage: ReadinessImageMetadata | null;
  categoriesAvailable: boolean;
  phase5HumanAcceptance: Phase5HumanReviewAcceptanceRecord | null;
}

export interface EvaluateReadinessGateResult {
  status: ReadinessStatus;
  readinessScore: number;
  issues: ReadinessIssue[];
  checks: ReadinessChecksSummary;
  passedChecks: string[];
}

function evaluateDeterministicSourceIntegrity(input: {
  invalidSourceUrls: string[];
}): { passed: boolean; issues: string[] } {
  return {
    passed: input.invalidSourceUrls.length === 0,
    issues: [...input.invalidSourceUrls],
  };
}

function evaluateDeterministicInternalLinkIntegrity(input: {
  invalidInternalLinks: string[];
  internalLinkUnsupportedClaims: string[];
}): { passed: boolean; issues: string[] } {
  const issues = [
    ...input.invalidInternalLinks,
    ...input.internalLinkUnsupportedClaims,
  ];

  return {
    passed: issues.length === 0,
    issues,
  };
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FEATURED_IMAGE_WIDTH = 1536;
const FEATURED_IMAGE_HEIGHT = 864;

function isValidContentSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export const READINESS_SCORE_WEIGHTS = {
  factualReview: 30,
  cms: 20,
  sourceTransparency: 15,
  seo: 15,
  imageAlt: 10,
  structure: 5,
  internalLinks: 5,
} as const;

function issue(
  code: string,
  severity: ReadinessIssue["severity"],
  category: ReadinessIssue["category"],
  message: string,
  recommendedAction: string,
): ReadinessIssue {
  return { code, severity, category, message, recommendedAction };
}

export function resolveReadinessStatus(issues: ReadinessIssue[]): ReadinessStatus {
  if (issues.some((entry) => entry.severity === "blocking")) {
    return "BLOCKED";
  }

  if (issues.some((entry) => entry.severity === "warning")) {
    return "NEEDS_REVIEW";
  }

  return "READY_TO_PUBLISH";
}

export function evaluateAltTextQuality(input: {
  altText: string | null;
  title: string;
  slug: string;
  hasFeaturedImage: boolean;
}): ReadinessIssue[] {
  if (!input.hasFeaturedImage) {
    return [];
  }

  const alt = input.altText?.trim() ?? "";
  const issues: ReadinessIssue[] = [];

  if (!alt) {
    issues.push(
      issue(
        "ALT_TEXT_MISSING",
        "blocking",
        "alt_text",
        "Featured image alt text is missing.",
        "Add descriptive alt text for the featured image.",
      ),
    );
    return issues;
  }

  if (/^image of/i.test(alt)) {
    issues.push(
      issue(
        "ALT_TEXT_PREFIX_IMAGE_OF",
        "warning",
        "alt_text",
        "Alt text starts with “Image of”.",
        "Rewrite the alt text as a direct description without the prefix.",
      ),
    );
  }

  if (/\.webp$|\.jpg$|\.png$/i.test(alt) || alt.includes("/storage/")) {
    issues.push(
      issue(
        "ALT_TEXT_FILENAME",
        "warning",
        "alt_text",
        "Alt text appears to contain a filename or storage path.",
        "Replace it with a meaningful description of the artwork.",
      ),
    );
  }

  const normalizedSlug = input.slug.replace(/-/g, " ").toLowerCase();
  if (normalizedSlug.length >= 8 && alt.toLowerCase().includes(normalizedSlug)) {
    issues.push(
      issue(
        "ALT_TEXT_RAW_SLUG",
        "warning",
        "alt_text",
        "Alt text appears to reuse the raw slug.",
        "Describe what is visually represented instead of repeating the slug.",
      ),
    );
  }

  if (alt.endsWith("…") || alt.endsWith("...")) {
    issues.push(
      issue(
        "ALT_TEXT_TRUNCATED",
        "warning",
        "alt_text",
        "Alt text appears truncated.",
        "Rewrite the alt text as a complete phrase within about 80–160 characters.",
      ),
    );
  }

  if (alt.length < 40) {
    issues.push(
      issue(
        "ALT_TEXT_TOO_SHORT",
        "warning",
        "alt_text",
        "Alt text is very short.",
        "Expand the alt text so it meaningfully describes the featured artwork.",
      ),
    );
  }

  if (alt.length > 180) {
    issues.push(
      issue(
        "ALT_TEXT_TOO_LONG",
        "warning",
        "alt_text",
        "Alt text is longer than recommended.",
        "Shorten the alt text to a concise 80–160 character description.",
      ),
    );
  }

  const words = alt.toLowerCase().split(/\s+/);
  const repeated = words.find(
    (word, index) => word.length > 4 && words.indexOf(word) !== index,
  );
  if (repeated) {
    issues.push(
      issue(
        "ALT_TEXT_KEYWORD_STUFFING",
        "warning",
        "alt_text",
        "Alt text repeats keywords unnaturally.",
        "Use natural language instead of repeating the same keyword.",
      ),
    );
  }

  return issues;
}

function checkReviewAndFactual(input: EvaluateReadinessGateInput): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];

  if (!input.review) {
    issues.push(
      issue(
        "PHASE5_REVIEW_MISSING",
        "blocking",
        "review",
        "No Phase 5 review exists for this draft.",
        "Run the independent Phase 5 review before checking publication readiness.",
      ),
    );
    return issues;
  }

  if (input.review.status === "fail") {
    issues.push(
      issue(
        "PHASE5_REVIEW_FAIL",
        "blocking",
        "review",
        "The latest Phase 5 review status is FAIL.",
        "Resolve review failures or regenerate and rerun Phase 5 before publishing.",
      ),
    );
  }

  if (input.content.factCheckStatus === "failed") {
    issues.push(
      issue(
        "FACT_CHECK_FAILED",
        "blocking",
        "factual",
        "Draft fact-check status is failed.",
        "Resolve factual review failures before publishing.",
      ),
    );
  }

  if (input.review.draftFingerprint !== input.currentDraftFingerprint) {
    issues.push(
      issue(
        "REVIEW_STALE",
        "warning",
        "review",
        "The draft changed after the latest Phase 5 review.",
        "Rerun the independent Phase 5 review after editing the draft.",
      ),
    );
  }

  if (input.review.status === "needs_review") {
    const acceptanceValid = isPhase5HumanAcceptanceCurrentlyValid({
      acceptance: input.phase5HumanAcceptance,
      agentRunId: input.review.agentRunId,
      review: input.review,
      currentDraftFingerprint: input.currentDraftFingerprint,
    });

    if (!acceptanceValid) {
      issues.push(
        issue(
          "PHASE5_NEEDS_REVIEW",
          "warning",
          "review",
          "The latest Phase 5 review still requires human review.",
          "Review the Phase 5 findings and resolve outstanding issues before publishing.",
        ),
      );
    }
  }

  if (!input.groundingAudit.passed) {
    for (const claim of input.groundingAudit.unsupportedClaims.slice(0, 3)) {
      issues.push(
        issue(
          "MATERIAL_UNSUPPORTED_CLAIM",
          "blocking",
          "factual",
          `Unsupported claim remains in the draft: ${claim}`,
          "Remove or correct unsupported factual claims before publishing.",
        ),
      );
    }
  }

  const reviewMateriality = { findings: input.review.findings } as SolReviewOutput;

  if (hasMaterialUnsupportedFinding(reviewMateriality)) {
    issues.push(
      issue(
        "MATERIAL_UNSUPPORTED_CLAIM",
        "blocking",
        "factual",
        "Phase 5 recorded a material unsupported security claim.",
        "Resolve material unsupported claims before publishing.",
      ),
    );
  } else if (input.review.unsupportedClaims.length > 0) {
    for (const claim of input.review.unsupportedClaims.slice(0, 3)) {
      issues.push(
        issue(
          "REVIEW_UNSUPPORTED_CLAIM",
          "warning",
          "factual",
          `Phase 5 recorded an advisory unsupported observation: ${claim}`,
          "Review and resolve or clarify the unsupported observation before publishing.",
        ),
      );
    }
  }

  if (hasMaterialConflictingFinding(reviewMateriality)) {
    issues.push(
      issue(
        "REVIEW_CONFLICTING_CLAIM",
        "blocking",
        "factual",
        "Phase 5 recorded a material conflicting factual claim.",
        "Resolve material conflicting claims before publishing.",
      ),
    );
  } else if (input.review.conflictingClaims.length > 0) {
    for (const claim of input.review.conflictingClaims.slice(0, 3)) {
      issues.push(
        issue(
          "REVIEW_CONFLICTING_CLAIM",
          "warning",
          "factual",
          `Phase 5 recorded an advisory conflicting observation: ${claim}`,
          "Review and resolve the conflicting observation before publishing.",
        ),
      );
    }
  }

  for (const warning of input.review.warnings) {
    if (/source|reference|citation|transparency/i.test(warning)) {
      issues.push(
        issue(
          "SOURCE_TRANSPARENCY_WARNING",
          "warning",
          "source",
          warning,
          "Improve reader-facing source transparency before publishing.",
        ),
      );
    }
  }

  return issues;
}

function checkSourceIntegrity(input: EvaluateReadinessGateInput): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const sourceIntegrity = evaluateDeterministicSourceIntegrity({
    invalidSourceUrls: input.invalidSourceUrls,
  });

  if (!sourceIntegrity.passed) {
    for (const url of sourceIntegrity.issues.slice(0, 3)) {
      issues.push(
        issue(
          "INVALID_SOURCE_URL",
          "blocking",
          "source",
          `Invalid or unapproved source URL remains: ${url}`,
          "Replace invented or unapproved source URLs with persisted research sources.",
        ),
      );
    }
  }

  if (input.review && !input.review.sourceIntegrity.passed) {
    issues.push(
      issue(
        "SOURCE_INTEGRITY_FAILED",
        "blocking",
        "source",
        "Phase 5 source integrity failed.",
        "Fix invalid or discovery-only sources before publishing.",
      ),
    );
  }

  return issues;
}

function checkInternalLinks(input: EvaluateReadinessGateInput): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const integrity = evaluateDeterministicInternalLinkIntegrity({
    invalidInternalLinks: input.invalidInternalLinks,
    internalLinkUnsupportedClaims: [],
  });

  if (!integrity.passed) {
    for (const linkIssue of integrity.issues.slice(0, 3)) {
      issues.push(
        issue(
          "INVALID_INTERNAL_LINK",
          "blocking",
          "internal_link",
          linkIssue,
          "Remove or replace invalid internal links with approved HimalCyberX content.",
        ),
      );
    }
  }

  if (input.review && !input.review.internalLinkIntegrity.passed) {
    issues.push(
      issue(
        "INTERNAL_LINK_INTEGRITY_FAILED",
        "blocking",
        "internal_link",
        "Phase 5 internal-link integrity failed.",
        "Fix invalid or unapproved internal links before publishing.",
      ),
    );
  }

  return issues;
}

function checkFeaturedImage(input: EvaluateReadinessGateInput): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const url = input.content.featuredImage?.trim() ?? "";

  if (!url) {
    issues.push(
      issue(
        "FEATURED_IMAGE_MISSING",
        "blocking",
        "image",
        "Featured image is not attached.",
        "Generate or upload a featured image before publishing.",
      ),
    );
    return issues;
  }

  if (!/^https?:\/\/.+/i.test(url)) {
    issues.push(
      issue(
        "FEATURED_IMAGE_INVALID_URL",
        "blocking",
        "image",
        "Featured image URL is invalid.",
        "Attach a valid featured image URL before publishing.",
      ),
    );
  }

  if (input.latestFeaturedImage) {
    if (
      input.latestFeaturedImage.width &&
      input.latestFeaturedImage.width !== FEATURED_IMAGE_WIDTH
    ) {
      issues.push(
        issue(
          "FEATURED_IMAGE_DIMENSION_INVALID",
          "blocking",
          "image",
          "Latest agent-generated featured image width is not 1536px.",
          "Regenerate the featured image to meet the 1536×864 requirement.",
        ),
      );
    }

    if (
      input.latestFeaturedImage.height &&
      input.latestFeaturedImage.height !== FEATURED_IMAGE_HEIGHT
    ) {
      issues.push(
        issue(
          "FEATURED_IMAGE_DIMENSION_INVALID",
          "blocking",
          "image",
          "Latest agent-generated featured image height is not 864px.",
          "Regenerate the featured image to meet the 1536×864 requirement.",
        ),
      );
    }

    if (
      input.latestFeaturedImage.mimeType &&
      input.latestFeaturedImage.mimeType !== "image/webp"
    ) {
      issues.push(
        issue(
          "FEATURED_IMAGE_MIME_INVALID",
          "blocking",
          "image",
          "Latest agent-generated featured image is not WebP.",
          "Regenerate the featured image using the agent pipeline.",
        ),
      );
    }

    if (
      input.latestFeaturedImage.byteSize &&
      input.latestFeaturedImage.byteSize > 5 * 1024 * 1024
    ) {
      issues.push(
        issue(
          "FEATURED_IMAGE_TOO_LARGE",
          "blocking",
          "image",
          "Latest agent-generated featured image exceeds 5 MB.",
          "Regenerate or replace the featured image with a smaller WebP file.",
        ),
      );
    }
  }

  return issues;
}

function checkSeo(input: EvaluateReadinessGateInput): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];

  if (input.content.contentType === "article") {
    const seo = resolveArticleSeo({
      title: input.content.title,
      excerpt: input.content.excerpt,
      seo_title: input.content.seoTitle,
      seo_description: input.content.seoDescription,
      og_title: input.content.ogTitle,
      og_description: input.content.ogDescription,
      featured_image_alt: input.content.featuredImageAlt,
    });

    if (!seo.metaTitle.trim()) {
      issues.push(
        issue(
          "SEO_TITLE_MISSING",
          "blocking",
          "seo",
          "SEO title cannot be resolved.",
          "Add an SEO title or ensure the article title is valid.",
        ),
      );
    } else if (seo.metaTitle.length > 70) {
      issues.push(
        issue(
          "SEO_TITLE_LONG",
          "warning",
          "seo",
          "SEO title is longer than the recommended range.",
          "Shorten the SEO title for cleaner search and social previews.",
        ),
      );
    }

    if (!seo.metaDescription.trim()) {
      issues.push(
        issue(
          "SEO_DESCRIPTION_MISSING",
          "warning",
          "seo",
          "SEO description is missing and no valid excerpt fallback is available.",
          "Add a concise SEO description before publishing.",
        ),
      );
    } else if (seo.metaDescription.length > 180) {
      issues.push(
        issue(
          "SEO_DESCRIPTION_LONG",
          "warning",
          "seo",
          "SEO description is longer than recommended.",
          "Shorten the SEO description to a concise summary.",
        ),
      );
    }

    if (seo.usesTitleFallback || seo.usesExcerptFallback) {
      issues.push(
        issue(
          "SEO_FALLBACK_IN_USE",
          "warning",
          "seo",
          "One or more SEO fields are using fallback values.",
          "Review SEO title and description before publishing.",
        ),
      );
    }

    return issues;
  }

  const description =
    input.content.contentType === "tutorial"
      ? input.content.description
      : input.content.description;
  const seoTitle = input.content.seoTitle?.trim() || input.content.title.trim();
  const seoDescription =
    input.content.seoDescription?.trim() || description.trim();

  if (!seoTitle) {
    issues.push(
      issue(
        "SEO_TITLE_MISSING",
        "blocking",
        "seo",
        "SEO title cannot be resolved.",
        "Add an SEO title before publishing.",
      ),
    );
  } else if (seoTitle.length > 70) {
    issues.push(
      issue(
        "SEO_TITLE_LONG",
        "warning",
        "seo",
        "SEO title is longer than the recommended range.",
        "Shorten the SEO title for cleaner search and social previews.",
      ),
    );
  }

  if (!seoDescription) {
    issues.push(
      issue(
        "SEO_DESCRIPTION_MISSING",
        "warning",
        "seo",
        "SEO description is missing.",
        "Add a concise SEO description before publishing.",
      ),
    );
  }

  return issues;
}

function checkStructure(input: EvaluateReadinessGateInput): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];

  if (input.content.contentType === "article") {
    if (getArticleContentTextLength(input.content.content) < 100) {
      issues.push(
        issue(
          "CONTENT_TOO_SHORT",
          "blocking",
          "structure",
          "Article content is below the minimum length.",
          "Expand the article body before publishing.",
        ),
      );
    }

    const duplicateHeadingMatches =
      input.content.content.match(/<h2[^>]*>\s*Key Takeaways\s*<\/h2>/gi) ?? [];
    if (duplicateHeadingMatches.length > 1) {
      issues.push(
        issue(
          "STRUCTURE_KEY_TAKEAWAYS_ORPHANED",
          "warning",
          "structure",
          "Multiple Key Takeaways sections were detected.",
          "Clean up duplicated Key Takeaways structure in the article body.",
        ),
      );
    }

    return issues;
  }

  if (input.content.contentType === "tutorial") {
    const introLength = getRichContentTextLength(input.content.introduction ?? "");
    const instructionsLength = getRichContentTextLength(
      input.content.instructions ?? "",
    );
    const keyTakeawaysLength = getRichContentTextLength(
      input.content.keyTakeaways ?? "",
    );

    if (introLength < 50) {
      issues.push(
        issue(
          "TUTORIAL_INTRODUCTION_TOO_SHORT",
          "blocking",
          "structure",
          "Tutorial introduction is below the publish minimum.",
          "Expand the introduction before publishing.",
        ),
      );
    }

    if (instructionsLength < 100) {
      issues.push(
        issue(
          "TUTORIAL_INSTRUCTIONS_TOO_SHORT",
          "blocking",
          "structure",
          "Tutorial instructions are below the publish minimum.",
          "Expand the step-by-step instructions before publishing.",
        ),
      );
    }

    if (
      keyTakeawaysLength > 0 &&
      !getRichContentTextLength(input.content.introduction ?? "") &&
      !getRichContentTextLength(input.content.instructions ?? "")
    ) {
      issues.push(
        issue(
          "STRUCTURE_KEY_TAKEAWAYS_ORPHANED",
          "warning",
          "structure",
          "Key takeaways exist without equivalent main tutorial body content.",
          "Review the tutorial structure and ensure key takeaways belong with the main content.",
        ),
      );
    }

    return issues;
  }

  const introLength = getRichContentTextLength(input.content.introduction ?? "");
  const instructionsLength = getRichContentTextLength(
    input.content.instructions ?? "",
  );

  if (introLength < 50) {
    issues.push(
      issue(
        "LAB_INTRODUCTION_TOO_SHORT",
        "blocking",
        "structure",
        "Lab introduction is below the publish minimum.",
        "Expand the lab introduction before publishing.",
      ),
    );
  }

  if (instructionsLength < 100) {
    issues.push(
      issue(
        "LAB_INSTRUCTIONS_TOO_SHORT",
        "blocking",
        "structure",
        "Lab instructions are below the publish minimum.",
        "Expand the lab instructions before publishing.",
      ),
    );
  }

  return issues;
}

function checkCmsFields(input: EvaluateReadinessGateInput): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const content = input.content;

  if (content.title.trim().length < 8) {
    issues.push(
      issue(
        "CMS_TITLE_INVALID",
        "blocking",
        "cms",
        "Title does not meet the minimum length requirement.",
        "Provide a title of at least 8 characters.",
      ),
    );
  }

  if (!content.slug.trim()) {
    issues.push(
      issue(
        "CMS_SLUG_MISSING",
        "blocking",
        "cms",
        "Slug is missing.",
        "Provide a valid slug before publishing.",
      ),
    );
  } else if (
    (content.contentType === "article" && !isValidContentSlug(content.slug)) ||
    (content.contentType === "tutorial" && !isValidContentSlug(content.slug)) ||
    (content.contentType === "lab" && !isValidContentSlug(content.slug))
  ) {
    issues.push(
      issue(
        "CMS_SLUG_INVALID",
        "blocking",
        "cms",
        "Slug format is invalid.",
        "Use a lowercase hyphenated slug with letters and numbers only.",
      ),
    );
  }

  if (content.status !== "draft") {
    issues.push(
      issue(
        "CMS_NOT_DRAFT",
        "blocking",
        "cms",
        "Linked content is not in draft status.",
        "Only draft content can be evaluated for agent publication readiness.",
      ),
    );
  }

  if (content.contentType === "article") {
    if (content.excerpt.trim().length < 20) {
      issues.push(
        issue(
          "CMS_EXCERPT_TOO_SHORT",
          "blocking",
          "cms",
          "Excerpt is below the minimum length.",
          "Expand the excerpt before publishing.",
        ),
      );
    }

    if (!content.author?.trim()) {
      issues.push(
        issue(
          "CMS_AUTHOR_MISSING",
          "blocking",
          "cms",
          "Author is required for article publication.",
          "Set an article author before publishing.",
        ),
      );
    }

    if (input.categoriesAvailable && !content.categoryId?.trim()) {
      issues.push(
        issue(
          "CMS_CATEGORY_MISSING",
          "warning",
          "cms",
          "No article category is selected.",
          "Select an appropriate category before publishing.",
        ),
      );
    }

    const articleSeo = resolveArticleSeo({
      title: content.title,
      excerpt: content.excerpt,
      seo_title: content.seoTitle,
      seo_description: content.seoDescription,
      og_title: content.ogTitle,
      og_description: content.ogDescription,
      featured_image_alt: content.featuredImageAlt,
    });

    const checklistItems = [
      {
        id: "alt-text",
        label: "Alt text missing",
        complete:
          !content.featuredImage?.trim() ||
          Boolean(content.featuredImageAlt?.trim() || content.title.trim()),
      },
      {
        id: "seo-title",
        label: "SEO title missing or invalid fallback",
        complete: Boolean(articleSeo.metaTitle.trim()),
      },
      {
        id: "seo-description",
        label: "SEO description missing or invalid fallback",
        complete: Boolean(articleSeo.metaDescription.trim()),
      },
    ];

    for (const item of checklistItems.filter((entry) => !entry.complete)) {
      issues.push(
        issue(
          `CMS_CHECKLIST_${item.id.toUpperCase().replace(/-/g, "_")}`,
          "warning",
          "cms",
          item.label,
          "Complete this CMS checklist item before publishing.",
        ),
      );
    }
  }

  if (content.contentType === "tutorial") {
    if (content.description.trim().length < 20) {
      issues.push(
        issue(
          "CMS_DESCRIPTION_TOO_SHORT",
          "blocking",
          "cms",
          "Tutorial description is below the minimum length.",
          "Expand the tutorial description before publishing.",
        ),
      );
    }
    if (!content.category?.trim()) {
      issues.push(
        issue(
          "CMS_CATEGORY_MISSING",
          "blocking",
          "cms",
          "Tutorial category is required for publication.",
          "Select a tutorial category before publishing.",
        ),
      );
    }
    if (!content.estimatedTime?.trim()) {
      issues.push(
        issue(
          "CMS_ESTIMATED_TIME_MISSING",
          "blocking",
          "cms",
          "Estimated time is required for publication.",
          "Add an estimated completion time before publishing.",
        ),
      );
    }
  }

  if (content.contentType === "lab") {
    if (content.description.trim().length < 20) {
      issues.push(
        issue(
          "CMS_DESCRIPTION_TOO_SHORT",
          "blocking",
          "cms",
          "Lab description is below the minimum length.",
          "Expand the lab description before publishing.",
        ),
      );
    }
    if (!content.category?.trim()) {
      issues.push(
        issue(
          "CMS_CATEGORY_MISSING",
          "blocking",
          "cms",
          "Lab category is required for publication.",
          "Select a lab category before publishing.",
        ),
      );
    }
    if (!content.estimatedTime?.trim()) {
      issues.push(
        issue(
          "CMS_ESTIMATED_TIME_MISSING",
          "blocking",
          "cms",
          "Estimated time is required for publication.",
          "Add an estimated completion time before publishing.",
        ),
      );
    }
  }

  return issues;
}

function summarizeCheckStatus(
  issues: ReadinessIssue[],
  category: ReadinessIssue["category"],
): ReadinessChecksSummary[keyof ReadinessChecksSummary] {
  const categoryIssues = issues.filter((entry) => entry.category === category);
  if (categoryIssues.some((entry) => entry.severity === "blocking")) {
    return "fail";
  }
  if (categoryIssues.some((entry) => entry.severity === "warning")) {
    return "warning";
  }
  return "pass";
}

export function calculateReadinessScore(issues: ReadinessIssue[]): number {
  let score = 100;
  const deduct = (amount: number) => {
    score -= amount;
  };

  for (const entry of issues) {
    const weight =
      entry.category === "review" || entry.category === "factual"
        ? READINESS_SCORE_WEIGHTS.factualReview
        : entry.category === "cms"
          ? READINESS_SCORE_WEIGHTS.cms
          : entry.category === "source"
            ? READINESS_SCORE_WEIGHTS.sourceTransparency
            : entry.category === "seo"
              ? READINESS_SCORE_WEIGHTS.seo
              : entry.category === "image" || entry.category === "alt_text"
                ? READINESS_SCORE_WEIGHTS.imageAlt
                : entry.category === "structure"
                  ? READINESS_SCORE_WEIGHTS.structure
                  : entry.category === "internal_link"
                    ? READINESS_SCORE_WEIGHTS.internalLinks
                    : 5;

    if (entry.severity === "blocking") {
      deduct(Math.min(weight, 30));
    } else if (entry.severity === "warning") {
      deduct(Math.min(weight / 2, 15));
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function evaluateReadinessGate(
  input: EvaluateReadinessGateInput,
): EvaluateReadinessGateResult {
  const issues: ReadinessIssue[] = [
    ...checkReviewAndFactual(input),
    ...checkSourceIntegrity(input),
    ...checkInternalLinks(input),
    ...checkFeaturedImage(input),
    ...evaluateAltTextQuality({
      altText: input.content.featuredImageAlt,
      title: input.content.title,
      slug: input.content.slug,
      hasFeaturedImage: Boolean(input.content.featuredImage?.trim()),
    }),
    ...checkSeo(input),
    ...checkStructure(input),
    ...checkCmsFields(input),
  ];

  const checks: ReadinessChecksSummary = {
    review: summarizeCheckStatus(issues, "review"),
    factual: summarizeCheckStatus(issues, "factual"),
    cms: summarizeCheckStatus(issues, "cms"),
    source: summarizeCheckStatus(issues, "source"),
    seo: summarizeCheckStatus(issues, "seo"),
    image: summarizeCheckStatus(issues, "image"),
    altText: summarizeCheckStatus(issues, "alt_text"),
    structure: summarizeCheckStatus(issues, "structure"),
    internalLinks: summarizeCheckStatus(issues, "internal_link"),
  };

  const passedChecks = [
    checks.review === "pass" ? "Phase 5 review current" : null,
    checks.factual === "pass" ? "Factual integrity" : null,
    checks.cms === "pass" ? "CMS completeness" : null,
    checks.source === "pass" ? "Source integrity" : null,
    checks.seo === "pass" ? "SEO readiness" : null,
    checks.image === "pass" ? "Featured image attached" : null,
    checks.altText === "pass" ? "Alt text acceptable" : null,
    checks.structure === "pass" ? "Structure checks" : null,
    checks.internalLinks === "pass" ? "Internal links valid" : null,
  ].filter(Boolean) as string[];

  return {
    status: resolveReadinessStatus(issues),
    readinessScore: calculateReadinessScore(issues),
    issues,
    checks,
    passedChecks,
  };
}

export function buildPersistedReadinessResult(input: {
  status: ReadinessStatus;
  readinessScore: number;
  fingerprint: string;
  reviewFingerprint: string | null;
  stale: boolean;
  issues: ReadinessIssue[];
  checks: ReadinessChecksSummary;
}): PersistedReadinessResult {
  return {
    version: "phase7-v1",
    evaluatedAt: new Date().toISOString(),
    status: input.status,
    readinessScore: input.readinessScore,
    fingerprint: input.fingerprint,
    reviewFingerprint: input.reviewFingerprint,
    stale: input.stale,
    issues: input.issues,
    checks: input.checks,
  };
}

export function parsePersistedReadinessResult(
  value: unknown,
): PersistedReadinessResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as PersistedReadinessResult;
  if (
    typeof record.status !== "string" ||
    typeof record.readinessScore !== "number" ||
    typeof record.fingerprint !== "string"
  ) {
    return null;
  }

  return record;
}

export function buildAgentRunReadinessMetadataUpdate(input: {
  existingMetadata: Record<string, unknown> | null;
  readiness: PersistedReadinessResult;
}): Record<string, unknown> {
  const existing =
    input.existingMetadata && typeof input.existingMetadata === "object"
      ? input.existingMetadata
      : {};

  return {
    ...existing,
    finalReadiness: input.readiness,
  };
}
