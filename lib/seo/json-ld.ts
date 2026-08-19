/**
 * Safely serialize JSON-LD for embedding in a script tag.
 * Escapes `<` to prevent script injection from user-controlled strings.
 */
export function serializeJsonLd(
  data: Record<string, unknown> | Record<string, unknown>[],
): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function toAbsoluteUrl(
  url: string | null | undefined,
  siteUrl: string,
): string | undefined {
  if (!url?.trim()) {
    return undefined;
  }

  const trimmed = url.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `${siteUrl}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}
