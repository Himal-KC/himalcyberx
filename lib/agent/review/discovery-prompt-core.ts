import type { AuthoritativeSourceRecord, ReviewContextPayload } from "./types";

export function filterDiscoveryOnlyContextsForPrompt(
  discoveryContexts: ReviewContextPayload["discoveryContexts"],
  authoritativeSources: AuthoritativeSourceRecord[],
): ReviewContextPayload["discoveryContexts"] {
  const authoritativeUrls = new Set(
    authoritativeSources.map((source) => source.url.trim().toLowerCase()),
  );

  return discoveryContexts.filter(
    (item) => !authoritativeUrls.has(item.url.trim().toLowerCase()),
  );
}
