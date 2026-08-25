import type { Message, MessageReply } from "@/lib/supabase/types";
import { PlainTextMessageContent } from "@/components/admin/messages/PlainTextMessageContent";
import { MessageReplyDeliveryBadge } from "@/components/admin/messages/MessageReplyDeliveryBadge";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface MessageConversationThreadProps {
  message: Message;
  replies: MessageReply[];
}

export function MessageConversationThread({
  message,
  replies,
}: MessageConversationThreadProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
        Conversation
      </h3>

      <div className="space-y-3">
        <article className="rounded-lg border border-hcx-border bg-hcx-bg/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-hcx-cyan">
              Visitor
            </p>
            <time
              dateTime={message.created_at}
              className="text-xs text-hcx-text-secondary"
            >
              {formatDate(message.created_at)}
            </time>
          </div>
          <p className="mt-2 text-sm font-medium text-hcx-text">
            {message.name}
          </p>
          <div className="mt-3">
            <PlainTextMessageContent content={message.message} />
          </div>
        </article>

        {replies.map((reply) => (
          <article
            key={reply.id}
            className={`rounded-lg border p-4 ${
              reply.direction === "outbound"
                ? "border-hcx-cyan/20 bg-hcx-cyan/5"
                : "border-hcx-border bg-hcx-bg/40"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    reply.direction === "outbound"
                      ? "text-hcx-green"
                      : "text-hcx-cyan"
                  }`}
                >
                  {reply.direction === "outbound" ? "HimalCyberX" : "Visitor"}
                </p>
                {reply.direction === "outbound" ? (
                  <MessageReplyDeliveryBadge status={reply.delivery_status} />
                ) : null}
              </div>
              <time
                dateTime={reply.sent_at ?? reply.created_at}
                className="text-xs text-hcx-text-secondary"
              >
                {formatDate(reply.sent_at ?? reply.created_at)}
              </time>
            </div>
            {reply.direction === "outbound" &&
            reply.delivery_status === "failed" ? (
              <p className="mt-2 text-xs text-hcx-red">
                Send failed. Edit your reply below and send again.
              </p>
            ) : null}
            {reply.direction === "outbound" &&
            reply.delivery_status === "pending" ? (
              <p className="mt-2 text-xs text-hcx-orange">
                Sending reply...
              </p>
            ) : null}
            {reply.subject ? (
              <p className="mt-2 text-xs text-hcx-text-secondary">
                Subject: {reply.subject}
              </p>
            ) : null}
            <div className="mt-3">
              <PlainTextMessageContent content={reply.body} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
