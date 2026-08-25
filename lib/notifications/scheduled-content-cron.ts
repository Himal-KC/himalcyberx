import "server-only";

import {
  isArticlePubliclyAvailable,
  isPublishedAtPubliclyAvailable,
} from "@/lib/articles/publishing";
import type { ContentNotificationContentType } from "@/lib/notifications/constants";
import {
  CRON_NOTIFICATION_CANDIDATES_PER_TYPE,
  CRON_NOTIFICATION_MAX_ITEMS_PER_RUN,
} from "@/lib/notifications/constants";
import {
  deliverPublicContentNotification,
  type CronNotificationContentRow,
  type PublishNotificationContent,
} from "@/lib/notifications/publish-notification";
import {
  getContentNotificationsEnabledAt,
  isPublishedAtEligibleForCronNotification,
} from "@/lib/notifications/rollout";
import type { ArticleStatus } from "@/lib/supabase/types";
import { createServiceServerClient, hasServiceRoleEnv } from "@/lib/supabase/service-server";

export interface CronPublishNotificationsSummary {
  processed: number;
  sent: number;
  partial: number;
  failed: number;
  skipped: number;
  disabled?: boolean;
  reason?: string;
}

interface CronCandidate {
  contentType: ContentNotificationContentType;
  content: PublishNotificationContent;
}

function logCronFailure(message: string): void {
  console.error("[notifications:cron]", message);
}

function createEmptySummary(
  overrides: Partial<CronPublishNotificationsSummary> = {},
): CronPublishNotificationsSummary {
  return {
    processed: 0,
    sent: 0,
    partial: 0,
    failed: 0,
    skipped: 0,
    ...overrides,
  };
}

function isRowPubliclyAvailable(
  contentType: ContentNotificationContentType,
  row: CronNotificationContentRow,
  now: Date,
): boolean {
  if (row.status !== "published") {
    return false;
  }

  if (contentType === "article") {
    return isArticlePubliclyAvailable(
      {
        status: row.status as ArticleStatus,
        published_at: row.published_at,
      },
      now,
    );
  }

  return isPublishedAtPubliclyAvailable(row.published_at, now);
}

async function getNotifiedContentIds(
  contentType: ContentNotificationContentType,
  contentIds: string[],
): Promise<Set<string>> {
  if (contentIds.length === 0) {
    return new Set();
  }

  const supabase = createServiceServerClient();
  const { data, error } = await supabase
    .from("content_notifications")
    .select("content_id")
    .eq("content_type", contentType)
    .eq("notification_type", "published")
    .in("content_id", contentIds);

  if (error) {
    logCronFailure(`notification lookup failed for ${contentType}`);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.content_id));
}

async function fetchArticleCandidates(
  nowIso: string,
  rolloutIso: string,
): Promise<CronNotificationContentRow[]> {
  const supabase = createServiceServerClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, featured_image, featured_image_alt, published_at, status")
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", nowIso)
    .gte("published_at", rolloutIso)
    .order("published_at", { ascending: true })
    .limit(CRON_NOTIFICATION_CANDIDATES_PER_TYPE);

  if (error) {
    logCronFailure("article candidate query failed");
    return [];
  }

  return data ?? [];
}

async function fetchLabCandidates(
  nowIso: string,
  rolloutIso: string,
): Promise<CronNotificationContentRow[]> {
  const supabase = createServiceServerClient();
  const { data, error } = await supabase
    .from("labs")
    .select("id, slug, title, description, featured_image, published_at, status")
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", nowIso)
    .gte("published_at", rolloutIso)
    .order("published_at", { ascending: true })
    .limit(CRON_NOTIFICATION_CANDIDATES_PER_TYPE);

  if (error) {
    logCronFailure("lab candidate query failed");
    return [];
  }

  return data ?? [];
}

async function fetchTutorialCandidates(
  nowIso: string,
  rolloutIso: string,
): Promise<CronNotificationContentRow[]> {
  const supabase = createServiceServerClient();
  const { data, error } = await supabase
    .from("tutorials")
    .select("id, slug, title, description, featured_image, published_at, status")
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", nowIso)
    .gte("published_at", rolloutIso)
    .order("published_at", { ascending: true })
    .limit(CRON_NOTIFICATION_CANDIDATES_PER_TYPE);

  if (error) {
    logCronFailure("tutorial candidate query failed");
    return [];
  }

  return data ?? [];
}

