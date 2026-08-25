import { logQueryError } from "@/lib/supabase/errors";
import { getAuthenticatedServerClient } from "@/lib/supabase/admin-session";
import {
  createServiceServerClient,
  hasServiceRoleEnv,
} from "@/lib/supabase/service-server";
import type { MessageReply } from "@/lib/supabase/types";

export async function getAdminMessageReplies(): Promise<MessageReply[]> {
  const auth = await getAuthenticatedServerClient("getAdminMessageReplies");

  if (!auth.ok) {
    return [];
  }

  if (!hasServiceRoleEnv()) {
    console.error(
      "[supabase:getAdminMessageReplies]",
      "Supabase service role environment is not configured.",
    );
    return [];
  }

  const supabase = createServiceServerClient();
  const { data, error } = await supabase
    .from("message_replies")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    logQueryError("getAdminMessageReplies", error);
    return [];
  }

  return (data ?? []) as MessageReply[];
}
