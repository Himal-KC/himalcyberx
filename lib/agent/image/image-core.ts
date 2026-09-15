import type { AgentContentType } from "@/lib/supabase/types";
import type { ReviewOverallStatus } from "../review/types";

export const FEATURED_IMAGE_WIDTH = 1536;
export const FEATURED_IMAGE_HEIGHT = 864;
export const FEATURED_IMAGE_ASPECT_RATIO = 16 / 9;

export type ImageErrorCode =
  | "IMAGE_MODEL_ERROR"
  | "IMAGE_PROCESSING_ERROR"
  | "IMAGE_DIMENSION_INVALID"
  | "IMAGE_MIME_INVALID"
  | "IMAGE_TOO_LARGE"
  | "IMAGE_UPLOAD_FAILED"
  | "IMAGE_ATTACH_FAILED"
  | "REVIEW_REQUIRED"
  | "REVIEW_FAILED"
  | "RATE_LIMITED"
  | "INVALID_RUN"
  | "MISSING_DRAFT"
  | "RUN_MISMATCH";

export interface ImagePromptContext {
  contentType: AgentContentType;
  topic: string;
  title: string;
  description: string;
  contentAngle: string;
  primaryKeyword: string;
  researchSummary: string;
  reviewSummary: string;
  visualConcept: string;
}

export const IMAGE_ATTACH_ALLOWLIST = [
  "featured_image",
  "featured_image_alt",
] as const;

export function isGptImage2Family(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  return (
    normalized.startsWith("gpt-image-2") ||
    normalized.startsWith("chatgpt-image")
  );
}

export function resolveOpenAiImageSize(model: string): string {
  if (isGptImage2Family(model)) {
    return `${FEATURED_IMAGE_WIDTH}x${FEATURED_IMAGE_HEIGHT}`;
  }

  return "1536x1024";
}

export function buildAgentFeaturedImageFilename(agentRunId: string): string {
  return `agent-${agentRunId}-${Date.now()}.webp`;
}

export function buildAgentFeaturedImageStoragePath(
  folder: "articles" | "tutorials" | "labs",
  agentRunId: string,
  timestamp = Date.now(),
): string {
  return `${folder}/agent-${agentRunId}-${timestamp}.webp`;
}

export function isAgentGeneratedStoragePath(
  storagePath: string,
  agentRunId: string,
): boolean {
  const normalized = storagePath.trim();
  const pattern = new RegExp(
    `^(articles|tutorials|labs)/agent-${agentRunId}-\\d+\\.webp$`,
  );
  return pattern.test(normalized);
}

export function storageFolderForContentType(
  contentType: AgentContentType,
): "articles" | "tutorials" | "labs" {
  switch (contentType) {
    case "article":
      return "articles";
    case "tutorial":
      return "tutorials";
    case "lab":
      return "labs";
  }
}

export function evaluateImageGenerationEligibility(input: {
  reviewStatus: ReviewOverallStatus | null;
  hasReview: boolean;
}):
  | { allowed: true }
  | { allowed: false; errorCode: ImageErrorCode; message: string } {
  if (!input.hasReview || !input.reviewStatus) {
    return {
      allowed: false,
      errorCode: "REVIEW_REQUIRED",
      message: "A completed Phase 5 review is required before generating a featured image.",
    };
  }

  if (input.reviewStatus === "fail") {
    return {
      allowed: false,
      errorCode: "REVIEW_FAILED",
      message:
        "Featured image generation is blocked while the Phase 5 review status is FAIL.",
    };
  }

  return { allowed: true };
}

