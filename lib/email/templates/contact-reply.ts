import { HIMALCYBERX_SITE_URL } from "@/lib/email/constants";
import { escapeHtml } from "@/lib/email/templates/email-html";
import {
  buildEmailBodySection,
  buildEmailBrandHeader,
  buildEmailDocument,
  buildEmailSignatureBanner,
  buildTransactionalOuterFooter,
} from "@/lib/email/templates/email-shell";
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
  const bodyHtml = [
    buildEmailBrandHeader({ compact: true }),
    buildEmailBodySection(formatReplyBodyHtml(body)),
    buildEmailSignatureBanner(),
  ].join("");

  const html = buildEmailDocument({
    title: subject,
    bodyHtml,
    outerFooterHtml: buildTransactionalOuterFooter(
      "You are receiving this email because you contacted HimalCyberX.",
    ),
  });

  const text = `${formatReplyBodyText(body)}

HimalCyberX
Cybersecurity Research & Learning
${HIMALCYBERX_SITE_URL}

You are receiving this email because you contacted HimalCyberX.`;

  return {
    subject,
    html,
    text,
  };
}
