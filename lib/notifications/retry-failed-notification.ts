import "server-only";

import type { ContentNotificationEmailInput } from "@/lib/email/templates/content-notification";
import type { ContentNotificationContentType } from "@/lib/notifications/constants";
import {
  claimFailedContentNotificationForRetry,
  deliverContentNotificationBroadcast,
} from "@/lib/notifications/content-notifications";
import { hasServiceRoleEnv } from "@/lib/supabase/service-server";

export type RetryFailedContentNotificationResult =
  | { ok: true; recordId: string }
  | { ok: false; reason: "not_retryable" | "service_unavailable" };

/**
 * Retries a previously failed notification broadcast.
 *
 * Safe to call from a future admin server action or internal maintenance script.
 * Not wired to any public route or admin UI in Stage 2B.
 *
 * Example (future admin action):
 * ```ts
 * import { retryFailedContentNotification } from "@/lib/notifications/retry-failed-notification";
 *
 * const result = await retryFailedContentNotification({
 *   contentType: "article",
 *   contentId: article.id,
 *   emailInput: {
 *     contentType: "article",
 *     title: article.title,
 *     description: article.excerpt,
 *     url: buildContentNotificationUrl("article", article.slug),
 *     featuredImage: article.featured_image,
 *     publishedAt: article.published_at,
 *   },
 * });
 * ```
 *
 * Retry rules:
 * - only when status = failed AND sent_count = 0
 * - atomically transitions failed -> sending before delivery
 * - partial broadcasts are never auto-retried (manual recovery required)
 */
export async function retryFailedContentNotification({
  contentType,
  contentId,
  emailInput,
}: {
  contentType: ContentNotificationContentType;
  contentId: string;
  emailInput: ContentNotificationEmailInput;
}): Promise<RetryFailedContentNotificationResult> {
  if (!hasServiceRoleEnv()) {
    return { ok: false, reason: "service_unavailable" };
  }

  const recordId = await claimFailedContentNotificationForRetry({
    contentType,
    contentId,
  });

  if (!recordId) {
    return { ok: false, reason: "not_retryable" };
  }

  await deliverContentNotificationBroadcast({ recordId, emailInput });
  return { ok: true, recordId };
}
