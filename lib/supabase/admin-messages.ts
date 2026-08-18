import { logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/supabase/types";

export async function getAdminMessages(): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    logQueryError("getAdminMessages", error);
    return [];
  }

  return (data ?? []) as Message[];
}

export async function getNewMessageCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  if (error) {
    logQueryError("getNewMessageCount", error);
    return 0;
  }

  return count ?? 0;
}
