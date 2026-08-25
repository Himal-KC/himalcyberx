import "server-only";

import { createServiceServerClient, hasServiceRoleEnv } from "@/lib/supabase/service-server";

export type UnsubscribeResultStatus =
  | "unsubscribed"
  | "already_unsubscribed"
  | "invalid"
  | "error";

export type SubscriberLookupStatus =
  | "active"
  | "already_unsubscribed"
  | "invalid"
  | "error";

export interface UnsubscribeResult {
  status: UnsubscribeResultStatus;
}

export interface SubscriberLookupResult {
  status: SubscriberLookupStatus;
}

function logUnsubscribeFailure(message: string): void {
  console.error("[newsletter:unsubscribe]", message);
}

export async function getSubscriberUnsubscribeState(
  email: string,
): Promise<SubscriberLookupResult> {
  if (!hasServiceRoleEnv()) {
    logUnsubscribeFailure("service role environment is not configured");
    return { status: "error" };
  }

  try {
    const supabase = createServiceServerClient();
    const { data, error } = await supabase
      .from("subscribers")
      .select("status")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      logUnsubscribeFailure(error.message);
      return { status: "error" };
    }

    if (!data) {
      return { status: "invalid" };
    }

    if (data.status === "unsubscribed") {
      return { status: "already_unsubscribed" };
    }

    return { status: "active" };
  } catch {
    logUnsubscribeFailure("unexpected subscriber lookup failure");
    return { status: "error" };
  }
}

export async function unsubscribeSubscriberByEmail(
  email: string,
): Promise<UnsubscribeResult> {
  if (!hasServiceRoleEnv()) {
    logUnsubscribeFailure("service role environment is not configured");
    return { status: "error" };
  }

  try {
    const supabase = createServiceServerClient();
    const { data, error } = await supabase
      .from("subscribers")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      logUnsubscribeFailure(error.message);
      return { status: "error" };
    }

    if (!data) {
      return { status: "invalid" };
    }

    if (data.status === "unsubscribed") {
      return { status: "already_unsubscribed" };
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("status", "active")
      .select("id");

    if (updateError) {
      logUnsubscribeFailure(updateError.message);
      return { status: "error" };
    }

    if (!updatedRows || updatedRows.length === 0) {
      return { status: "already_unsubscribed" };
    }

    return { status: "unsubscribed" };
  } catch {
    logUnsubscribeFailure("unexpected unsubscribe failure");
    return { status: "error" };
  }
}
