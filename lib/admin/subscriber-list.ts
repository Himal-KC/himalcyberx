import {
  matchesSearchQuery,
  readQueryString,
  type ContentSortOption,
} from "@/lib/admin/list-query";
import { SUBSCRIBER_SOURCES } from "@/lib/admin/subscriber-constants";
import type { Subscriber, SubscriberStatus } from "@/lib/supabase/types";

export type SubscriberStatusFilter = "all" | SubscriberStatus;

export interface SubscriberListFilters {
  q: string;
  status: SubscriberStatusFilter;
  source: string;
  sort: ContentSortOption;
}

export const DEFAULT_SUBSCRIBER_LIST_FILTERS: SubscriberListFilters = {
  q: "",
  status: "all",
  source: "all",
  sort: "newest",
};

export interface SubscriberSummaryCounts {
  total: number;
  active: number;
  unsubscribed: number;
}

function getSubscriberStatusChangeTimestamp(subscriber: Subscriber): number {
  if (subscriber.unsubscribed_at) {
    return Date.parse(subscriber.unsubscribed_at);
  }

  if (subscriber.subscribed_at) {
    return Date.parse(subscriber.subscribed_at);
  }

  return Date.parse(subscriber.created_at);
}

export function parseSubscriberListFilters(
  params: Record<string, string | string[] | undefined>,
): SubscriberListFilters {
  const status = readQueryString(params.status);
  const source = readQueryString(params.source);
  const sort = readQueryString(params.sort);

  return {
    q: readQueryString(params.q),
    status:
      status === "active" || status === "unsubscribed" ? status : "all",
    source: source || "all",
    sort: sort === "oldest" || sort === "updated" ? sort : "newest",
  };
}

export function subscriberListFiltersAreActive(
  filters: SubscriberListFilters,
): boolean {
  return (
    Boolean(filters.q.trim()) ||
    filters.status !== "all" ||
    filters.source !== "all" ||
    filters.sort !== "newest"
  );
}

export function getSubscriberSummaryCounts(
  subscribers: Subscriber[],
): SubscriberSummaryCounts {
  return {
    total: subscribers.length,
    active: subscribers.filter((subscriber) => subscriber.status === "active")
      .length,
    unsubscribed: subscribers.filter(
      (subscriber) => subscriber.status === "unsubscribed",
    ).length,
  };
}

export function filterSubscribers(
  subscribers: Subscriber[],
  filters: SubscriberListFilters,
): Subscriber[] {
  return subscribers.filter((subscriber) => {
    if (!matchesSearchQuery(filters.q, [subscriber.email])) {
      return false;
    }

    if (filters.status !== "all" && subscriber.status !== filters.status) {
      return false;
    }

    if (filters.source !== "all" && subscriber.source !== filters.source) {
      return false;
    }

    return true;
  });
}

export function sortSubscribers(
  subscribers: Subscriber[],
  sort: ContentSortOption,
): Subscriber[] {
  const sorted = [...subscribers];

  switch (sort) {
    case "oldest":
      return sorted.sort(
        (a, b) =>
          Date.parse(a.subscribed_at) - Date.parse(b.subscribed_at),
      );
    case "updated":
      return sorted.sort(
        (a, b) =>
          getSubscriberStatusChangeTimestamp(b) -
          getSubscriberStatusChangeTimestamp(a),
      );
    case "newest":
    default:
      return sorted.sort(
        (a, b) =>
          Date.parse(b.subscribed_at) - Date.parse(a.subscribed_at),
      );
  }
}

export function applySubscriberListFilters(
  subscribers: Subscriber[],
  filters: SubscriberListFilters,
): Subscriber[] {
  return sortSubscribers(filterSubscribers(subscribers, filters), filters.sort);
}

export function getSubscriberSourceOptions(subscribers: Subscriber[]): string[] {
  const fromData = subscribers.map((subscriber) => subscriber.source);
  return Array.from(
    new Set([...SUBSCRIBER_SOURCES, ...fromData].filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

export function getSubscriberFilterEmptyMessage(
  filters: SubscriberListFilters,
): string {
  if (filters.q.trim()) {
    return "No subscribers match your search.";
  }

  if (filters.status === "active") {
    return "No active subscribers.";
  }

  if (filters.status === "unsubscribed") {
    return "No unsubscribed subscribers.";
  }

  if (filters.source !== "all") {
    return `No subscribers from ${filters.source}.`;
  }

  return "No subscribers match your filters.";
}

export function formatSubscriberSource(source: string): string {
  return source
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
