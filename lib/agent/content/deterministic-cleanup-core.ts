import {
  countKeyTakeawaysSections,
  dedupeKeyTakeawaysSections,
} from "./draft-structure-core.ts";
import {
  evaluateFeaturedImageAltQuality,
  featuredImageAltPassesPhase7Quality,
  repairFeaturedImageAltText,
  type FeaturedImageAltRepairBrief,
} from "./featured-image-alt-core.ts";
import {
  applyApprovedInternalLinksToHtml,
  articleNeedsApprovedInternalLinkInsertion,
  type ApprovedInternalCatalogItem,
  resolveApprovedInternalLinks,
} from "./internal-link-cleanup-core.ts";
import type { GeneratedDraft } from "../generation/types";

export interface DeterministicDraftCleanupResult {
  draft: Extract<GeneratedDraft, { contentType: "article" }>;
  featuredImageAlt: string | null;
  changeSummary: string[];
  structureChanged: boolean;
  altChanged: boolean;
  internalLinksChanged: boolean;
}

export function articleNeedsDeterministicCleanup(input: {
  draft: Extract<GeneratedDraft, { contentType: "article" }>;
  slug: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  approvedInternalCatalog?: ApprovedInternalCatalogItem[];
}): boolean {
  const structureIssue = countKeyTakeawaysSections(input.draft.content) > 1;
  const altIssue =
    Boolean(input.featuredImage?.trim()) &&
    !featuredImageAltPassesPhase7Quality({
      altText: input.featuredImageAlt,
      title: input.draft.title,
      slug: input.slug,
      hasFeaturedImage: true,
    });
  const internalLinkIssue =
    input.approvedInternalCatalog &&
    input.approvedInternalCatalog.length > 0 &&
    articleNeedsApprovedInternalLinkInsertion({
      content: input.draft.content,
      internalLinks: input.draft.internalLinks,
      catalog: input.approvedInternalCatalog,
    });

  return structureIssue || altIssue || Boolean(internalLinkIssue);
}

export function applyArticleDeterministicCleanup(input: {
  draft: Extract<GeneratedDraft, { contentType: "article" }>;
  slug: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  visualConcept?: string | null;
  topic?: string | null;
  altRepairBrief?: FeaturedImageAltRepairBrief | null;
  approvedInternalCatalog?: ApprovedInternalCatalogItem[];
}): DeterministicDraftCleanupResult {
  const changeSummary: string[] = [];
  let content = input.draft.content;
  const beforeStructureCount = countKeyTakeawaysSections(content);

  if (beforeStructureCount > 1) {
    content = dedupeKeyTakeawaysSections(content);
    changeSummary.push("Duplicate Key Takeaways sections merged into one canonical section");
  }

  const structureChanged = content.trim() !== input.draft.content.trim();

  let internalLinksChanged = false;
  if (input.approvedInternalCatalog && input.approvedInternalCatalog.length > 0) {
    const resolved = resolveApprovedInternalLinks({
      internalLinks: input.draft.internalLinks,
      catalog: input.approvedInternalCatalog,
    });
    const linked = applyApprovedInternalLinksToHtml({
      content,
      links: resolved,
    });
    if (linked.content.trim() !== content.trim()) {
      content = linked.content;
      internalLinksChanged = linked.linkedContentIds.length > 0;
      if (internalLinksChanged) {
        changeSummary.push("Approved internal HCX links inserted into article body");
      }
    }
  }

  let featuredImageAlt = input.featuredImageAlt;
  const altBefore = featuredImageAlt;
  if (input.featuredImage?.trim()) {
    featuredImageAlt =
      repairFeaturedImageAltText({
        title: input.draft.title,
        slug: input.slug,
        currentAlt: input.featuredImageAlt,
        visualConcept: input.visualConcept,
        topic: input.topic,
        altRepairBrief: input.altRepairBrief,
        hasFeaturedImage: true,
      }) ?? featuredImageAlt;
  }

  const altChanged = (altBefore ?? "").trim() !== (featuredImageAlt ?? "").trim();
  if (altChanged) {
    changeSummary.push("Featured image alt text repaired to meet Phase 7 quality rules");
  }

  if (
    input.featuredImage?.trim() &&
    !featuredImageAltPassesPhase7Quality({
      altText: featuredImageAlt,
      title: input.draft.title,
      slug: input.slug,
      hasFeaturedImage: true,
    })
  ) {
    throw new Error("Deterministic alt text repair did not pass Phase 7 quality checks.");
  }

  return {
    draft: {
      ...input.draft,
      content,
    },
    featuredImageAlt,
    changeSummary,
    structureChanged,
    altChanged,
    internalLinksChanged,
  };
}

