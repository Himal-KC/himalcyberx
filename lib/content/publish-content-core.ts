import "server-only";

import { revalidatePath } from "next/cache";
import { resolvePublishedAt } from "@/lib/articles/validation";
import {
  resolveLabPublishedAt,
} from "@/lib/labs/validation";
import {
  deliverPublicContentNotification,
  notifySubscribersOfNewlyPublicContent,
  type PublishNotificationContent,
  type PublicContentNotificationOutcome,
} from "@/lib/notifications/publish-notification";
import {
  shouldSendLabOrTutorialPublishedNotification,
  shouldSendPublishedNotification,
} from "@/lib/notifications/publish-transition";
import {
  resolveTutorialPublishedAt,
} from "@/lib/tutorials/validation";
import type { AgentContentType } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PublishedContentRow {
  id: string;
  slug: string;
  title: string;
  featured_image: string | null;
  featured_image_alt?: string | null;
  published_at: string | null;
  status: string;
  excerpt?: string;
  description?: string;
}

export interface PublishDraftContentResult {
  ok: true;
  previous: { status: string; published_at: string | null };
  published: PublishedContentRow;
  notificationOutcome: PublicContentNotificationOutcome | "skipped";
}

export interface PublishDraftContentFailure {
  ok: false;
  code: "CONTENT_NOT_DRAFT" | "ALREADY_PUBLISHED" | "PUBLISH_FAILED";
  message: string;
  published?: PublishedContentRow;
}

export type PublishDraftContentOutcome =
  | PublishDraftContentResult
  | PublishDraftContentFailure;

function articleSelectFields() {
  return "id, slug, title, excerpt, featured_image, featured_image_alt, published_at, status";
}

function tutorialSelectFields() {
  return "id, slug, title, description, featured_image, published_at, status";
}

function labSelectFields() {
  return "id, slug, title, description, featured_image, published_at, status";
}

function tableForContentType(contentType: AgentContentType): string {
  switch (contentType) {
    case "article":
      return "articles";
    case "tutorial":
      return "tutorials";
    case "lab":
      return "labs";
  }
}

function selectFieldsForContentType(contentType: AgentContentType): string {
  switch (contentType) {
    case "article":
      return articleSelectFields();
    case "tutorial":
      return tutorialSelectFields();
    case "lab":
      return labSelectFields();
  }
}

function resolvePublishedAtForContentType(
  contentType: AgentContentType,
  existingPublishedAt: string | null,
): string {
  switch (contentType) {
    case "article":
      return resolvePublishedAt("published", "", existingPublishedAt) ?? new Date().toISOString();
    case "tutorial":
      return resolveTutorialPublishedAt("published", existingPublishedAt) ?? new Date().toISOString();
    case "lab":
      return resolveLabPublishedAt("published", existingPublishedAt) ?? new Date().toISOString();
  }
}

function toNotificationContent(
  contentType: AgentContentType,
  row: PublishedContentRow,
): PublishNotificationContent {
  if (contentType === "article") {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? "",
      featured_image: row.featured_image,
      featured_image_alt: row.featured_image_alt ?? null,
      published_at: row.published_at,
      status: row.status,
    };
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    featured_image: row.featured_image,
    published_at: row.published_at,
    status: row.status,
  };
}

async function deliverNotificationForPublish(input: {
  contentType: AgentContentType;
  previous: { status: string; published_at: string | null };
  published: PublishedContentRow;
}): Promise<PublicContentNotificationOutcome | "skipped"> {
  const previousState = {
    status: input.previous.status,
    published_at: input.previous.published_at,
  };
  const nextState = {
    status: input.published.status,
    published_at: input.published.published_at,
  };
  const shouldNotify =
    input.contentType === "article"
      ? shouldSendPublishedNotification({ previous: previousState, next: nextState })
      : shouldSendLabOrTutorialPublishedNotification({
          previous: previousState,
          next: nextState,
        });

  if (!shouldNotify) {
    return "skipped";
  }

  const outcome = await deliverPublicContentNotification({
    contentType: input.contentType,
    content: toNotificationContent(input.contentType, input.published),
  });

  return outcome.outcome;
}

