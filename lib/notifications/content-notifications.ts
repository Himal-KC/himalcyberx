import "server-only";

import type { ContentNotificationEmailInput } from "@/lib/email/templates/content-notification";
import {
  sendContentNotificationBroadcast,
  type ContentNotificationSendSummary,
} from "@/lib/email/send-content-notification";
import { resolveContentNotificationOutcome } from "@/lib/notifications/broadcast-outcome";
import type {
  ContentNotificationBroadcastType,
  ContentNotificationContentType,
} from "@/lib/notifications/constants";
import { createServiceServerClient, hasServiceRoleEnv } from "@/lib/supabase/service-server";

function logNotificationFailure(message: string): void {
  console.error("[notifications:content]", message);
}

function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

function emptySendSummary(recipientCount: number): ContentNotificationSendSummary {
  return {
    attempted: recipientCount,
    succeeded: 0,
    failed: 0,
  };
}

/**
 * Inserts a pending notification record. The unique constraint prevents duplicate
 * broadcasts for the same content item. Existing records in any terminal or
 * in-progress state cause a no-op return.
 */
export async function claimContentNotificationRecord({
  contentType,
  contentId,
  notificationType = "published",
}: {
  contentType: ContentNotificationContentType;
  contentId: string;
  notificationType?: ContentNotificationBroadcastType;
}): Promise<string | null> {
  if (!hasServiceRoleEnv()) {
    logNotificationFailure("service role environment is not configured");
    return null;
  }

  try {
    const supabase = createServiceServerClient();
    const { data, error } = await supabase
      .from("content_notifications")
      .insert({
        content_type: contentType,
        content_id: contentId,
        notification_type: notificationType,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      if (isUniqueViolation(error)) {
        return null;
      }

      logNotificationFailure(error.message);
      return null;
    }

    return data.id;
  } catch {
    logNotificationFailure("unexpected claim failure");
    return null;
  }
}

/**
 * Atomically transitions a failed notification with zero successful sends into
 * sending. Used only by explicit retry — never by normal publish/edit flows.
 */
export async function claimFailedContentNotificationForRetry({
  contentType,
  contentId,
  notificationType = "published",
}: {
  contentType: ContentNotificationContentType;
  contentId: string;
  notificationType?: ContentNotificationBroadcastType;
}): Promise<string | null> {
  if (!hasServiceRoleEnv()) {
    logNotificationFailure("service role environment is not configured");
    return null;
  }

  try {
    const supabase = createServiceServerClient();
    const { data, error } = await supabase
      .from("content_notifications")
      .update({ status: "sending" })
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("notification_type", notificationType)
      .eq("status", "failed")
      .eq("sent_count", 0)
      .select("id")
      .maybeSingle();

    if (error) {
      logNotificationFailure(error.message);
      return null;
    }

    return data?.id ?? null;
  } catch {
    logNotificationFailure("unexpected failed-notification retry claim failure");
    return null;
  }
}

export async function markContentNotificationSending(
  recordId: string,
): Promise<boolean> {
  if (!hasServiceRoleEnv()) {
    return false;
  }

  try {
    const supabase = createServiceServerClient();
    const { data, error } = await supabase
      .from("content_notifications")
      .update({ status: "sending" })
      .eq("id", recordId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error) {
      logNotificationFailure(error.message);
      return false;
    }

    return Boolean(data?.id);
  } catch {
    logNotificationFailure("unexpected sending transition failure");
    return false;
  }
}

export async function finalizeContentNotificationRecord(
  recordId: string,
  summary: ContentNotificationSendSummary,
): Promise<void> {
  if (!hasServiceRoleEnv()) {
    return;
  }

  const outcome = resolveContentNotificationOutcome(summary);

  try {
    const supabase = createServiceServerClient();
    const { error } = await supabase
      .from("content_notifications")
      .update({
        status: outcome.status,
        attempted_count: summary.attempted,
        sent_count: summary.succeeded,
        failed_count: summary.failed,
        last_error: outcome.lastError,
        sent_at: outcome.sentAt,
      })
      .eq("id", recordId);

    if (error) {
      logNotificationFailure(error.message);
    }
  } catch {
    logNotificationFailure("unexpected finalize failure");
  }
}

export async function getActiveSubscriberEmails(): Promise<string[]> {
  if (!hasServiceRoleEnv()) {
    logNotificationFailure("service role environment is not configured");
    return [];
  }

  try {
    const supabase = createServiceServerClient();
    const { data, error } = await supabase
      .from("subscribers")
      .select("email")
      .eq("status", "active")
      .order("subscribed_at", { ascending: true });

    if (error) {
      logNotificationFailure(error.message);
      return [];
    }

    return (data ?? [])
      .map((row) => row.email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email));
  } catch {
    logNotificationFailure("unexpected subscriber lookup failure");
    return [];
  }
}

/**
 * Runs recipient delivery for a record already in the sending state.
 */
export async function deliverContentNotificationBroadcast({
  recordId,
  emailInput,
}: {
  recordId: string;
  emailInput: ContentNotificationEmailInput;
}): Promise<ContentNotificationSendSummary> {
  const recipients = await getActiveSubscriberEmails();
  let summary = emptySendSummary(recipients.length);

  try {
    summary = await sendContentNotificationBroadcast(recipients, emailInput);
  } catch {
    logNotificationFailure(`unexpected broadcast failure for notification ${recordId}`);
    summary = {
      attempted: recipients.length,
      succeeded: summary.succeeded,
      failed: recipients.length - summary.succeeded,
    };
  }

  await finalizeContentNotificationRecord(recordId, summary);
  return summary;
}

/**
 * Full first-time delivery path: pending -> sending -> broadcast -> finalize.
 */
export async function runClaimedContentNotificationBroadcast({
  recordId,
  emailInput,
}: {
  recordId: string;
  emailInput: ContentNotificationEmailInput;
}): Promise<void> {
  const marked = await markContentNotificationSending(recordId);
  if (!marked) {
    logNotificationFailure(
      `unable to transition notification ${recordId} from pending to sending`,
    );
    return;
  }

  await deliverContentNotificationBroadcast({ recordId, emailInput });
}
