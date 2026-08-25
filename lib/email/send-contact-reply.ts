import "server-only";

import {
  CONTACT_FROM_EMAIL,
  CONTACT_REPLY_TO_EMAIL,
} from "@/lib/email/constants";
import {
  buildContactReplyEmail,
  buildReplySubject,
} from "@/lib/email/templates/contact-reply";
import {
  sendResendEmailWithResult,
  type ResendSendResult,
} from "@/lib/email/resend-send";

export async function sendContactReplyEmail(
  toEmail: string,
  originalSubject: string,
  body: string,
): Promise<ResendSendResult> {
  const subject = buildReplySubject(originalSubject);
  const content = buildContactReplyEmail(subject, body);

  return sendResendEmailWithResult(
    {
      from: CONTACT_FROM_EMAIL,
      to: toEmail,
      subject: content.subject,
      html: content.html,
      text: content.text,
      headers: {
        "Reply-To": CONTACT_REPLY_TO_EMAIL,
      },
    },
    "sendContactReplyEmail",
  );
}
