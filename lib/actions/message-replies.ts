"use server";

import { revalidatePath } from "next/cache";
import { CONTACT_REPLY_TO_EMAIL } from "@/lib/email/constants";
import { sendContactReplyEmail } from "@/lib/email/send-contact-reply";
import { buildReplySubject } from "@/lib/messages/reply-subject";
import { isValidEmail, sanitizeText } from "@/lib/form-validation";
import {
  MESSAGE_REPLY_MAX_LENGTH,
  MESSAGE_REPLY_MIN_LENGTH,
} from "@/lib/messages/constants";
import {
  formatDevErrorMessage,
  getAuthenticatedServerClient,
  logSafeDbError,
} from "@/lib/supabase/admin-session";
import {
  createServiceServerClient,
  hasServiceRoleEnv,
} from "@/lib/supabase/service-server";

const DUPLICATE_REPLY_WINDOW_MS = 60_000;

const SEND_REPLY_ERROR_MESSAGE =
  "Unable to send reply. Please try again.";

const SERVICE_ROLE_ERROR_MESSAGE =
  "Reply storage is not configured. Please contact support.";

export async function sendMessageReply(
  messageId: string,
  body: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await getAuthenticatedServerClient("sendMessageReply");

  if (!auth.ok) {
    return { error: auth.error };
  }

  if (!hasServiceRoleEnv()) {
    return { error: SERVICE_ROLE_ERROR_MESSAGE };
  }

  const trimmedBody = sanitizeText(body, MESSAGE_REPLY_MAX_LENGTH);

  if (trimmedBody.length < MESSAGE_REPLY_MIN_LENGTH) {
    return {
      error: `Reply must be at least ${MESSAGE_REPLY_MIN_LENGTH} characters.`,
    };
  }

  const { data: message, error: fetchError } = await auth.supabase
    .from("messages")
    .select("id, email, subject, status, read_at")
    .eq("id", messageId)
    .maybeSingle();

  if (fetchError) {
    logSafeDbError("sendMessageReply:fetch", auth.user.id, {
      code: fetchError.code,
      message: fetchError.message,
    });

    return {
      error: formatDevErrorMessage(
        fetchError,
        "Unable to load message. Please try again.",
      ),
    };
  }

  if (!message) {
    return { error: "Message not found." };
  }

  if (!isValidEmail(message.email)) {
    return { error: "Stored recipient email is invalid." };
  }

  const serviceSupabase = createServiceServerClient();
  const duplicateSince = new Date(
    Date.now() - DUPLICATE_REPLY_WINDOW_MS,
  ).toISOString();

  const { data: recentDuplicate, error: duplicateError } = await serviceSupabase
    .from("message_replies")
    .select("id, delivery_status")
    .eq("message_id", messageId)
    .eq("direction", "outbound")
    .eq("body", trimmedBody)
    .in("delivery_status", ["pending", "sent"])
    .gte("created_at", duplicateSince)
    .limit(1);

  if (duplicateError) {
    logSafeDbError("sendMessageReply:duplicate-check", auth.user.id, {
      code: duplicateError.code,
      message: duplicateError.message,
    });
  } else if (recentDuplicate && recentDuplicate.length > 0) {
    return { error: "This reply was already sent moments ago." };
  }

  const subject = buildReplySubject(message.subject);

  const { data: pendingReply, error: insertError } = await serviceSupabase
    .from("message_replies")
    .insert({
      message_id: messageId,
      direction: "outbound",
      sender_email: CONTACT_REPLY_TO_EMAIL,
      recipient_email: message.email,
      body: trimmedBody,
      subject,
      delivery_status: "pending",
      resend_email_id: null,
      sent_at: null,
    })
    .select("id")
    .single();

  if (insertError || !pendingReply) {
    logSafeDbError("sendMessageReply:insert-pending", auth.user.id, {
      code: insertError?.code,
      message: insertError?.message ?? "Pending reply row was not created.",
    });

    return {
      error: formatDevErrorMessage(
        insertError ?? { message: "Pending reply row was not created." },
        "Unable to save reply. Please try again.",
      ),
    };
  }

  const sendResult = await sendContactReplyEmail(
    message.email,
    message.subject,
    trimmedBody,
  );

  if (!sendResult.ok) {
    const { error: failUpdateError } = await serviceSupabase
      .from("message_replies")
      .update({
        delivery_status: "failed",
        sent_at: null,
      })
      .eq("id", pendingReply.id);

    if (failUpdateError) {
      logSafeDbError("sendMessageReply:mark-failed", auth.user.id, {
        code: failUpdateError.code,
        message: failUpdateError.message,
      });
    }

    revalidatePath("/admin/messages");
    revalidatePath("/admin");

    return { error: SEND_REPLY_ERROR_MESSAGE };
  }

  const sentAt = new Date().toISOString();
  const { error: sentUpdateError } = await serviceSupabase
    .from("message_replies")
    .update({
      delivery_status: "sent",
      resend_email_id: sendResult.emailId,
      sent_at: sentAt,
    })
    .eq("id", pendingReply.id);

  if (sentUpdateError) {
    logSafeDbError("sendMessageReply:mark-sent", auth.user.id, {
      code: sentUpdateError.code,
      message: sentUpdateError.message,
    });

    if (sendResult.emailId) {
      logSafeDbError("sendMessageReply:mark-sent-resend-id", auth.user.id, {
        code: "reply_sent_status_unsaved",
        message: `Resend email id: ${sendResult.emailId}`,
      });
    }

    revalidatePath("/admin/messages");
    revalidatePath("/admin");

    return {
      error:
        "Reply was accepted by the email provider but its status could not be updated. Check the conversation thread.",
    };
  }

  if (message.status === "new") {
    const { error: statusError } = await auth.supabase
      .from("messages")
      .update({
        status: "read",
        read_at: message.read_at ?? sentAt,
      })
      .eq("id", messageId);

    if (statusError) {
      logSafeDbError("sendMessageReply:mark-read", auth.user.id, {
        code: statusError.code,
        message: statusError.message,
      });
    }
  }

  revalidatePath("/admin/messages");
  revalidatePath("/admin");

  return { success: true };
}
