import "server-only";

import { createResendClient, logEmailFailure } from "@/lib/email/client";
import { NEWSLETTER_FROM_EMAIL } from "@/lib/email/constants";
import {
  buildContentNotificationEmail,
  type ContentNotificationEmailInput,
} from "@/lib/email/templates/content-notification";
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe-token";
import { CONTENT_NOTIFICATION_BATCH_SIZE } from "@/lib/notifications/constants";

export interface ContentNotificationSendSummary {
  attempted: number;
  succeeded: number;
  failed: number;
}

export async function sendContentNotificationEmail(
  recipientEmail: string,
  input: ContentNotificationEmailInput,
): Promise<boolean> {
  const resend = createResendClient();
  if (!resend) {
    logEmailFailure("sendContentNotificationEmail", "RESEND_API_KEY is not configured");
    return false;
  }

  const unsubscribeUrl = buildUnsubscribeUrl(recipientEmail);
  const { subject, html, text } = buildContentNotificationEmail({
    ...input,
    unsubscribeUrl,
  });

  try {
    const { error } = await resend.emails.send({
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
    });

    if (error) {
      logEmailFailure("sendContentNotificationEmail:recipient", error);
      return false;
    }

    return true;
  } catch (error) {
    logEmailFailure("sendContentNotificationEmail:recipient", error);
    return false;
  }
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

  for (let index = 0; index < recipients.length; index += CONTENT_NOTIFICATION_BATCH_SIZE) {
    const batch = recipients.slice(index, index + CONTENT_NOTIFICATION_BATCH_SIZE);

    for (const recipientEmail of batch) {
      const sent = await sendContentNotificationEmail(recipientEmail, input);
      if (sent) {
        summary.succeeded += 1;
      } else {
        summary.failed += 1;
      }
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
