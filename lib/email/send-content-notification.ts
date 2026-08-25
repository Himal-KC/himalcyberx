import "server-only";

import { logEmailFailure } from "@/lib/email/client";
import { NEWSLETTER_FROM_EMAIL, RESEND_SEND_INTERVAL_MS } from "@/lib/email/constants";
import { sendResendEmailWithRetry } from "@/lib/email/resend-send";
import { sleep } from "@/lib/email/sleep";
import {
  buildContentNotificationEmail,
  type ContentNotificationEmailInput,
} from "@/lib/email/templates/content-notification";
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe-token";

export interface ContentNotificationSendSummary {
  attempted: number;
  succeeded: number;
  failed: number;
}

export async function sendContentNotificationEmail(
  recipientEmail: string,
  input: ContentNotificationEmailInput,
): Promise<boolean> {
  const unsubscribeUrl = buildUnsubscribeUrl(recipientEmail);
  const { subject, html, text } = buildContentNotificationEmail({
    ...input,
    unsubscribeUrl,
  });

  return sendResendEmailWithRetry(
    {
      from: NEWSLETTER_FROM_EMAIL,
      to: recipientEmail,
      subject,
      html,
      text,
      ...(unsubscribeUrl
        ? {
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
            },
          }
        : {}),
    },
    "sendContentNotificationEmail",
  );
}

export async function sendContentNotificationBroadcast(
  recipients: string[],
  input: ContentNotificationEmailInput,
): Promise<ContentNotificationSendSummary> {
  const summary: ContentNotificationSendSummary = {
    attempted: recipients.length,
    succeeded: 0,
    failed: 0,
  };

  for (let index = 0; index < recipients.length; index += 1) {
    const recipientEmail = recipients[index];
    const sent = await sendContentNotificationEmail(recipientEmail, input);

    if (sent) {
      summary.succeeded += 1;
    } else {
      summary.failed += 1;
    }

    if (index < recipients.length - 1) {
      await sleep(RESEND_SEND_INTERVAL_MS);
    }
  }

  if (summary.failed > 0) {
    logEmailFailure(
      "sendContentNotificationBroadcast",
      `completed with ${summary.failed} failed recipient(s) of ${summary.attempted}`,
    );
  }

  return summary;
}
