import "server-only";

import { createResendClient, logEmailFailure } from "@/lib/email/client";
import {
  RESEND_MAX_RETRY_ATTEMPTS,
  RESEND_RATE_LIMIT_BACKOFF_MS,
} from "@/lib/email/constants";
import { sleep } from "@/lib/email/sleep";

export interface ResendEmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

interface ResendErrorShape {
  message?: string;
  statusCode?: number | null;
  name?: string;
}

const PERMANENT_RESEND_ERROR_NAMES = new Set([
  "validation_error",
  "invalid_from_address",
  "invalid_parameter",
  "invalid_attachment",
  "missing_required_field",
  "invalid_access",
  "invalid_api_key",
  "restricted_api_key",
  "missing_api_key",
  "not_found",
  "method_not_allowed",
  "invalid_idempotency_key",
  "invalid_idempotent_request",
  "concurrent_idempotent_requests",
  "invalid_region",
  "monthly_quota_exceeded",
  "daily_quota_exceeded",
]);

function getResendErrorShape(error: unknown): ResendErrorShape | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  return error as ResendErrorShape;
}

export function isResendRateLimitError(error: unknown): boolean {
  const shaped = getResendErrorShape(error);
  if (!shaped) {
    return false;
  }

  if (shaped.statusCode === 429) {
    return true;
  }

  if (shaped.name === "rate_limit_exceeded") {
    return true;
  }

  return typeof shaped.message === "string" &&
    /too many requests|rate limit/i.test(shaped.message);
}

export function isResendPermanentError(error: unknown): boolean {
  const shaped = getResendErrorShape(error);
  if (!shaped) {
    return false;
  }

  if (isResendRateLimitError(error)) {
    return false;
  }

  if (shaped.name && PERMANENT_RESEND_ERROR_NAMES.has(shaped.name)) {
    return true;
  }

  return typeof shaped.statusCode === "number" &&
    shaped.statusCode >= 400 &&
    shaped.statusCode < 500;
}

export function parseResendRetryAfterMs(
  headers: Record<string, string> | null | undefined,
): number | null {
  if (!headers) {
    return null;
  }

  const retryAfter =
    headers["retry-after"] ??
    headers["Retry-After"] ??
    headers["RETRY-AFTER"];

  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (!Number.isNaN(seconds) && seconds > 0) {
    return Math.ceil(seconds * 1000);
  }

  const retryAt = Date.parse(retryAfter);
  if (!Number.isNaN(retryAt)) {
    return Math.max(0, retryAt - Date.now());
  }

  return null;
}

function getRateLimitBackoffMs(
  attempt: number,
  headers: Record<string, string> | null | undefined,
): number {
  const retryAfterMs = parseResendRetryAfterMs(headers);
  if (retryAfterMs !== null) {
    return retryAfterMs;
  }

  return RESEND_RATE_LIMIT_BACKOFF_MS[
    Math.min(attempt - 1, RESEND_RATE_LIMIT_BACKOFF_MS.length - 1)
  ];
}

export async function sendResendEmailWithRetry(
  payload: ResendEmailPayload,
  logScope = "sendResendEmail",
): Promise<boolean> {
  const result = await sendResendEmailWithResult(payload, logScope);
  return result.ok;
}

export type ResendSendResult =
  | { ok: true; emailId: string | null }
  | { ok: false };

export async function sendResendEmailWithResult(
  payload: ResendEmailPayload,
  logScope = "sendResendEmail",
): Promise<ResendSendResult> {
  const resend = createResendClient();
  if (!resend) {
    logEmailFailure(logScope, "RESEND_API_KEY is not configured");
    return { ok: false };
  }

  for (let attempt = 1; attempt <= RESEND_MAX_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await resend.emails.send(payload);

      if (!response.error) {
        const emailId =
          response.data && typeof response.data.id === "string"
            ? response.data.id
            : null;
        return { ok: true, emailId };
      }

      if (isResendPermanentError(response.error)) {
        logEmailFailure(`${logScope}:recipient`, response.error);
        return { ok: false };
      }

      if (isResendRateLimitError(response.error)) {
        if (attempt >= RESEND_MAX_RETRY_ATTEMPTS) {
          logEmailFailure(logScope, "Resend rate limited request");
          return { ok: false };
        }

        logEmailFailure(logScope, "Resend rate limited request");
        await sleep(getRateLimitBackoffMs(attempt, response.headers));
        continue;
      }

      logEmailFailure(`${logScope}:recipient`, response.error);
      return { ok: false };
    } catch (error) {
      if (attempt >= RESEND_MAX_RETRY_ATTEMPTS) {
        logEmailFailure(`${logScope}:recipient`, error);
        return { ok: false };
      }

      await sleep(
        RESEND_RATE_LIMIT_BACKOFF_MS[
          Math.min(attempt - 1, RESEND_RATE_LIMIT_BACKOFF_MS.length - 1)
        ],
      );
    }
  }

  return { ok: false };
}
