export const DEFAULT_ARTICLE_AUTHOR = "HimalCyberX Research";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isAuthorEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function resolvePublicAuthorDisplay(
  author: string | null | undefined,
  fallbackAuthor: string = DEFAULT_ARTICLE_AUTHOR,
): string {
  const trimmed = author?.trim() ?? "";

  if (!trimmed || isAuthorEmail(trimmed)) {
    return fallbackAuthor;
  }

  return trimmed;
}

export function resolveStoredArticleAuthor(
  author: string,
  fallbackAuthor: string = DEFAULT_ARTICLE_AUTHOR,
): string {
  const trimmed = author.trim();

  if (!trimmed || isAuthorEmail(trimmed)) {
    return fallbackAuthor;
  }

  return trimmed;
}
