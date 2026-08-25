export const NEWSLETTER_FROM_EMAIL = "HimalCyberX <updates@himalcyberx.com>";

export const WELCOME_EMAIL_SUBJECT = "Welcome to HimalCyberX";

export const HIMALCYBERX_SITE_URL = "https://himalcyberx.com";

/** Conservative pacing for broadcast sends (~7 req/s at 140ms). */
export const RESEND_SEND_INTERVAL_MS = 140;

export const RESEND_MAX_RETRY_ATTEMPTS = 3;

export const RESEND_RATE_LIMIT_BACKOFF_MS = [500, 1000, 2000] as const;
