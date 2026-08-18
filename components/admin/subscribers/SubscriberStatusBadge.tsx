import type { SubscriberStatus } from "@/lib/supabase/types";

const statusStyles: Record<
  SubscriberStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "border-hcx-green/30 bg-hcx-green/10 text-hcx-green",
  },
  unsubscribed: {
    label: "Unsubscribed",
    className: "border-hcx-text-secondary/30 bg-hcx-bg text-hcx-text-secondary",
  },
};

export function SubscriberStatusBadge({ status }: { status: SubscriberStatus }) {
  const style = statusStyles[status];

  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.className}`}
    >
      {style.label}
    </span>
  );
}
