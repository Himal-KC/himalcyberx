import type { AgentContentType } from "@/lib/supabase/types";
import type { VerifiedClaim } from "@/lib/agent/types";
import type { ReviewOverallStatus } from "../review/types";

export const FEATURED_IMAGE_VISUAL_BRIEF_VERSION = "featured-image-v2";

export interface FeaturedImageVisualBrief {
  version: typeof FEATURED_IMAGE_VISUAL_BRIEF_VERSION;
  contentType: AgentContentType;
  subject: string;
  visualConcept: string;
  environment: string;
  importantElements: string[];
  mood: string;
  composition: string;
  style: string;
  avoidElements: string[];
}

const GLOBAL_AVOID = [
  "watermarks",
  "fake company or government logos (CISA, FBI, Microsoft, etc.)",
  "generic floating shield surrounded by random cybersecurity icons",
  "decorative padlocks unless directly relevant",
  "gibberish or large AI-generated text in the image",
  "invented statistics or fake evidence presented as screenshots",
  "copying another publication's artwork",
];

function normalizeBriefText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildHaystack(parts: string[]): string {
  return parts
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export type ArticleVisualTheme =
  | "ransomware"
  | "phishing"
  | "cloud_security"
  | "vulnerability"
  | "threat_intelligence"
  | "ai_security"
  | "general";

export function detectArticleVisualTheme(haystack: string): ArticleVisualTheme {
  if (/ransomware|extortion|encrypt(ed|ion)?|backup(s)? recovery|double extortion/.test(haystack)) {
    return "ransomware";
  }
  if (/phish(ing)?|spearphish|business email|inbox|social engineering|credential harvest/.test(haystack)) {
    return "phishing";
  }
  if (/cloud (security|infrastructure)|saas|kubernetes|aws|azure|gcp|data center|zero trust/.test(haystack)) {
    return "cloud_security";
  }
  if (/vulnerabilit(y|ies)|cve-|cvss|patch|exploit|zero-day|misconfiguration/.test(haystack)) {
    return "vulnerability";
  }
  if (/threat intel(ligence)?|soc analyst|intrusion|campaign|apt |malware family|indicator/.test(haystack)) {
    return "threat_intelligence";
  }
  if (/\bai security|artificial intelligence|llm|machine learning|model (security|poisoning)|genai/.test(haystack)) {
    return "ai_security";
  }

  return "general";
}

function articleThemePack(theme: ArticleVisualTheme): Pick<
  FeaturedImageVisualBrief,
  "environment" | "importantElements" | "mood" | "avoidElements"
> {
  switch (theme) {
    case "ransomware":
      return {
        environment:
          "realistic modern business server room or SOC with workstations under incident response",
        importantElements: [
          "encrypted or locked systems implied without readable ransom notes",
          "protected backup infrastructure",
          "incident response atmosphere",
        ],
        mood: "urgent but controlled, dark editorial cybersecurity tone",
        avoidElements: [
          "cartoon skulls or neon hacker stereotypes",
          "readable ransom demands",
          ...GLOBAL_AVOID,
        ],
      };
    case "phishing":
      return {
        environment:
          "realistic office workstation and email workflow context, not a generic shield graphic",
        importantElements: [
          "inbox or messaging context suggested abstractly",
          "user decision moment around suspicious communication",
        ],
        mood: "tense, realistic workplace security awareness",
        avoidElements: [
          "giant metal padlock icons",
          "unrelated ransomware red/black styling",
          ...GLOBAL_AVOID,
        ],
      };
    case "cloud_security":
      return {
        environment:
          "realistic cloud infrastructure, data center, or security operations supporting cloud workloads",
        importantElements: [
          "network and cloud architecture cues",
          "identity and access control context",
        ],
        mood: "professional, modern, resilient infrastructure",
        avoidElements: [...GLOBAL_AVOID],
      };
    case "vulnerability":
      return {
        environment:
          "realistic software engineering or infrastructure workspace exposing technical systems",
        importantElements: [
          "servers, endpoints, or code-adjacent infrastructure relevant to exposure",
          "patch or remediation context without fake CVE text",
        ],
        mood: "technical, precise, serious",
        avoidElements: [
          "invented CVE numbers or CVSS scores in the image",
          ...GLOBAL_AVOID,
        ],
      };
    case "threat_intelligence":
      return {
        environment:
          "SOC or threat analysis workspace with maps, monitors, and analyst context",
        importantElements: [
          "analysis displays with abstract data patterns only",
          "collaborative security operations context",
        ],
        mood: "analytical, cinematic, high-stakes",
        avoidElements: [...GLOBAL_AVOID],
      };
    case "ai_security":
      return {
        environment:
          "realistic AI compute infrastructure combined with security operations context",
        importantElements: [
          "GPU or data-center compute cues",
          "security monitoring tied to AI systems",
        ],
        mood: "forward-looking, technical, editorial",
        avoidElements: [...GLOBAL_AVOID],
      };
    default:
      return {
        environment:
          "realistic technology environment that matches the specific story subject",
        importantElements: [
          "subject-specific infrastructure or workplace context",
          "professional publication hero focal point",
        ],
        mood: "cinematic editorial cybersecurity, sophisticated and clean",
        avoidElements: [
          "generic isometric 3D cybersecurity clipart",
          "random binary code backgrounds",
          ...GLOBAL_AVOID,
        ],
      };
  }
}

function labVisualPack(input: {
  haystack: string;
  title: string;
}): Pick<
  FeaturedImageVisualBrief,
  "environment" | "importantElements" | "mood" | "avoidElements"
> {
  const forensic =
    /forensic|memory dump|disk image|evidence|artifact|malware sample/.test(input.haystack);
  const network = /wireshark|pcap|network|packet|firewall|ids|ips/.test(input.haystack);

  if (forensic) {
    return {
      environment:
        "realistic digital forensics lab workstation with evidence handling context",
      importantElements: [
        "forensic workstation and storage media context",
        "chain-of-custody implied without fake case evidence",
      ],
      mood: "hands-on, investigative, professional lab",
      avoidElements: [
        "fake screenshots pretending to be real case evidence",
        ...GLOBAL_AVOID,
      ],
    };
  }

  if (network) {
    return {
      environment:
        "realistic network analysis lab with monitors and segmented lab network gear",
      importantElements: [
        "analysis workstation",
        "network topology or traffic analysis context abstractly",
      ],
      mood: "technical, focused, educational lab",
      avoidElements: [...GLOBAL_AVOID],
    };
  }

  return {
    environment:
      "realistic hands-on cyber lab with workstation, terminal, and virtual lab network context",
    importantElements: [
      `lab focus aligned with ${input.title}`,
      "security tooling and virtual machines implied without readable commands",
    ],
    mood: "practical, immersive, instructor-led lab",
    avoidElements: [
      "fake terminal output with invented exploit commands",
      ...GLOBAL_AVOID,
    ],
  };
}

function tutorialVisualPack(input: {
  haystack: string;
  title: string;
}): Pick<
  FeaturedImageVisualBrief,
  "environment" | "importantElements" | "mood" | "avoidElements"
> {
  if (/linux|bash|shell|terminal|command line/.test(input.haystack)) {
    return {
      environment: "realistic Linux workstation learning setup with terminal-focused workspace",
      importantElements: ["terminal session context", "learner workstation"],
      mood: "clear, educational, professional",
      avoidElements: [...GLOBAL_AVOID],
    };
  }

  if (/wireshark|network analysis|pcap/.test(input.haystack)) {
    return {
      environment: "realistic network analysis learning workspace",
      importantElements: ["packet analysis monitors", "lab network context"],
      mood: "focused technical learning",
      avoidElements: [...GLOBAL_AVOID],
    };
  }

  if (/forensic|investigation|evidence/.test(input.haystack)) {
    return {
      environment: "realistic forensic analysis learning workstation",
      importantElements: ["evidence review context", "analysis tools"],
      mood: "methodical, educational",
      avoidElements: ["fake evidence screenshots", ...GLOBAL_AVOID],
    };
  }

  if (/web security|xss|sql injection|browser|appsec/.test(input.haystack)) {
    return {
      environment:
        "realistic web application security testing workspace with browser and development context",
      importantElements: ["browser and testing tools context", "secure development setup"],
      mood: "practical appsec learning",
      avoidElements: [...GLOBAL_AVOID],
    };
  }

  return {
    environment:
      "realistic technical learning workspace representing the task being taught",
    importantElements: [
      `learning focus for ${input.title}`,
      "workstation and tooling appropriate to the tutorial",
    ],
    mood: "approachable, professional, hands-on",
    avoidElements: [
      "generic cybersecurity clipart unrelated to the lesson",
      ...GLOBAL_AVOID,
    ],
  };
}

export function extractVerifiedConceptsForVisualBrief(
  claims: VerifiedClaim[],
  maxItems = 4,
): string[] {
  return claims
    .map((claim) => claim.statement.replace(/\s+/g, " ").trim())
    .filter((claim) => claim.length >= 8)
    .slice(0, maxItems);
}

export function buildFeaturedImageVisualBrief(input: {
  contentType: AgentContentType;
  topic: string;
  title: string;
  description: string;
  contentAngle: string;
  primaryKeyword: string;
  categoryLabel: string;
  keyFindings: string[];
  verifiedConcepts: string[];
  sectionFocus?: string;
}): FeaturedImageVisualBrief {
  const subject = normalizeBriefText(
    input.title.trim() || input.topic.trim(),
    180,
  );
  const visualConcept = normalizeBriefText(
    input.contentAngle.trim().length >= 12
      ? input.contentAngle
      : input.primaryKeyword.trim().length >= 6
        ? input.primaryKeyword
        : subject,
    200,
  );

  const haystack = buildHaystack([
    input.topic,
    input.title,
    input.description,
    input.contentAngle,
    input.primaryKeyword,
    input.categoryLabel,
    ...input.keyFindings,
    ...input.verifiedConcepts,
    input.sectionFocus ?? "",
  ]);

  let pack: Pick<
    FeaturedImageVisualBrief,
    "environment" | "importantElements" | "mood" | "avoidElements"
  >;

  if (input.contentType === "lab") {
    pack = labVisualPack({ haystack, title: subject });
  } else if (input.contentType === "tutorial") {
    pack = tutorialVisualPack({ haystack, title: subject });
  } else {
    const theme = detectArticleVisualTheme(haystack);
    pack = articleThemePack(theme);
    if (input.verifiedConcepts.length > 0) {
      pack.importantElements = [
        ...pack.importantElements,
        ...input.verifiedConcepts.slice(0, 2).map((concept) =>
          normalizeBriefText(concept, 120),
        ),
      ];
    }
  }

  if (input.keyFindings.length > 0 && input.contentType === "article") {
    const finding = normalizeBriefText(input.keyFindings[0] ?? "", 120);
    if (finding && !pack.importantElements.some((entry) => entry.includes(finding))) {
      pack.importantElements = [...pack.importantElements, finding];
    }
  }

  const style =
    input.contentType === "lab"
      ? "photorealistic cinematic editorial image of a technical cyber lab environment"
      : input.contentType === "tutorial"
        ? "photorealistic cinematic editorial image of a professional learning workspace"
        : "photorealistic or cinematic editorial hero photography for a cybersecurity publication";

  return {
    version: FEATURED_IMAGE_VISUAL_BRIEF_VERSION,
    contentType: input.contentType,
    subject,
    visualConcept,
    environment: pack.environment,
    importantElements: pack.importantElements.slice(0, 5),
    mood: pack.mood,
    composition:
      "wide 16:9 website hero composition with the main subject in a safe central area, subtle negative space for headline overlay, landscape orientation, no edge clipping of key subject",
    style,
    avoidElements: pack.avoidElements.slice(0, 10),
  };
}

export function buildFeaturedImagePromptFromVisualBrief(
  brief: FeaturedImageVisualBrief,
): string {
  const contentLabel =
    brief.contentType === "lab"
      ? "Cyber Lab"
      : brief.contentType === "tutorial"
        ? "Tutorial"
        : "Article";

  return [
    "Create an original wide editorial hero image for a professional cybersecurity publication (HimalCyberX).",
    `Content type: ${contentLabel}.`,
    `Primary subject: ${brief.subject}.`,
    `Visual concept: ${brief.visualConcept}.`,
    `Environment: ${brief.environment}.`,
    `Important elements: ${brief.importantElements.join("; ")}.`,
    `Mood: ${brief.mood}.`,
    `Composition: ${brief.composition}.`,
    `Style direction: ${brief.style}.`,
    "Use realistic materials, believable lighting, and sophisticated professional composition.",
    "Prefer dark modern technology aesthetic only when it fits the subject; do not force ransomware red styling on unrelated topics.",
    "Subtle cyan, blue, or red security lighting is acceptable when appropriate.",
    "Strict requirements: no watermark; no fake logos or branding; no illegible interface text; no invented statistics; no UI presented as factual evidence.",
    `Strictly avoid: ${brief.avoidElements.join("; ")}.`,
    "Do not use generic isometric 3D cybersecurity illustrations or decorative shield/icon collage unless the subject genuinely requires it.",
    "Generate original imagery only.",
  ].join("\n");
}

export function buildFeaturedImageAltTextFromBrief(
  brief: FeaturedImageVisualBrief,
): string {
  const focal = brief.importantElements.slice(0, 2).join(" and ");
  let alt = normalizeBriefText(
    `${brief.subject}: ${brief.visualConcept} in ${brief.environment}. ${focal}.`,
    220,
  );

  if (alt.length < 80) {
    alt = normalizeBriefText(`${alt} ${brief.mood}.`, 220);
  }

  if (alt.length > 160) {
    alt = `${alt.slice(0, 157).trimEnd()}…`;
  }

  if (/^image of/i.test(alt)) {
    alt = alt.replace(/^image of/i, "Wide hero showing");
  }

  return alt;
}

export function promptDiscouragesGenericShieldLanguage(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  return (
    normalized.includes("generic floating shield") ||
    normalized.includes("decorative shield") ||
    normalized.includes("do not use generic isometric")
  );
}

export function promptProhibitsFakeBranding(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  return (
    normalized.includes("no fake logos") &&
    normalized.includes("cisa") &&
    normalized.includes("watermark")
  );
}

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
  visualBrief: FeaturedImageVisualBrief;
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
  const brief = buildFeaturedImageVisualBrief({
    contentType: "article",
    topic: input.topic,
    title: input.title,
    description: "",
    contentAngle: input.contentAngle,
    primaryKeyword: input.primaryKeyword,
    categoryLabel: "",
    keyFindings: [],
    verifiedConcepts: [],
  });
  return brief.visualConcept;
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
  categoryLabel: string;
  keyFindings: string[];
  verifiedConcepts: string[];
  sectionFocus?: string;
}): ImagePromptContext {
  const visualBrief = buildFeaturedImageVisualBrief({
    contentType: input.contentType,
    topic: truncateForPrompt(input.topic, 180),
    title: truncateForPrompt(input.title, 180),
    description: truncateForPrompt(input.description, 240),
    contentAngle: truncateForPrompt(input.contentAngle, 180),
    primaryKeyword: truncateForPrompt(input.primaryKeyword, 80),
    categoryLabel: truncateForPrompt(input.categoryLabel, 80),
    keyFindings: input.keyFindings
      .map((finding) => truncateForPrompt(finding, 120))
      .filter(Boolean)
      .slice(0, 3),
    verifiedConcepts: input.verifiedConcepts
      .map((concept) => truncateForPrompt(concept, 120))
      .filter(Boolean)
      .slice(0, 4),
    sectionFocus: input.sectionFocus
      ? truncateForPrompt(input.sectionFocus, 160)
      : undefined,
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
    visualConcept: visualBrief.visualConcept,
    visualBrief,
  };
}

export function buildFeaturedImagePrompt(context: ImagePromptContext): string {
  return buildFeaturedImagePromptFromVisualBrief(context.visualBrief);
}

export function buildFeaturedImageAltText(input: {
  visualBrief: FeaturedImageVisualBrief;
}): string {
  return buildFeaturedImageAltTextFromBrief(input.visualBrief);
}

export function evaluateExistingFeaturedImageReuse(input: {
  featuredImageUrl: string | null;
  storagePath: string | null;
  agentRunId: string;
  forceRegenerate: boolean;
}): boolean {
  if (input.forceRegenerate) {
    return false;
  }

  if (!input.featuredImageUrl?.trim() || !input.storagePath?.trim()) {
    return false;
  }

  return isAgentGeneratedStoragePath(input.storagePath, input.agentRunId);
}

export function validateSourceImageLandscape(input: {
  width: number;
  height: number;
}):
  | { valid: true }
  | { valid: false; errorCode: ImageErrorCode; message: string } {
  if (input.width <= 0 || input.height <= 0) {
    return {
      valid: false,
      errorCode: "IMAGE_PROCESSING_ERROR",
      message: "Generated image has invalid dimensions.",
    };
  }

  if (input.width <= input.height) {
    return {
      valid: false,
      errorCode: "IMAGE_DIMENSION_INVALID",
      message: "Generated image must use landscape orientation.",
    };
  }

  return { valid: true };
}

export function promptIncludesSafetyInstructions(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  return (
    normalized.includes("no watermark") &&
    normalized.includes("no fake logos") &&
    normalized.includes("original wide editorial hero") &&
    normalized.includes("landscape")
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
  width?: number;
  height?: number;
  mimeType?: string;
  byteSize?: number;
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
    width: input.width,
    height: input.height,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
  };

  return {
    ...existing,
    latestFeaturedImage: entry,
    agentFeaturedImages: [...previousImages, entry],
  };
}
