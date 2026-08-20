import type { Subscriber } from "@/lib/supabase/types";

const CSV_HEADERS = [
  "email",
  "status",
  "source",
  "subscribed_at",
  "created_at",
  "unsubscribed_at",
] as const;

export function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function buildSubscribersCsv(subscribers: Subscriber[]): string {
  const rows = subscribers.map((subscriber) =>
    [
      subscriber.email,
      subscriber.status,
      subscriber.source,
      subscriber.subscribed_at,
      subscriber.created_at,
      subscriber.unsubscribed_at ?? "",
    ]
      .map((value) => escapeCsvValue(value))
      .join(","),
  );

  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export function buildSubscribersCsvFilename(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `himalcyberx-subscribers-${stamp}.csv`;
}
