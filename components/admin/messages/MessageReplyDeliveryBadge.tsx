import type { MessageReplyDeliveryStatus } from "@/lib/supabase/types";

const deliveryStatusStyles: Record<
  MessageReplyDeliveryStatus,
  { label: string; className: string; description?: string }
> = {
  pending: {
    label: "Pending",
    className: "border-hcx-orange/30 bg-hcx-orange/10 text-hcx-orange",
    description: "Sending reply...",
  },
  sent: {
    label: "Accepted",
    className: "border-hcx-green/30 bg-hcx-green/10 text-hcx-green",
    description: "Accepted by email provider (not proof of inbox delivery).",
  },
  failed: {
    label: "Failed",
    className: "border-hcx-red/30 bg-hcx-red/10 text-hcx-red",
    description: "Send failed. Edit the reply below and try again.",
  },
};

export function MessageReplyDeliveryBadge({
  status,
}: {
  status: MessageReplyDeliveryStatus;
}) {
  const style = deliveryStatusStyles[status];

  return (
    <span
      title={style.description}
      className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.className}`}
    >
      {style.label}
    </span>
  );
}
