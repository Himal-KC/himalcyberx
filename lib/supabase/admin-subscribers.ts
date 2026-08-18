import { logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { Subscriber } from "@/lib/supabase/types";

export interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
}

export async function getAdminSubscribers(): Promise<Subscriber[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });

  if (error) {
    logQueryError("getAdminSubscribers", error);
    return [];
  }

  return (data ?? []) as Subscriber[];
}

export async function getSubscriberStats(): Promise<SubscriberStats> {
  const subscribers = await getAdminSubscribers();

  return {
    total: subscribers.length,
    active: subscribers.filter((subscriber) => subscriber.status === "active")
      .length,
    unsubscribed: subscribers.filter(
      (subscriber) => subscriber.status === "unsubscribed",
    ).length,
  };
}