export async function publishDraftContentRow(input: {
  supabase: SupabaseClient;
  contentType: AgentContentType;
  contentId: string;
}): Promise<PublishDraftContentOutcome> {
  const table = tableForContentType(input.contentType);
  const selectFields = selectFieldsForContentType(input.contentType);

  const { data: existing, error: loadError } = await input.supabase
    .from(table)
    .select(selectFields)
    .eq("id", input.contentId)
    .maybeSingle();

  if (loadError || !existing) {
    return {
      ok: false,
      code: "PUBLISH_FAILED",
      message: "Unable to load linked content for publishing.",
    };
  }

  const current = existing as unknown as PublishedContentRow;

  if (current.status === "published") {
    return {
      ok: false,
      code: "ALREADY_PUBLISHED",
      message: "Content is already published.",
      published: current,
    };
  }

  if (current.status !== "draft") {
    return {
      ok: false,
      code: "CONTENT_NOT_DRAFT",
      message: "Only draft content can be published.",
    };
  }

  const previous = {
    status: current.status,
    published_at: current.published_at,
  };
  const publishedAt = resolvePublishedAtForContentType(
    input.contentType,
    current.published_at,
  );

  const { data: published, error: updateError } = await input.supabase
    .from(table)
    .update({
      status: "published",
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.contentId)
    .eq("status", "draft")
    .select(selectFields)
    .maybeSingle();

  if (updateError) {
    return {
      ok: false,
      code: "PUBLISH_FAILED",
      message: "Unable to publish content. Please try again.",
    };
  }

  if (!published) {
    const { data: refreshed } = await input.supabase
      .from(table)
      .select(selectFields)
      .eq("id", input.contentId)
      .maybeSingle();

    if (refreshed && (refreshed as unknown as PublishedContentRow).status === "published") {
      return {
        ok: false,
        code: "ALREADY_PUBLISHED",
        message: "Content is already published.",
        published: refreshed as unknown as PublishedContentRow,
      };
    }

    return {
      ok: false,
      code: "PUBLISH_FAILED",
      message: "Unable to publish content because it is no longer a draft.",
    };
  }

  const publishedRow = published as unknown as PublishedContentRow;
  const notificationOutcome = await deliverNotificationForPublish({
    contentType: input.contentType,
    previous,
    published: publishedRow,
  });

  return {
    ok: true,
    previous,
    published: publishedRow,
    notificationOutcome,
  };
}

export function revalidatePublishedContentPaths(
  contentType: AgentContentType,
  slug: string,
  previousSlug?: string,
): void {
  switch (contentType) {
    case "article":
      revalidatePath("/");
      revalidatePath("/admin/articles");
      revalidatePath("/news");
      revalidatePath("/threats");
      revalidatePath("/ai-security");
      revalidatePath("/search");
      revalidatePath(`/articles/${slug}`);
      if (previousSlug && previousSlug !== slug) {
        revalidatePath(`/articles/${previousSlug}`);
      }
      break;
    case "tutorial":
      revalidatePath("/admin/tutorials");
      revalidatePath("/tutorials");
      revalidatePath(`/tutorials/${slug}`);
      if (previousSlug && previousSlug !== slug) {
        revalidatePath(`/tutorials/${previousSlug}`);
      }
      break;
    case "lab":
      revalidatePath("/admin/labs");
      revalidatePath("/cyber-lab");
      revalidatePath(`/cyber-lab/${slug}`);
      if (previousSlug && previousSlug !== slug) {
        revalidatePath(`/cyber-lab/${previousSlug}`);
      }
      break;
  }
}

/** Manual CMS actions can keep using notifySubscribersOfNewlyPublicContent directly. */
export { notifySubscribersOfNewlyPublicContent };
