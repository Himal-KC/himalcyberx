import type { GeneratedDraftSchema } from "./schemas";
import type { GeneratedDraft } from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export interface DraftReferenceValidationFailure {
  reason: string;
  malformedSourceCount: number;
  disallowedSourceCount: number;
  malformedInternalLinkCount: number;
  unknownInternalLinkCount: number;
}

export function validateDraftReferencesDetailed(
  draft: GeneratedDraftSchema | GeneratedDraft,
  allowedSourceUrls: string[],
  allowedContentIds: Set<string>,
): DraftReferenceValidationFailure | null {
  const allowedUrls = new Set(
    allowedSourceUrls.map((url) => url.trim().toLowerCase()),
  );
  let malformedSourceCount = 0;
  let disallowedSourceCount = 0;
  let malformedInternalLinkCount = 0;
  let unknownInternalLinkCount = 0;

  for (const mapping of draft.sourceMappings) {
    for (const url of mapping.sourceUrls) {
      if (!isValidHttpUrl(url)) {
        malformedSourceCount += 1;
        continue;
      }

      if (!allowedUrls.has(url.trim().toLowerCase())) {
        disallowedSourceCount += 1;
      }
    }
  }

  for (const link of draft.internalLinks) {
    if (!isValidUuid(link.contentId)) {
      malformedInternalLinkCount += 1;
      continue;
    }

    if (!allowedContentIds.has(link.contentId)) {
      unknownInternalLinkCount += 1;
    }
  }

  if (malformedSourceCount > 0) {
    return {
      reason: "Generated output contained a malformed source URL.",
      malformedSourceCount,
      disallowedSourceCount,
      malformedInternalLinkCount,
      unknownInternalLinkCount,
    };
  }

  if (disallowedSourceCount > 0) {
    return {
      reason:
        "Generated output referenced a source URL outside the research allowlist.",
      malformedSourceCount,
      disallowedSourceCount,
      malformedInternalLinkCount,
      unknownInternalLinkCount,
    };
  }

  if (malformedInternalLinkCount > 0) {
    return {
      reason: "Generated output contained a malformed internal link ID.",
      malformedSourceCount,
      disallowedSourceCount,
      malformedInternalLinkCount,
      unknownInternalLinkCount,
    };
  }

  if (unknownInternalLinkCount > 0) {
    return {
      reason: "Generated output referenced an unknown internal link.",
      malformedSourceCount,
      disallowedSourceCount,
      malformedInternalLinkCount,
      unknownInternalLinkCount,
    };
  }

  return null;
}

export function validateDraftReferences(
  draft: GeneratedDraftSchema | GeneratedDraft,
  allowedSourceUrls: string[],
  allowedContentIds: Set<string>,
): string | null {
  return validateDraftReferencesDetailed(
    draft,
    allowedSourceUrls,
    allowedContentIds,
  )?.reason ?? null;
}

export function filterSourceMappings(
  draft: GeneratedDraftSchema,
  allowedSourceUrls: string[],
): GeneratedDraft {
  const allowed = new Set(
    allowedSourceUrls.map((url) => url.trim().toLowerCase()),
  );

  const filteredMappings = draft.sourceMappings
    .map((mapping) => ({
      ...mapping,
      sourceUrls: mapping.sourceUrls.filter((url) =>
        allowed.has(url.trim().toLowerCase()),
      ),
    }))
    .filter((mapping) => mapping.sourceUrls.length > 0);

  const filteredLinks = draft.internalLinks.filter((link) =>
    ["article", "tutorial", "lab"].includes(link.contentType),
  );

  return {
    ...draft,
    sourceMappings: filteredMappings,
    internalLinks: filteredLinks,
  } as GeneratedDraft;
}