export function truncateForPrompt(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildVisualConcept(input: {
  title: string;
  topic: string;
  contentAngle: string;
  primaryKeyword: string;
}): string {
  const angle = input.contentAngle.trim();
  if (angle.length >= 12) {
    return angle;
  }

  const keyword = input.primaryKeyword.trim();
  if (keyword.length >= 8) {
    return keyword;
  }

  return input.title.trim() || input.topic.trim();
}

export function buildImagePromptContext(input: {
  contentType: AgentContentType;
  topic: string;
  title: string;
  description: string;
  contentAngle: string;
  primaryKeyword: string;
  researchSummary: string;
  reviewSummary: string;
}): ImagePromptContext {
  const visualConcept = buildVisualConcept({
    title: input.title,
    topic: input.topic,
    contentAngle: input.contentAngle,
    primaryKeyword: input.primaryKeyword,
  });

  return {
    contentType: input.contentType,
    topic: truncateForPrompt(input.topic, 180),
    title: truncateForPrompt(input.title, 180),
    description: truncateForPrompt(input.description, 240),
    contentAngle: truncateForPrompt(input.contentAngle, 180),
    primaryKeyword: truncateForPrompt(input.primaryKeyword, 80),
    researchSummary: truncateForPrompt(input.researchSummary, 320),
    reviewSummary: truncateForPrompt(input.reviewSummary, 240),
    visualConcept: truncateForPrompt(visualConcept, 180),
  };
}

export function buildFeaturedImagePrompt(context: ImagePromptContext): string {
  const contentLabel =
    context.contentType === "lab"
      ? "Cyber Lab"
      : context.contentType === "tutorial"
        ? "Tutorial"
        : "Article";

  return [
    "Create professional cybersecurity editorial artwork for HimalCyberX.",
    `Content type: ${contentLabel}.`,
    `Topic: ${context.title}.`,
    `Specific concept: ${context.visualConcept}.`,
    `Editorial angle: ${context.contentAngle}.`,
    `Defensive cybersecurity context: ${context.researchSummary}.`,
    `Review context: ${context.reviewSummary}.`,
    "Visual style: modern, premium, technical, clean, dark and sophisticated where appropriate.",
    "Composition: landscape 16:9 editorial artwork with the main subject centered away from crop edges.",
    "Requirements: no readable text, no fake screenshots, no logos, no watermarks, no invented CVE numbers, CVSS scores, IP addresses, exploit commands, terminal output, dashboards, vendor advisories, statistics, quotes, or malware indicators.",
    "Avoid clichés such as hoodie hackers, green matrix code, giant padlocks, random binary backgrounds, glowing skulls, or fake terminal screenshots unless genuinely appropriate.",
    "Represent the specific topic visually without inventing factual evidence.",
  ].join("\n");
}

export function buildFeaturedImageAltText(input: {
  visualConcept: string;
  topic: string;
}): string {
  const concept = input.visualConcept.replace(/\s+/g, " ").trim();
  const topic = input.topic.replace(/\s+/g, " ").trim();
  let alt = `Editorial cybersecurity artwork depicting ${concept.toLowerCase()}, related to ${topic}`;

  if (alt.length < 80) {
    alt = `${alt}, rendered in a modern professional security style`;
  }

  if (alt.length > 160) {
    alt = `${alt.slice(0, 157).trimEnd()}…`;
  }

  return alt;
}

export function promptIncludesSafetyInstructions(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  return (
    normalized.includes("no readable text") &&
    normalized.includes("no fake screenshots") &&
    normalized.includes("no logos") &&
    normalized.includes("no watermarks") &&
    normalized.includes("no invented cve numbers")
  );
}

export function promptContainsSecretLikeContent(prompt: string): boolean {
  return (
    /sk-[A-Za-z0-9]{10,}/.test(prompt) ||
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(
      prompt,
    ) ||
    prompt.includes("service_role") ||
    prompt.includes("@admin") ||
    prompt.includes("subscriber")
  );
}

export function calculateCenterCropRegion(
  sourceWidth: number,
  sourceHeight: number,
  targetAspect = FEATURED_IMAGE_ASPECT_RATIO,
): { left: number; top: number; width: number; height: number } {
  const sourceAspect = sourceWidth / sourceHeight;

  if (sourceAspect > targetAspect) {
    const cropHeight = sourceHeight;
    const cropWidth = Math.round(cropHeight * targetAspect);
    return {
      left: Math.max(0, Math.round((sourceWidth - cropWidth) / 2)),
      top: 0,
      width: cropWidth,
      height: cropHeight,
    };
  }

  const cropWidth = sourceWidth;
  const cropHeight = Math.round(cropWidth / targetAspect);
  return {
    left: 0,
    top: Math.max(0, Math.round((sourceHeight - cropHeight) / 2)),
    width: cropWidth,
    height: cropHeight,
  };
}

export function validateFeaturedImageMetadata(input: {
  width: number;
  height: number;
  mimeType: string;
  byteSize: number;
  maxBytes: number;
  allowedMimeTypes: readonly string[];
}):
  | { valid: true }
  | { valid: false; errorCode: ImageErrorCode; message: string } {
  if (
    input.width !== FEATURED_IMAGE_WIDTH ||
    input.height !== FEATURED_IMAGE_HEIGHT
  ) {
    return {
      valid: false,
      errorCode: "IMAGE_DIMENSION_INVALID",
      message: `Featured image must be exactly ${FEATURED_IMAGE_WIDTH}×${FEATURED_IMAGE_HEIGHT}.`,
    };
  }

  const aspect = input.width / input.height;
  if (Math.abs(aspect - FEATURED_IMAGE_ASPECT_RATIO) > 0.001) {
    return {
      valid: false,
      errorCode: "IMAGE_DIMENSION_INVALID",
      message: "Featured image must use a 16:9 aspect ratio.",
    };
  }

  if (!input.allowedMimeTypes.includes(input.mimeType)) {
    return {
      valid: false,
      errorCode: "IMAGE_MIME_INVALID",
      message: "Featured image must use a supported image format.",
    };
  }

  if (input.byteSize > input.maxBytes) {
    return {
      valid: false,
      errorCode: "IMAGE_TOO_LARGE",
      message: "Featured image exceeds the storage size limit.",
    };
  }

  return { valid: true };
}

export function buildLinkedContentImageAttachUpdate(input: {
  featuredImage: string;
  featuredImageAlt: string;
}): {
  featured_image: string;
  featured_image_alt: string;
} {
  return {
    featured_image: input.featuredImage,
    featured_image_alt: input.featuredImageAlt,
  };
}

export function listDisallowedImageAttachFields(
  payload: Record<string, unknown>,
): string[] {
  const allowed = new Set<string>(IMAGE_ATTACH_ALLOWLIST);
  return Object.keys(payload).filter((key) => !allowed.has(key));
}

export function contentTableForImageAttach(
  contentType: AgentContentType,
): "articles" | "tutorials" | "labs" {
  return storageFolderForContentType(contentType);
}

export function assertImageAttachPayloadSafe(
  payload: Record<string, unknown>,
): { safe: true } | { safe: false; fields: string[] } {
  const disallowed = listDisallowedImageAttachFields(payload);
  if (disallowed.length > 0) {
    return { safe: false, fields: disallowed };
  }

  return { safe: true };
}

export function summarizeResearchForImagePrompt(
  keyFindings: string[],
): string {
  return keyFindings
    .map((finding) => finding.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 3)
    .join("; ");
}

export interface ProcessedFeaturedImage {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: "image/webp";
  byteSize: number;
}

export function buildAgentRunImageMetadataUpdate(input: {
  existingMetadata: Record<string, unknown> | null;
  storagePath: string;
  publicUrl: string;
}): Record<string, unknown> {
  const existing =
    input.existingMetadata && typeof input.existingMetadata === "object"
      ? input.existingMetadata
      : {};
  const previousImages = Array.isArray(existing.agentFeaturedImages)
    ? existing.agentFeaturedImages
    : [];

  const entry = {
    storagePath: input.storagePath,
    publicUrl: input.publicUrl,
    attachedAt: new Date().toISOString(),
  };

  return {
    ...existing,
    latestFeaturedImage: entry,
    agentFeaturedImages: [...previousImages, entry],
  };
}
