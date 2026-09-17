import { LEARNER_AUTH_CALLBACK_PATH } from "./constants.ts";
import { getSafeRedirectPath } from "./redirects.ts";
import { getSiteUrl } from "../seo/site-url.ts";

export function getAuthCallbackUrl(nextPath?: string): string {
  const siteUrl = getSiteUrl();
  const next = getSafeRedirectPath(nextPath);
  const params = new URLSearchParams({ next });
  return `${siteUrl}${LEARNER_AUTH_CALLBACK_PATH}?${params.toString()}`;
}

export function resolveAuthRedirectUrl(
  requestUrl: string,
  nextPath: unknown,
): string {
  const safePath = getSafeRedirectPath(nextPath);
  const siteUrl = getSiteUrl();

  try {
    const requestOrigin = new URL(requestUrl).origin;
    const siteOrigin = new URL(siteUrl).origin;
    const requestHost = new URL(requestUrl).hostname;

    if (requestOrigin === siteOrigin) {
      return `${requestOrigin}${safePath}`;
    }

    if (requestHost === "localhost" || requestHost === "127.0.0.1") {
      return `${requestOrigin}${safePath}`;
    }

    return `${siteOrigin}${safePath}`;
  } catch {
    return `${siteUrl}${safePath}`;
  }
}

export function isAllowedAuthCallbackCode(code: string | null): boolean {
  if (!code) {
    return false;
  }

  return /^[A-Za-z0-9._~+/-]+$/.test(code) && code.length <= 2048;
}
