"use server";

import { revalidatePath } from "next/cache";
import {
  formatDevErrorMessage,
  getAuthenticatedServerClient,
  logSafeDbError,
} from "@/lib/supabase/admin-session";
import type { MessageStatus } from "@/lib/supabase/types";

function buildMessageStatusUpdate(
  status: MessageStatus,
  existingReadAt: string | null,
) {
  if (status === "read") {
    return {
      status,
      read_at: existingReadAt ?? new Date().toISOString(),
    };
  }

  if (status === "new") {
    return {
      status,
      read_at: null,
    };
  }

  return { status };
}

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus,
): Promise<{ error?: string }> {
  const auth = await getAuthenticatedServerClient("updateMessageStatus");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const { data: existing, error: fetchError } = await auth.supabase
    .from("messages")
    .select("read_at")
    .eq("id", messageId)
    .maybeSingle();

  if (fetchError) {
    logSafeDbError("updateMessageStatus:fetch", auth.user.id, {
      code: fetchError.code,
      message: fetchError.message,
    });

    return {
      error: formatDevErrorMessage(
        fetchError,
        "Unable to update message. Please try again.",
      ),
    };
  }

  if (!existing) {
    return { error: "Message not found." };
  }

  const { error } = await auth.supabase
    .from("messages")
    .update(buildMessageStatusUpdate(status, existing.read_at))
    .eq("id", messageId);

  if (error) {
    logSafeDbError("updateMessageStatus", auth.user.id, {
      code: error.code,
      message: error.message,
    });

    return {
      error: formatDevErrorMessage(
        error,
        "Unable to update message. Please try again.",
      ),
    };
  }

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return {};
}
