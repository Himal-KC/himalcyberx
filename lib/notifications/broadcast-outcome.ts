import type { ContentNotificationStatus } from "@/lib/notifications/constants";

export interface ContentNotificationSendCounts {
  attempted: number;
  succeeded: number;
  failed: number;
}

export interface ResolvedContentNotificationOutcome {
  status: ContentNotificationStatus;
  sentAt: string | null;
  lastError: string | null;
}

export function resolveContentNotificationOutcome(
  summary: ContentNotificationSendCounts,
  now: Date = new Date(),
): ResolvedContentNotificationOutcome {
  if (summary.attempted === 0) {
    return {
      status: "sent",
      sentAt: now.toISOString(),
      lastError: null,
    };
  }

  if (summary.succeeded === summary.attempted) {
    return {
      status: "sent",
      sentAt: now.toISOString(),
      lastError: null,
    };
  }

  if (summary.succeeded === 0) {
    return {
      status: "failed",
      sentAt: null,
      lastError: `All ${summary.attempted} recipient send(s) failed`,
    };
  }

  return {
    status: "partial",
    sentAt: null,
    lastError: `${summary.failed} of ${summary.attempted} recipient send(s) failed`,
  };
}