function interleaveCandidates(
  articles: CronNotificationContentRow[],
  labs: CronNotificationContentRow[],
  tutorials: CronNotificationContentRow[],
): CronCandidate[] {
  const queues: Array<{
    contentType: ContentNotificationContentType;
    rows: CronNotificationContentRow[];
  }> = [
    { contentType: "article", rows: [...articles] },
    { contentType: "lab", rows: [...labs] },
    { contentType: "tutorial", rows: [...tutorials] },
  ];

  const candidates: CronCandidate[] = [];
  let index = 0;

  while (queues.some((entry) => entry.rows.length > 0)) {
    const queue = queues[index % queues.length];
    const row = queue.rows.shift();

    if (row) {
      candidates.push({
        contentType: queue.contentType,
        content: row,
      });
    }

    index += 1;
  }

  return candidates;
}

async function filterUnnotifiedCandidates(
  candidates: CronCandidate[],
): Promise<CronCandidate[]> {
  const grouped = new Map<ContentNotificationContentType, CronCandidate[]>();

  for (const candidate of candidates) {
    const existing = grouped.get(candidate.contentType) ?? [];
    existing.push(candidate);
    grouped.set(candidate.contentType, existing);
  }

  const filtered: CronCandidate[] = [];

  for (const [contentType, items] of grouped) {
    const notifiedIds = await getNotifiedContentIds(
      contentType,
      items.map((item) => item.content.id),
    );

    for (const item of items) {
      if (!notifiedIds.has(item.content.id)) {
        filtered.push(item);
      }
    }
  }

  return filtered;
}

function recordDeliveryOutcome(
  summary: CronPublishNotificationsSummary,
  outcome: "sent" | "partial" | "failed" | "skipped",
): void {
  if (outcome === "skipped") {
    summary.skipped += 1;
    return;
  }

  summary.processed += 1;
  summary[outcome] += 1;
}

export async function runScheduledContentNotificationCron(
  now: Date = new Date(),
): Promise<CronPublishNotificationsSummary> {
  const rolloutAt = getContentNotificationsEnabledAt();
  if (!rolloutAt) {
    logCronFailure("CONTENT_NOTIFICATIONS_ENABLED_AT is not configured");
    return createEmptySummary({
      disabled: true,
      reason: "rollout_not_configured",
    });
  }

  if (!hasServiceRoleEnv()) {
    logCronFailure("service role environment is not configured");
    return createEmptySummary({
      disabled: true,
      reason: "service_role_not_configured",
    });
  }

  const nowIso = now.toISOString();
  const rolloutIso = rolloutAt.toISOString();

  const [articles, labs, tutorials] = await Promise.all([
    fetchArticleCandidates(nowIso, rolloutIso),
    fetchLabCandidates(nowIso, rolloutIso),
    fetchTutorialCandidates(nowIso, rolloutIso),
  ]);

  const interleaved = interleaveCandidates(articles, labs, tutorials);

  const candidates = await filterUnnotifiedCandidates(interleaved);
  const summary = createEmptySummary();
  let deliveriesAttempted = 0;

  for (const candidate of candidates) {
    if (deliveriesAttempted >= CRON_NOTIFICATION_MAX_ITEMS_PER_RUN) {
      break;
    }

    const row = candidate.content as CronNotificationContentRow;
    if (
      !isRowPubliclyAvailable(candidate.contentType, row, now) ||
      !isPublishedAtEligibleForCronNotification(row.published_at, rolloutAt)
    ) {
      summary.skipped += 1;
      continue;
    }

    try {
      const result = await deliverPublicContentNotification({
        contentType: candidate.contentType,
        content: candidate.content,
      });
      recordDeliveryOutcome(summary, result.outcome);

      if (result.outcome !== "skipped") {
        deliveriesAttempted += 1;
      }
    } catch {
      logCronFailure(
        `unexpected delivery failure for ${candidate.contentType}:${candidate.content.id}`,
      );
      summary.processed += 1;
      summary.failed += 1;
      deliveriesAttempted += 1;
    }
  }

  return summary;
}
