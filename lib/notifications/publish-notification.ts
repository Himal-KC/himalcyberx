import "server-only";

import {
  buildContentNotificationUrl,
  type ContentNotificationEmailInput,
} from "@/lib/email/templates/content-notification";
import type { ContentNotificationContentType } from "@/lib/notifications/constants";
import {
  claimContentNotificationRecord,
  runClaimedContentNotificationBroadcast,
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
  published_at: string | null;
  status: string;
}

export type PublishNotificationContent =
  | (PublishNotificationContentBase & { excerpt: string })
  | (PublishNotificationContentBase & { description: string });

function getPublishNotificationDescription(
  content: PublishNotificationContent,
): string {
  if ("excerpt" in content) {
    return content.excerpt;
  }

  return content.description;
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

function buildPublishNotificationEmailInput(
  contentType: ContentNotificationContentType,
  next: PublishNotificationContent,
): ContentNotificationEmailInput {
  return {
    contentType,
    title: next.title,
    description: getPublishNotificationDescription(next),
    url: buildContentNotificationUrl(contentType, next.slug),
    featuredImage: next.featured_image,
    publishedAt: next.published_at,
  };
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

  const recordId = await claimContentNotificationRecord({
    contentType,
    contentId: next.id,
  });

  if (!recordId) {
    return;
  }

  await runClaimedContentNotificationBroadcast({
    recordId,
    emailInput: buildPublishNotificationEmailInput(contentType, next),
  });
}
