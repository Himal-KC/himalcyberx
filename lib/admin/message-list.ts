import { readQueryString } from "@/lib/admin/list-query";
import type { MessageStatus } from "@/lib/supabase/types";

export type MessageStatusFilter = "all" | MessageStatus;

export interface MessageListFilters {
  status: MessageStatusFilter;
}

export const DEFAULT_MESSAGE_LIST_FILTERS: MessageListFilters = {
  status: "all",
};

export function parseMessageListFilters(
  params: Record<string, string | string[] | undefined>,
): MessageListFilters {
  const status = readQueryString(params.status);

  return {
    status:
      status === "new" ||
      status === "read" ||
      status === "archived" ||
      status === "spam" ||
      status === "all"
        ? status
        : "all",
  };
}

export function messageListFiltersAreActive(
  filters: MessageListFilters,
): boolean {
  return filters.status !== "all";
}

export function getMessageFilterEmptyMessage(
  status: MessageStatusFilter,
  hasSearch: boolean,
): string {
  if (hasSearch) {
    return "No messages match your search.";
  }

  switch (status) {
    case "new":
      return "No new messages.";
    case "read":
      return "No read messages.";
    case "archived":
      return "No archived messages.";
    case "spam":
      return "No spam messages.";
    case "all":
    default:
      return "No messages match your search.";
  }
}