export { evaluateFeaturedImageAltQuality, featuredImageAltPassesPhase7Quality };

export interface DeterministicCleanupUiState {
  canApply: boolean;
  reason: string;
  previewSummary: string[];
}

export function resolveFeaturedImageAltRepairBrief(input: {
  metadata: Record<string, unknown> | null | undefined;
  draft?: Extract<GeneratedDraft, { contentType: "article" }>;
  recommendedAngle?: string | null;
  topic?: string | null;
}): FeaturedImageAltRepairBrief | null {
  const raw = input.metadata?.featuredImageAltRepair;
  if (raw && typeof raw === "object") {
    const record = raw as FeaturedImageAltRepairBrief;
    if (
      typeof record.visualConcept === "string" &&
      typeof record.environment === "string" &&
      typeof record.mood === "string"
    ) {
      return {
        visualConcept: record.visualConcept.trim(),
        environment: record.environment.trim(),
        mood: record.mood.trim(),
        importantElements: Array.isArray(record.importantElements)
          ? record.importantElements.filter((item) => typeof item === "string")
          : [],
      };
    }
  }

  const visualConcept =
    resolveVisualConceptForAltRepair({
      metadata: input.metadata,
      recommendedAngle: input.recommendedAngle,
      topic: input.topic,
    }) ??
    input.draft?.generationPlan.contentAngle ??
    null;

  if (!visualConcept) {
    return null;
  }

  return {
    visualConcept,
    environment: "a layered enterprise security operations setting",
    mood: "Professional editorial lighting with realistic depth",
    importantElements: [],
  };
}

export function resolveVisualConceptForAltRepair(input: {
  metadata: Record<string, unknown> | null | undefined;
  recommendedAngle?: string | null;
  topic?: string | null;
}): string | null {
  const fromMetadata = input.metadata?.visualConcept;
  if (typeof fromMetadata === "string" && fromMetadata.trim()) {
    return fromMetadata.trim();
  }
  if (input.recommendedAngle?.trim()) {
    return input.recommendedAngle.trim();
  }
  if (input.topic?.trim()) {
    return input.topic.trim();
  }
  return null;
}

export function buildDeterministicCleanupUiState(input: {
  draft: Extract<GeneratedDraft, { contentType: "article" }>;
  slug: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  approvedInternalCatalog?: ApprovedInternalCatalogItem[];
}): DeterministicCleanupUiState {
  const previewSummary: string[] = [];
  if (countKeyTakeawaysSections(input.draft.content) > 1) {
    previewSummary.push("Merge duplicate Key Takeaways sections");
  }
  if (
    Boolean(input.featuredImage?.trim()) &&
    !featuredImageAltPassesPhase7Quality({
      altText: input.featuredImageAlt,
      title: input.draft.title,
      slug: input.slug,
      hasFeaturedImage: true,
    })
  ) {
    previewSummary.push("Repair featured image alt text");
  }
  if (
    input.approvedInternalCatalog &&
    input.approvedInternalCatalog.length > 0 &&
    articleNeedsApprovedInternalLinkInsertion({
      content: input.draft.content,
      internalLinks: input.draft.internalLinks,
      catalog: input.approvedInternalCatalog,
    })
  ) {
    previewSummary.push("Insert approved internal HCX links into article body");
  }

  const canApply = previewSummary.length > 0;
  return {
    canApply,
    reason: canApply
      ? "Deterministic cleanup can resolve Phase 7 structure, alt-text, and internal-link presentation issues."
      : "No deterministic cleanup is needed for the current draft.",
    previewSummary,
  };
}
