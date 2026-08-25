export const CONTENT_NOTIFICATION_TYPES = [
  "article",
  "lab",
  "tutorial",
] as const;

export type ContentNotificationContentType =
  (typeof CONTENT_NOTIFICATION_TYPES)[number];

export const CONTENT_NOTIFICATION_BROADCAST_TYPES = ["published"] as const;

export type ContentNotificationBroadcastType =
  (typeof CONTENT_NOTIFICATION_BROADCAST_TYPES)[number];

export const CONTENT_NOTIFICATION_BATCH_SIZE = 25;

export const CRON_NOTIFICATION_MAX_ITEMS_PER_RUN = 20;

export const CRON_NOTIFICATION_CANDIDATES_PER_TYPE = 10;

export const CONTENT_NOTIFICATION_STATUSES = [
  "pending",
  "sending",
  "sent",
  "partial",
  "failed",
] as const;

export type ContentNotificationStatus =
  (typeof CONTENT_NOTIFICATION_STATUSES)[number];
