import Link from "next/link";
import { confirmNewsletterUnsubscribe } from "@/lib/actions/unsubscribe";
import type { UnsubscribeResultStatus } from "@/lib/subscribers/unsubscribe";
import { focusRing } from "@/lib/page-data";

const messages: Record<
  UnsubscribeResultStatus | "confirm",
  { title: string; description: string }
> = {
  confirm: {
    title: "You're currently subscribed to HimalCyberX updates.",
    description:
      "If you no longer want to receive cybersecurity research, threat intelligence, and newsletter updates from HimalCyberX, you can unsubscribe below.",
  },
  unsubscribed: {
    title: "You've been unsubscribed from HimalCyberX updates.",
    description:
      "You will no longer receive newsletter emails from HimalCyberX. You can subscribe again at any time from our website.",
  },
  already_unsubscribed: {
    title: "You're already unsubscribed.",
    description:
      "This email address is not currently subscribed to HimalCyberX newsletter updates.",
  },
  invalid: {
    title: "This unsubscribe link is invalid or no longer available.",
    description:
      "The link may have expired or been changed. If you still receive emails, contact us and we can help remove your subscription.",
  },
  error: {
    title: "We couldn't complete your unsubscribe request.",
    description:
      "Please try again later or contact us if you continue to receive HimalCyberX newsletter emails.",
  },
};

type UnsubscribeContentProps =
  | {
      mode: "confirm";
      token: string;
    }
  | {
      mode: "status";
      status: UnsubscribeResultStatus;
    };

export function UnsubscribeContent(props: UnsubscribeContentProps) {
  const key = props.mode === "confirm" ? "confirm" : props.status;
  const content = messages[key];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-hcx-cyan">
          Newsletter
        </p>
        <h1 className="mt-3 text-2xl font-bold text-hcx-text sm:text-3xl">
          {content.title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-hcx-text-secondary sm:text-base">
          {content.description}
        </p>

        {props.mode === "confirm" ? (
          <form action={confirmNewsletterUnsubscribe} className="mt-8">
            <input type="hidden" name="token" value={props.token} />
            <button
              type="submit"
              className={`inline-flex min-h-11 items-center rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 ${focusRing}`}
            >
              Unsubscribe
            </button>
          </form>
        ) : (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className={`inline-flex min-h-11 items-center rounded-lg border border-hcx-border bg-hcx-bg-secondary px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
            >
              Return Home
            </Link>
            {props.status === "invalid" || props.status === "error" ? (
              <Link
                href="/contact"
                className={`inline-flex min-h-11 items-center rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 ${focusRing}`}
              >
                Contact Us
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
