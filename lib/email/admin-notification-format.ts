import {
  ADMIN_CONTACT_NOTIFICATION_SUBJECT_PREFIX,
  CONTACT_FROM_EMAIL,
  CONTACT_REPLY_TO_EMAIL,
  NEWSLETTER_FROM_EMAIL,
} from "./constants.ts";
import { isValidEmail, normalizeEmail } from "../form-validation.ts";

const UTC_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Trusted admin mailbox for new-subscriber and contact-message alerts.
 *
 * Prefer Site Settings `contact_email` (canonical public HCX contact).
 * Fall back to the existing server-side contact identity used for Reply-To.
 *
 * `HCX_ADMIN_EMAIL` is intentionally unused: it is an admin-login allowlist,
 * not a notification mailbox, and may be a personal address.
 */
export function resolveAdminNotificationRecipient(options: {
  siteContactEmail?: string | null;
  fallbackEmail?: string | null;
}): string | null {
  const configured = normalizeTrustedEmail(options.siteContactEmail);
  if (configured) {
    return configured;
  }

  const fallback = normalizeTrustedEmail(
    options.fallbackEmail ?? CONTACT_REPLY_TO_EMAIL,
  );
  return fallback;
}

export function normalizeTrustedEmail(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const normalized = normalizeEmail(value);
  if (!isSafeEmailAddress(normalized)) {
    return null;
  }

  return normalized;
}

export function isSafeEmailAddress(value: string): boolean {
  if (!value || /[\r\n\0]/.test(value)) {
    return false;
  }

  return isValidEmail(value);
}

export function toSafeReplyToAddress(
  value: string | null | undefined,
): string | undefined {
  const normalized = normalizeTrustedEmail(value);
  return normalized ?? undefined;
}

export function formatAdminNotificationTimestamp(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = date.getUTCDate();
  const month = UTC_MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const hour24 = date.getUTCHours();
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${day} ${month} ${year}, ${hour12}:${minutes} ${ampm}`;
}

export function formatSubscriberSourceLabel(source: string): string {
  if (source === "newsletter") {
    return "Newsletter";
  }

  if (source === "modal") {
    return "Modal";
  }

  return "Website";
}

export function sanitizeEmailSubjectFragment(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

export function buildAdminContactNotificationSubject(subject: string): string {
  const safeSubject = sanitizeEmailSubjectFragment(subject);
  if (!safeSubject) {
    return ADMIN_CONTACT_NOTIFICATION_SUBJECT_PREFIX;
  }

  return `${ADMIN_CONTACT_NOTIFICATION_SUBJECT_PREFIX} — ${safeSubject}`;
}

export function buildAdminSubscriberDeliveryMeta(adminEmail: string): {
  from: string;
  to: string;
} {
  return {
    from: NEWSLETTER_FROM_EMAIL,
    to: adminEmail,
  };
}

export function buildAdminContactDeliveryMeta(input: {
  adminEmail: string;
  visitorEmail: string;
}): {
  from: string;
  to: string;
  replyTo?: string;
  headers?: Record<string, string>;
} {
  const replyTo = toSafeReplyToAddress(input.visitorEmail);

  return {
    from: CONTACT_FROM_EMAIL,
    to: input.adminEmail,
    ...(replyTo
      ? {
          replyTo,
          headers: {
            "Reply-To": replyTo,
          },
        }
      : {}),
  };
}
