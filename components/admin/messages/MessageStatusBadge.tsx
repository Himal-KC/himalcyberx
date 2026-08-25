import type { MessageStatus } from "@/lib/supabase/types";

const statusStyles: Record<
  MessageStatus,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className: "border-hcx-cyan/30 bg-hcx-cyan/10 text-hcx-cyan",
  },
  read: {
    label: "Read",
    className: "border-hcx-green/30 bg-hcx-green/10 text-hcx-green",
  },
  archived: {
    label: "Archived",
    className: "border-hcx-text-secondary/30 bg-hcx-bg text-hcx-text-secondary",
  },
  spam: {
    label: "Spam",
    className: "border-hcx-red/30 bg-hcx-red/10 text-hcx-red",
  },
};

export function MessageStatusBadge({ status }: { status: MessageStatus }) {
  const style = statusStyles[status];

  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.className}`}
    >
      {style.label}
    </span>
  );
}
