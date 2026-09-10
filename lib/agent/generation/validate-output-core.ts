import type { GeneratedDraftSchema } from "@/lib/agent/generation/schemas";
import type { GeneratedDraft } from "@/lib/agent/generation/types";

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
