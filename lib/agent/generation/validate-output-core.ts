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

export function validateDraftReferences(
  draft: GeneratedDraftSchema | GeneratedDraft,
  allowedSourceUrls: string[],
  allowedContentIds: Set<string>,
): string | null {
  const allowedUrls = new Set(
    allowedSourceUrls.map((url) => url.trim().toLowerCase()),
  );

  for (const mapping of draft.sourceMappings) {
    for (const url of mapping.sourceUrls) {
      if (!isValidHttpUrl(url)) {
        return "Generated output contained a malformed source URL.";
      }

      if (!allowedUrls.has(url.trim().toLowerCase())) {
        return "Generated output referenced a source URL outside the research allowlist.";
      }
    }
  }

  for (const link of draft.internalLinks) {
    if (!isValidUuid(link.contentId)) {
      return "Generated output contained a malformed internal link ID.";
    }

    if (!allowedContentIds.has(link.contentId)) {
      return "Generated output referenced an unknown internal link.";
    }
  }

  return null;
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
