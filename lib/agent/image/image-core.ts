import type { AgentContentType } from "@/lib/supabase/types";
import type { VerifiedClaim } from "@/lib/agent/types";
import type { ReviewOverallStatus } from "../review/types";

export const FEATURED_IMAGE_VISUAL_BRIEF_VERSION = "featured-image-v2.1";

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
  "prominent readable headlines, labels, or UI copy inside the image",
  "invented statistics or fake evidence presented as screenshots",
  "copying another publication's artwork",
];

const ARTICLE_STOCK_PHOTO_AVOID = [
  "stock-photo office worker as the main subject",
  "single person sitting at desk as the main subject",
  "person staring at a laptop or monitor as the dominant focal point",
  "generic corporate office stock photography",
  "close-up human portrait or smiling employee",
  "generic hacker in a hoodie",
  "giant floating shield or padlock hero object",
  "random cybersecurity icon collage",
  "generic blue 3D security illustration",
];

const ARTICLE_EDITORIAL_STYLE =
  "cinematic cybersecurity editorial hero — realistic digital threat visualization with semi-realistic technology environments, multiple relevant visual layers, strong depth, dramatic professional lighting, high contrast, premium cyber-threat-report publication appearance";

const ARTICLE_EDITORIAL_COMPOSITION =
  "wide cinematic 16:9 hero composition with layered subject-relevant elements, strong depth, safe central focal area with subtle negative space for headline overlay, landscape orientation, no edge clipping of key subjects";

const ARTICLE_HUMAN_GUIDANCE =
  "humans may appear only when genuinely useful and must remain secondary—not the dominant subject";

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
          "wide cinematic compromised enterprise technology environment—server room, endpoints, and backup or recovery infrastructure under incident response",
        importantElements: [
          "encrypted or locked systems implied without readable ransom notes",
          "protected backup and immutable recovery context",
          "incident response and containment atmosphere across multiple visual layers",
        ],
        mood: "urgent cinematic threat-report tone—dark editorial cybersecurity, controlled professionalism",
        avoidElements: [
          "cartoon skulls or neon hacker stereotypes",
          "readable ransom demands",
          ...ARTICLE_STOCK_PHOTO_AVOID,
          ...GLOBAL_AVOID,
        ],
      };
    case "phishing":
      return {
        environment:
          "wide cinematic enterprise email and identity security environment—cloud mailbox, authentication, and monitoring layers rather than a desk portrait",
        importantElements: [
          "suspicious message or email delivery entering a corporate mailbox abstractly without readable body text",
          "identity or account-access risk in a secure cloud or enterprise environment",
          "subtle warning indicators with defensive detection or protection on the opposite side",
          "realistic monitors, cloud or email infrastructure, and network or security visualization",
        ],
        mood: "professional cyber threat-intelligence publication aesthetic—dark enterprise technology, cinematic blue/cyan lighting with restrained warning-red accents",
        avoidElements: [
          "person reading email as the dominant scene",
          "fake Outlook or vendor mailbox screenshots with readable phishing text",
          "giant metal padlock icons",
          "unrelated ransomware red/black styling only",
          ...ARTICLE_STOCK_PHOTO_AVOID,
          ...GLOBAL_AVOID,
        ],
      };
    case "cloud_security":
      return {
        environment:
          "wide cinematic cloud workload and infrastructure environment with identity, access, and data-protection context",
        importantElements: [
          "cloud architecture, workloads, and segmented network cues",
          "identity and access control integrated into the scene—not a generic cloud icon",
          "defensive monitoring or policy enforcement context when appropriate",
        ],
        mood: "professional, resilient, modern infrastructure with editorial depth",
        avoidElements: [
          "generic cloud shape with a floating padlock",
          ...ARTICLE_STOCK_PHOTO_AVOID,
          ...GLOBAL_AVOID,
        ],
      };
    case "vulnerability":
      return {
        environment:
          "wide cinematic view of affected software, infrastructure, or devices exposing a technical attack surface",
        importantElements: [
          "specific vulnerable systems or software stack implied without fake CVE text",
          "exposed technical surface and defensive analysis or remediation context",
          "patch, hardening, or segmentation context without invented scores",
        ],
        mood: "technical, precise, serious threat-report editorial",
        avoidElements: [
          "invented CVE numbers or CVSS scores in the image",
          "default warning triangle plus shield clipart",
          ...ARTICLE_STOCK_PHOTO_AVOID,
          ...GLOBAL_AVOID,
        ],
      };
    case "threat_intelligence":
      return {
        environment:
          "wide cinematic SOC or threat-analysis environment with infrastructure relationships and telemetry context",
        importantElements: [
          "analysis displays with abstract data patterns only—no readable intel text",
          "relationships between systems, campaigns, or indicators when supported by the topic",
          "collaborative security operations depth—not a decorative world map unless the topic requires geography",
        ],
        mood: "analytical, cinematic, high-stakes editorial intelligence",
        avoidElements: [
          "generic decorative world map unless geographically relevant to the story",
          ...ARTICLE_STOCK_PHOTO_AVOID,
          ...GLOBAL_AVOID,
        ],
      };
    case "ai_security":
      return {
        environment:
          "wide cinematic AI compute and data-center infrastructure combined with the specific security issue from the article",
        importantElements: [
          "GPU or AI compute infrastructure cues tied to the story",
          "security monitoring, governance, or abuse-prevention context for AI systems",
          "the concrete risk described by the article—not a generic AI motif",
        ],
        mood: "forward-looking, technical, premium editorial cybersecurity",
        avoidElements: [
          "generic robot mascot or brain-plus-shield clipart",
          ...ARTICLE_STOCK_PHOTO_AVOID,
          ...GLOBAL_AVOID,
        ],
      };
    default:
      return {
        environment:
          "wide cinematic technology environment that matches the specific story subject with layered editorial depth",
        importantElements: [
          "subject-specific infrastructure, systems, or threat context as the hero focal point",
          "defensive or investigative context when appropriate to the article",
          "multiple relevant visual layers with strong depth",
        ],
        mood: "cinematic editorial cybersecurity—sophisticated, clean, premium publication hero",
        avoidElements: [
          "generic isometric 3D cybersecurity clipart",
          "random binary code backgrounds",
          ...ARTICLE_STOCK_PHOTO_AVOID,
          ...GLOBAL_AVOID,
        ],
      };
  }
}

