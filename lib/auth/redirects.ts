import {
  LEARNER_DEFAULT_POST_AUTH_PATH,
  LEARNER_LOGIN_PATH,
} from "./constants.ts";

const ADMIN_PREFIX = "/admin";

function decodePathCandidate(value: string): string | null {
  let current = value;

  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) {
        return current;
      }
      current = decoded;
    } catch {
      return null;
    }
  }

  return current;
}

function isBlockedPath(pathname: string): boolean {
  const normalized = pathname.toLowerCase();
  return normalized === ADMIN_PREFIX || normalized.startsWith(`${ADMIN_PREFIX}/`);
}

/**
 * Returns a same-origin relative path, or the fallback.
 * Rejects protocol-relative URLs, backslashes, absolute URLs, and /admin.
 */
export function getSafeRedirectPath(
  value: unknown,
  fallback = LEARNER_DEFAULT_POST_AUTH_PATH,
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  const decoded = decodePathCandidate(trimmed);
  if (!decoded) {
    return fallback;
  }

  if (!decoded.startsWith("/")) {
    return fallback;
  }

  if (decoded.startsWith("//") || decoded.startsWith("/\\")) {
    return fallback;
  }

  if (decoded.includes("\\") || decoded.includes("://")) {
    return fallback;
  }

  const withoutHash = decoded.split("#")[0] ?? decoded;
  const pathname = withoutHash.split("?")[0] ?? withoutHash;

  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return fallback;
  }

  if (isBlockedPath(pathname)) {
    return fallback;
  }

  if (pathname === LEARNER_LOGIN_PATH) {
    return fallback;
  }

  return pathname;
}

export function buildLoginRedirectPath(nextPath: string): string {
  const safeNext = getSafeRedirectPath(nextPath);
  if (safeNext === LEARNER_DEFAULT_POST_AUTH_PATH) {
    return LEARNER_LOGIN_PATH;
  }

  return `${LEARNER_LOGIN_PATH}?next=${encodeURIComponent(safeNext)}`;
}
