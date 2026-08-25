import { createResendClient, logEmailFailure } from "@/lib/email/client";
import { NEWSLETTER_FROM_EMAIL } from "@/lib/email/constants";
import { buildWelcomeEmail } from "@/lib/email/templates/welcome";
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe-token";

export async function sendWelcomeEmail(toEmail: string): Promise<void> {
  const resend = createResendClient();
  if (!resend) {
    logEmailFailure("sendWelcomeEmail", "RESEND_API_KEY is not configured");
    return;
  }

  const unsubscribeUrl = buildUnsubscribeUrl(toEmail);
  if (!unsubscribeUrl) {
    logEmailFailure(
      "sendWelcomeEmail",
      "unable to generate unsubscribe link for welcome email",
    );
  }

  const { subject, html, text } = buildWelcomeEmail(toEmail, unsubscribeUrl);

  try {
    const { error } = await resend.emails.send({
      from: NEWSLETTER_FROM_EMAIL,
      to: toEmail,
      subject,
      html,
      text,
      ...(unsubscribeUrl
        ? {
            headers: {
              // Opens the confirmation page; unsubscribe is completed only after intentional POST.
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
            },
          }
        : {}),
    });

    if (error) {
      logEmailFailure("sendWelcomeEmail", error);
    }
  } catch (error) {
    logEmailFailure("sendWelcomeEmail", error);
  }
}
