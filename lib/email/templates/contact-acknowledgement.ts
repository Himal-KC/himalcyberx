import {
  CONTACT_ACKNOWLEDGEMENT_SUBJECT,
  CONTACT_REPLY_TO_EMAIL,
  HIMALCYBERX_SITE_URL,
} from "@/lib/email/constants";
import { escapeHtml } from "@/lib/email/templates/email-html";
import {
  buildEmailBodySection,
  buildEmailBrandHeader,
  buildEmailDocument,
  buildEmailHeading,
  buildEmailParagraph,
  buildEmailSignature,
  buildTransactionalOuterFooter,
} from "@/lib/email/templates/email-shell";

export interface ContactAcknowledgementEmailContent {
  subject: string;
  html: string;
  text: string;
}

export function buildContactAcknowledgementEmail(
  name: string,
): ContactAcknowledgementEmailContent {
  const greetingName = name.trim() || "there";

  const bodyHtml = [
    buildEmailBrandHeader({ compact: true }),
    buildEmailBodySection(`
      ${buildEmailHeading("We received your message", 2)}
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#f4f7fb;">
        Hi ${escapeHtml(greetingName)},
      </p>
      ${buildEmailParagraph("Thank you for contacting HimalCyberX.", { muted: true })}
      ${buildEmailParagraph(
        "We've received your message and will get back to you as soon as possible.",
        { muted: true },
      )}
      ${buildEmailParagraph(
        "Your message has been safely received and no further action is required from you at this time.",
        { muted: true },
      )}
    `),
    buildEmailSignature({ compact: true }),
  ].join("");

  const html = buildEmailDocument({
    title: CONTACT_ACKNOWLEDGEMENT_SUBJECT,
    bodyHtml,
    outerFooterHtml: buildTransactionalOuterFooter(
      "You are receiving this email because you contacted HimalCyberX through our website contact form.",
    ),
  });

  const text = `HimalCyberX

WE RECEIVED YOUR MESSAGE

Hi ${greetingName},

Thank you for contacting HimalCyberX.

We've received your message and will get back to you as soon as possible.

Your message has been safely received and no further action is required from you at this time.

HimalCyberX
Cybersecurity Research & Learning
${HIMALCYBERX_SITE_URL}

You are receiving this email because you contacted HimalCyberX through our website contact form.

For replies, contact us at ${CONTACT_REPLY_TO_EMAIL}.`;

  return {
    subject: CONTACT_ACKNOWLEDGEMENT_SUBJECT,
    html,
    text,
  };
}
