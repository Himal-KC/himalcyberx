import type { ContentNotificationContentType } from "@/lib/notifications/constants";
import { HIMALCYBERX_SITE_URL } from "@/lib/email/constants";
import { escapeHtml } from "@/lib/email/templates/email-html";

export interface ContentNotificationEmailInput {
  contentType: ContentNotificationContentType;
  title: string;
  description: string;
  url: string;
  featuredImage: string | null;
  publishedAt: string | null;
  unsubscribeUrl?: string | null;
}

export interface ContentNotificationEmailContent {
  subject: string;
  html: string;
  text: string;
}

const contentTypeLabels: Record<ContentNotificationContentType, string> = {
  article: "Article",
  lab: "Cyber Lab",
  tutorial: "Tutorial",
};

const ctaLabels: Record<ContentNotificationContentType, string> = {
  article: "Read Article",
  lab: "Start Lab",
  tutorial: "View Tutorial",
};

const subjectPrefixes: Record<ContentNotificationContentType, string> = {
  article: "New on HimalCyberX:",
  lab: "New Cyber Lab:",
  tutorial: "New Tutorial:",
};

function formatPublicationDate(publishedAt: string | null): string | null {
  if (!publishedAt) {
    return null;
  }

  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildFeaturedImageHtml(featuredImage: string | null): string {
  if (!featuredImage || !/^https?:\/\//i.test(featuredImage)) {
    return "";
  }

  return `<tr>
              <td style="padding:0 32px 8px;">
                <img src="${escapeHtml(featuredImage)}" alt="" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:8px;border:1px solid rgba(148,163,184,0.18);" />
              </td>
            </tr>`;
}

export function buildContentNotificationEmail(
  input: ContentNotificationEmailInput,
): ContentNotificationEmailContent {
  const typeLabel = contentTypeLabels[input.contentType];
  const ctaLabel = ctaLabels[input.contentType];
  const subject = `${subjectPrefixes[input.contentType]} ${input.title}`;
  const publishedLabel = formatPublicationDate(input.publishedAt);
  const unsubscribeFooter = input.unsubscribeUrl
    ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#64748b;">
            <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
          </p>`
    : "";
  const unsubscribeText = input.unsubscribeUrl
    ? `\n\nUnsubscribe: ${input.unsubscribeUrl}`
    : "";

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
                <p style="margin:14px 0 0;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">
                  ${escapeHtml(typeLabel)}
                </p>
                <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;font-weight:700;color:#f4f7fb;">
                  ${escapeHtml(input.title)}
                </h1>
                ${
                  publishedLabel
                    ? `<p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">Published ${escapeHtml(publishedLabel)}</p>`
                    : ""
                }
              </td>
            </tr>
            ${buildFeaturedImageHtml(input.featuredImage)}
            <tr>
              <td style="padding:24px 32px 28px;">
                <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#94a3b8;">
                  ${escapeHtml(input.description)}
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius:8px;background-color:#00d9ff;">
                      <a href="${escapeHtml(input.url)}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;color:#070b14;text-decoration:none;">
                        ${escapeHtml(ctaLabel)}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid rgba(148,163,184,0.12);">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                  &copy; ${new Date().getFullYear()} HimalCyberX. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#64748b;max-width:600px;">
            You are receiving this because you subscribed to HimalCyberX updates.${unsubscribeFooter}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${subject}

${typeLabel}
${input.title}
${publishedLabel ? `Published ${publishedLabel}` : ""}

${input.description}

${ctaLabel}: ${input.url}${unsubscribeText}

© ${new Date().getFullYear()} HimalCyberX. All rights reserved.`;

  return { subject, html, text };
}

export function buildContentNotificationUrl(
  contentType: ContentNotificationContentType,
  slug: string,
): string {
  const base = HIMALCYBERX_SITE_URL.replace(/\/$/, "");

  switch (contentType) {
    case "article":
      return `${base}/articles/${slug}`;
    case "lab":
      return `${base}/cyber-lab/${slug}`;
    case "tutorial":
      return `${base}/tutorials/${slug}`;
  }
}
