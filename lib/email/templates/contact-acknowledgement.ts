import {
  CONTACT_ACKNOWLEDGEMENT_SUBJECT,
  CONTACT_REPLY_TO_EMAIL,
  HIMALCYBERX_SITE_URL,
} from "@/lib/email/constants";
import { escapeHtml } from "@/lib/email/templates/email-html";

export interface ContactAcknowledgementEmailContent {
  subject: string;
  html: string;
  text: string;
}

export function buildContactAcknowledgementEmail(
  name: string,
): ContactAcknowledgementEmailContent {
  const greetingName = name.trim() || "there";

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(CONTACT_ACKNOWLEDGEMENT_SUBJECT)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#070b14;color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#070b14;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#111a2c;border:1px solid rgba(148,163,184,0.18);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 20px;border-bottom:1px solid rgba(148,163,184,0.12);">
                <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#00d9ff;">
                  HimalCyberX
                </p>
                <h1 style="margin:14px 0 0;font-size:24px;line-height:1.3;font-weight:700;color:#f4f7fb;">
                  We received your message
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#f4f7fb;">
                  Hi ${escapeHtml(greetingName)},
                </p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#94a3b8;">
                  Thank you for contacting HimalCyberX.
                </p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#94a3b8;">
                  We've received your message and will get back to you as soon as possible.
                </p>
                <p style="margin:0;font-size:16px;line-height:1.7;color:#94a3b8;">
                  Your message has been safely received and no further action is required from you at this time.
                </p>
                <p style="margin:24px 0 0;font-size:16px;line-height:1.7;color:#f4f7fb;">
                  Regards,<br />
                  HimalCyberX
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid rgba(148,163,184,0.12);">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                  You are receiving this email because you contacted HimalCyberX through our website contact form.
                </p>
                <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#64748b;">
                  <a href="${HIMALCYBERX_SITE_URL}" style="color:#94a3b8;text-decoration:underline;">${escapeHtml(HIMALCYBERX_SITE_URL)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Hi ${greetingName},

Thank you for contacting HimalCyberX.

We've received your message and will get back to you as soon as possible.

Your message has been safely received and no further action is required from you at this time.

Regards,
HimalCyberX

You are receiving this email because you contacted HimalCyberX through our website contact form.
${HIMALCYBERX_SITE_URL}

For replies, contact us at ${CONTACT_REPLY_TO_EMAIL}.`;

  return {
    subject: CONTACT_ACKNOWLEDGEMENT_SUBJECT,
    html,
    text,
  };
}
