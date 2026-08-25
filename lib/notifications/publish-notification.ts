import "server-only";

import { resolveContentNotificationOutcome } from "@/lib/notifications/broadcast-outcome";
import type { ContentNotificationStatus } from "@/lib/notifications/constants";
import {
  buildContentNotificationUrl,
  type ContentNotificationEmailInput,
} from "@/lib/email/templates/content-notification";
import type { ContentNotificationContentType } from "@/lib/notifications/constants";
import {
  claimContentNotificationRecord,
  deliverContentNotificationBroadcast,
  markContentNotificationSending,
} from "@/lib/notifications/content-notifications";
import {
  shouldSendLabOrTutorialPublishedNotification,
  shouldSendPublishedNotification,
  type PublishTransitionState,
} from "@/lib/notifications/publish-transition";

export interface PublishNotificationContentBase {
  id: string;
  slug: string;
  title: string;
  featured_image: string | null;
  featured_image_alt?: string | null;
  published_at: string | null;
  status: string;
}

export type PublishNotificationContent =
  | (PublishNotificationContentBase & { excerpt: string })
  | (PublishNotificationContentBase & { description: string });

export type PublicContentNotificationOutcome = Extract<
  ContentNotificationStatus,
  "sent" | "partial" | "failed"
>;

export type PublicContentNotificationResult =
  | { outcome: "skipped" }
  | { outcome: PublicContentNotificationOutcome };

function getPublishNotificationDescription(
  content: PublishNotificationContent,
): string {
  if ("excerpt" in content) {
    return content.excerpt;
  }

  return content.description;
}

export function buildPublishNotificationEmailInput(
  contentType: ContentNotificationContentType,
  content: PublishNotificationContent,
): ContentNotificationEmailInput {
  return {
    contentType,
    title: content.title,
    description: getPublishNotificationDescription(content),
    url: buildContentNotificationUrl(contentType, content.slug),
    featuredImage: content.featured_image,
    featuredImageAlt: content.featured_image_alt ?? null,
    publishedAt: content.published_at,
  };
}

function shouldNotifyForContentType(
  contentType: ContentNotificationContentType,
  previous: PublishTransitionState | null,
  next: PublishTransitionState,
): boolean {
  if (contentType === "article") {
    return shouldSendPublishedNotification({ previous, next });
  }

  return shouldSendLabOrTutorialPublishedNotification({ previous, next });
}

/**
 * Claims and delivers a one-time notification for publicly available content.
 * Reused by admin publish actions and the scheduled-content cron.
 */
export async function deliverPublicContentNotification({
  contentType,
  content,
}: {
  contentType: ContentNotificationContentType;
  content: PublishNotificationContent;
}): Promise<PublicContentNotificationResult> {
  const recordId = await claimContentNotificationRecord({
    contentType,
    contentId: content.id,
  });

  if (!recordId) {
    return { outcome: "skipped" };
  }

  const marked = await markContentNotificationSending(recordId);
  if (!marked) {
    return { outcome: "skipped" };
  }

  const summary = await deliverContentNotificationBroadcast({
    recordId,
    emailInput: buildPublishNotificationEmailInput(contentType, content),
  });

  const resolved = resolveContentNotificationOutcome(summary);
  if (
    resolved.status === "sent" ||
    resolved.status === "partial" ||
    resolved.status === "failed"
  ) {
    return { outcome: resolved.status };
  }

  return { outcome: "skipped" };
}

export async function notifySubscribersOfNewlyPublicContent({
  contentType,
  previous,
  next,
}: {
  contentType: ContentNotificationContentType;
  previous: PublishTransitionState | null;
  next: PublishNotificationContent;
}): Promise<void> {
  const previousState = previous
    ? { status: previous.status, published_at: previous.published_at }
    : null;
  const nextState = {
    status: next.status,
    published_at: next.published_at,
  };

  if (!shouldNotifyForContentType(contentType, previousState, nextState)) {
    return;
  }

  await deliverPublicContentNotification({
    contentType,
    content: next,
  });
}

export type CronNotificationContentRow = PublishNotificationContentBase &
  ({ excerpt: string } | { description: string });