function refineArticleThemePackForHaystack(
  theme: ArticleVisualTheme,
  haystack: string,
  pack: Pick<
    FeaturedImageVisualBrief,
    "environment" | "importantElements" | "mood" | "avoidElements"
  >,
): Pick<
  FeaturedImageVisualBrief,
  "environment" | "importantElements" | "mood" | "avoidElements"
> {
  if (
    theme === "phishing" &&
    /microsoft 365|m365|office 365|entra|azure ad|exchange online|sharepoint online/.test(
      haystack,
    )
  ) {
    return {
      ...pack,
      environment:
        "wide cinematic enterprise cloud email and identity environment representing a sophisticated business phishing threat against a cloud mailbox and account-access path",
      importantElements: [
        "suspicious email entering a corporate mailbox without readable body text",
        "authentication or account-access risk in a secure cloud identity environment",
        "subtle warning indicators with defensive monitoring or protection opposing the threat",
        "realistic monitors and cloud or email infrastructure across layered depth—not a single employee at a desk",
      ],
      avoidElements: [
        "Microsoft logo or fake Microsoft, Outlook, or M365 interface",
        "readable phishing email body or fake statistics",
        ...pack.avoidElements,
      ],
    };
  }

  return pack;
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
    pack = refineArticleThemePackForHaystack(
      theme,
      haystack,
      articleThemePack(theme),
    );
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
        ? "photorealistic cinematic editorial image of a professional hands-on learning workspace"
        : ARTICLE_EDITORIAL_STYLE;

  const composition =
    input.contentType === "article"
      ? ARTICLE_EDITORIAL_COMPOSITION
      : "wide 16:9 website hero composition with the main subject in a safe central area, subtle negative space for headline overlay, landscape orientation, no edge clipping of key subject";

  return {
    version: FEATURED_IMAGE_VISUAL_BRIEF_VERSION,
    contentType: input.contentType,
    subject,
    visualConcept,
    environment: pack.environment,
    importantElements: pack.importantElements.slice(0, 5),
    mood: pack.mood,
    composition,
    style,
    avoidElements: pack.avoidElements.slice(0, 12),
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

  const lines = [
    "Create an original wide editorial hero image for a professional cybersecurity publication (HimalCyberX).",
  ];

  if (brief.contentType === "article") {
    lines.push(
      "This is an editorial cybersecurity hero graphic, NOT corporate stock photography.",
      "The primary visual subject must be the cybersecurity event, technology, system or threat described by the article—not a generic person.",
      ARTICLE_HUMAN_GUIDANCE,
      "Communicate the topic visually with layered technology and threat context; do not include prominent readable text, headlines, or UI copy inside the image.",
    );
  }

  lines.push(
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
  );

  return lines.join("\n");
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
    normalized.includes("do not use generic isometric") ||
    normalized.includes("icon collage")
  );
}

export function promptRequiresEditorialNotStockPhotography(prompt: string): boolean {
  return prompt.toLowerCase().includes("not corporate stock photography");
}

export function promptRequiresCybersecuritySubjectPrimary(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  return (
    normalized.includes("primary visual subject must be") &&
    normalized.includes("not a generic person")
  );
}

export function promptDiscouragesPersonAtDeskStockPhoto(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  return (
    normalized.includes("single person sitting at desk") ||
    normalized.includes("stock-photo office worker")
  );
}

export function promptRequiresSecondaryHumanGuidanceForArticles(
  prompt: string,
): boolean {
  return prompt.toLowerCase().includes("must remain secondary");
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
