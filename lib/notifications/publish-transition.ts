import {
  isArticlePubliclyAvailable,
  isPublishedAtPubliclyAvailable,
} from "@/lib/articles/publishing";
import type { ArticleStatus } from "@/lib/supabase/types";

export interface PublishTransitionState {
  status: ArticleStatus | string;
  published_at: string | null;
}

export function isPublishedContentPubliclyAvailable(
  state: PublishTransitionState,
): boolean {
  if (state.status !== "published") {
    return false;
  }

  return isPublishedAtPubliclyAvailable(state.published_at);
}

export function shouldSendPublishedNotification({
  previous,
  next,
}: {
  previous: PublishTransitionState | null;
  next: PublishTransitionState;
}): boolean {
  const wasPublic = previous
    ? isArticlePubliclyAvailable({
        status: previous.status as ArticleStatus,
        published_at: previous.published_at,
      })
    : false;
  const isPublic = isArticlePubliclyAvailable({
    status: next.status as ArticleStatus,
    published_at: next.published_at,
  });

  return !wasPublic && isPublic;
}

export function shouldSendLabOrTutorialPublishedNotification({
  previous,
  next,
}: {
  previous: PublishTransitionState | null;
  next: PublishTransitionState;
}): boolean {
  const wasPublic = previous
    ? isPublishedContentPubliclyAvailable(previous)
    : false;
  const isPublic = isPublishedContentPubliclyAvailable(next);

  return !wasPublic && isPublic;
}
