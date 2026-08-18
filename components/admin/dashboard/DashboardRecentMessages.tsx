import Link from "next/link";
import { MessageStatusBadge } from "@/components/admin/messages/MessageStatusBadge";
import type { DashboardRecentMessage } from "@/lib/supabase/admin-queries";
import { focusRing } from "@/lib/page-data";

function formatMessageDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface DashboardRecentMessagesProps {
  messages: DashboardRecentMessage[];
}

export function DashboardRecentMessages({
  messages,
}: DashboardRecentMessagesProps) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Recent Messages
        </h2>
        <Link
          href="/admin/messages"
          className={`shrink-0 text-sm font-medium text-hcx-cyan hover:underline ${focusRing}`}
        >
          View All Messages →
        </Link>
      </div>

      {messages.length === 0 ? (
        <p className="mt-4 text-sm text-hcx-text-secondary">
          No recent messages.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-hcx-border">
          {messages.map((message) => (
            <li key={message.id} className="py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-hcx-text">
                      {message.name}
                    </p>
                    {message.status === "new" && (
                      <span className="inline-flex rounded border border-hcx-cyan/40 bg-hcx-cyan/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-hcx-cyan">
                        New
                      </span>
                    )}
                    <MessageStatusBadge status={message.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-hcx-text-secondary">
                    {message.subject}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-hcx-text-secondary">
                  {formatMessageDate(message.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
