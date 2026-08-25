import "server-only";

const ISO_8601_UTC_EXAMPLE = "2026-08-25T00:00:00Z";

export function getContentNotificationsEnabledAt(): Date | null {
  const raw = process.env.CONTENT_NOTIFICATIONS_ENABLED_AT?.trim();
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    console.error(
      "[notifications:cron] CONTENT_NOTIFICATIONS_ENABLED_AT is not a valid ISO timestamp",
    );
    return null;
  }

  return parsed;
}

export function isContentNotificationsRolloutConfigured(): boolean {
  return getContentNotificationsEnabledAt() !== null;
}

export function getContentNotificationsRolloutIso(): string | null {
  return getContentNotificationsEnabledAt()?.toISOString() ?? null;
}

export function isPublishedAtEligibleForCronNotification(
  publishedAt: string | null | undefined,
  enabledAt: Date,
): boolean {
  if (!publishedAt) {
    return false;
  }

  const publishedDate = new Date(publishedAt);
  if (Number.isNaN(publishedDate.getTime())) {
    return false;
  }

  return publishedDate.getTime() >= enabledAt.getTime();
}

export const CONTENT_NOTIFICATIONS_ROLLOUT_ENV = "CONTENT_NOTIFICATIONS_ENABLED_AT";

export const CONTENT_NOTIFICATIONS_ROLLOUT_FORMAT = ISO_8601_UTC_EXAMPLE;
