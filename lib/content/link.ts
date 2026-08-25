const SAFE_URL_PATTERN = /^(https?:\/\/|mailto:)/i;

export function isSafeContentUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  if (/^\s*javascript:/i.test(trimmed)) {
    return false;
  }

  if (/^\s*data:/i.test(trimmed)) {
    return false;
  }

  if (/^\s*vbscript:/i.test(trimmed)) {
    return false;
  }

  return SAFE_URL_PATTERN.test(trimmed) || trimmed.startsWith("/");
}

export function normalizeContentLink(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  if (/^mailto:/i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
