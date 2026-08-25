import {
  HIMALCYBERX_SITE_URL,
  WELCOME_EMAIL_SUBJECT,
} from "@/lib/email/constants";

export interface WelcomeEmailContent {
  subject: string;
  html: string;
  text: string;
}

export function buildWelcomeEmail(
  toEmail: string,
  unsubscribeUrl?: string | null,
): WelcomeEmailContent {
  const siteUrl = HIMALCYBERX_SITE_URL;
  const unsubscribeFooter = unsubscribeUrl
    ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#64748b;">
            <a href="${escapeHtml(unsubscribeUrl)}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
          </p>`
    : "";
  const unsubscribeText = unsubscribeUrl
    ? `\n\nUnsubscribe: ${unsubscribeUrl}`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${WELCOME_EMAIL_SUBJECT}</title>
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
                <h1 style="margin:14px 0 0;font-size:28px;line-height:1.25;font-weight:700;color:#f4f7fb;">
                  Welcome to HimalCyberX
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#f4f7fb;">
                  Thank you for subscribing.
                </p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#94a3b8;">
                  You will receive cybersecurity research, threat intelligence, vulnerability research,
                  digital forensics content, cyber labs, tutorials, and AI security updates from
                  HimalCyberX.
                </p>
                <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#94a3b8;">
                  Stay informed, stay prepared, and keep defending the future.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius:8px;background-color:#00d9ff;">
                      <a href="${siteUrl}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;color:#070b14;text-decoration:none;">
                        Visit HimalCyberX
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid rgba(148,163,184,0.12);">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">
                  Security reminder: HimalCyberX will never ask for your password or sensitive account
                  credentials by email. If you did not subscribe, you can safely ignore this message.
                </p>
                <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#64748b;">
                  &copy; ${new Date().getFullYear()} HimalCyberX. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#64748b;max-width:600px;">
            This message was sent to ${escapeHtml(toEmail)} because you subscribed to the HimalCyberX newsletter.
            ${unsubscribeFooter}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Welcome to HimalCyberX

Thank you for subscribing.

You will receive cybersecurity research, threat intelligence, vulnerability research, digital forensics content, cyber labs, tutorials, and AI security updates from HimalCyberX.

Stay informed, stay prepared, and keep defending the future.

Visit HimalCyberX: ${siteUrl}

Security reminder: HimalCyberX will never ask for your password or sensitive account credentials by email. If you did not subscribe, you can safely ignore this message.

This message was sent to ${toEmail} because you subscribed to the HimalCyberX newsletter.${unsubscribeText}

© ${new Date().getFullYear()} HimalCyberX. All rights reserved.`;

  return {
    subject: WELCOME_EMAIL_SUBJECT,
    html,
    text,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
