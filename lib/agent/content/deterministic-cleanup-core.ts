import {
  countKeyTakeawaysSections,
  dedupeKeyTakeawaysSections,
} from "./draft-structure-core.ts";
import {
  evaluateFeaturedImageAltQuality,
  featuredImageAltPassesPhase7Quality,
  repairFeaturedImageAltText,
} from "./featured-image-alt-core.ts";
import type { GeneratedDraft } from "../generation/types";

export interface DeterministicDraftCleanupResult {
  draft: Extract<GeneratedDraft, { contentType: "article" }>;
  featuredImageAlt: string | null;
  changeSummary: string[];
  structureChanged: boolean;
  altChanged: boolean;
}

export function articleNeedsDeterministicCleanup(input: {
  draft: Extract<GeneratedDraft, { contentType: "article" }>;
  slug: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
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

  return structureIssue || altIssue;
}

export function applyArticleDeterministicCleanup(input: {
  draft: Extract<GeneratedDraft, { contentType: "article" }>;
  slug: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  visualConcept?: string | null;
  topic?: string | null;
}): DeterministicDraftCleanupResult {
  const changeSummary: string[] = [];
  let content = input.draft.content;
  const beforeStructureCount = countKeyTakeawaysSections(content);

  if (beforeStructureCount > 1) {
    content = dedupeKeyTakeawaysSections(content);
    changeSummary.push("Duplicate Key Takeaways sections merged into one canonical section");
  }

  const structureChanged = content.trim() !== input.draft.content.trim();

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
  };
}

export { evaluateFeaturedImageAltQuality, featuredImageAltPassesPhase7Quality };

export interface DeterministicCleanupUiState {
  canApply: boolean;
  reason: string;
  previewSummary: string[];
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

  const canApply = previewSummary.length > 0;
  return {
    canApply,
    reason: canApply
      ? "Deterministic cleanup can resolve Phase 7 structure and alt-text issues without another revision pass."
      : "No deterministic cleanup is needed for the current draft.",
    previewSummary,
  };
}
