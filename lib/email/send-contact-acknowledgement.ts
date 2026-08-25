import "server-only";

import {
  CONTACT_FROM_EMAIL,
  CONTACT_REPLY_TO_EMAIL,
} from "@/lib/email/constants";
import { buildContactAcknowledgementEmail } from "@/lib/email/templates/contact-acknowledgement";
import { sendResendEmailWithResult } from "@/lib/email/resend-send";
import { logEmailFailure } from "@/lib/email/client";

export async function sendContactAcknowledgementEmail(
  name: string,
  toEmail: string,
): Promise<void> {
  const content = buildContactAcknowledgementEmail(name);
  const result = await sendResendEmailWithResult(
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
    "sendContactAcknowledgementEmail",
  );

  if (!result.ok) {
    logEmailFailure(
      "sendContactAcknowledgementEmail",
      "Acknowledgement email was not accepted by Resend",
    );
  }
}
