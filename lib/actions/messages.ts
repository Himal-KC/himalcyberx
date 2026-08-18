"use server";

import { revalidatePath } from "next/cache";
import {
  formatDevErrorMessage,
  getAuthenticatedServerClient,
  logSafeDbError,
} from "@/lib/supabase/admin-session";
import type { MessageStatus } from "@/lib/supabase/types";

function buildMessageStatusUpdate(status: MessageStatus) {
  if (status === "read") {
    return {
      status,
      read_at: new Date().toISOString(),
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

  const { error } = await auth.supabase
    .from("messages")
    .update(buildMessageStatusUpdate(status))
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
