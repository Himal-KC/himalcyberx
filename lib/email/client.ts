import "server-only";

import { Resend } from "resend";

export function getResendApiKey(): string | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  return apiKey || null;
}

export function createResendClient(): Resend | null {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

export function logEmailFailure(scope: string, error: unknown): void {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      console.error(`[email:${scope}]`, message);
      return;
    }
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "unknown error";

  console.error(`[email:${scope}]`, message);
}
