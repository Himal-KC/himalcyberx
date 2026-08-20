"use server";

import { revalidatePath } from "next/cache";
import {
  applySubscriberListFilters,
  type SubscriberListFilters,
} from "@/lib/admin/subscriber-list";
import {
  buildSubscribersCsv,
  buildSubscribersCsvFilename,
} from "@/lib/admin/subscriber-csv";
import { getAdminSubscribers } from "@/lib/supabase/admin-subscribers";
import {
  formatDevErrorMessage,
  getAuthenticatedServerClient,
  logSafeDbError,
} from "@/lib/supabase/admin-session";
import type { SubscriberStatus } from "@/lib/supabase/types";

export async function exportSubscribersCsv(
  filters: SubscriberListFilters,
): Promise<{ csv?: string; filename?: string; error?: string }> {
  const auth = await getAuthenticatedServerClient("exportSubscribersCsv");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const subscribers = await getAdminSubscribers();
  const filtered = applySubscriberListFilters(subscribers, filters);

  return {
    csv: buildSubscribersCsv(filtered),
    filename: buildSubscribersCsvFilename(),
  };
}

export async function updateSubscriberStatus(
  subscriberId: string,
  status: SubscriberStatus,
): Promise<{ error?: string }> {
  const auth = await getAuthenticatedServerClient("updateSubscriberStatus");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const updatePayload =
    status === "unsubscribed"
      ? {
          status,
          unsubscribed_at: new Date().toISOString(),
        }
      : {
          status,
          unsubscribed_at: null,
        };

  const { error } = await auth.supabase
    .from("subscribers")
    .update(updatePayload)
    .eq("id", subscriberId);

  if (error) {
    logSafeDbError("updateSubscriberStatus", auth.user.id, {
      code: error.code,
      message: error.message,
    });

    return {
      error: formatDevErrorMessage(
        error,
        "Unable to update subscriber. Please try again.",
      ),
    };
  }

  revalidatePath("/admin/subscribers");
  revalidatePath("/admin");
  return {};
}
