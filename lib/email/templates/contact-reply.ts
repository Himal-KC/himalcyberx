import { HIMALCYBERX_SITE_URL } from "@/lib/email/constants";
import { escapeHtml } from "@/lib/email/templates/email-html";
import { buildReplySubject } from "@/lib/messages/reply-subject";

export { buildReplySubject };

export interface ContactReplyEmailContent {
  subject: string;
  html: string;
  text: string;
}

function formatReplyBodyHtml(body: string): string {
  return escapeHtml(body)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#f4f7fb;white-space:pre-line;">${paragraph.replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

function formatReplyBodyText(body: string): string {
  return body.trim();
}

export function buildContactReplyEmail(
  subject: string,
  body: string,
): ContactReplyEmailContent {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
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
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                ${formatReplyBodyHtml(body)}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid rgba(148,163,184,0.12);">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                  You are receiving this email because you contacted HimalCyberX.
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

  const text = `${formatReplyBodyText(body)}

You are receiving this email because you contacted HimalCyberX.
${HIMALCYBERX_SITE_URL}`;

  return {
    subject,
    html,
    text,
  };
}
