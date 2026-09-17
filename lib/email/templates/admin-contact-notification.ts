import { HIMALCYBERX_SITE_URL } from "../constants.ts";
import {
  buildAdminContactNotificationSubject,
  formatAdminNotificationTimestamp,
} from "../admin-notification-format.ts";
import { escapeHtml } from "@/lib/email/templates/email-html";
import {
  buildEmailBodySection,
  buildEmailBrandHeader,
  buildEmailDocument,
  buildEmailHeading,
  buildEmailParagraph,
  buildEmailSignatureBanner,
  buildTransactionalOuterFooter,
} from "@/lib/email/templates/email-shell";

export interface AdminContactNotificationInput {
  visitorName: string;
  visitorEmail: string;
  subject: string;
  message: string;
  receivedAt: Date | string;
}

export interface AdminContactNotificationContent {
  subject: string;
  html: string;
  text: string;
}

export function buildAdminContactNotificationEmail(
  input: AdminContactNotificationInput,
): AdminContactNotificationContent {
  const subject = buildAdminContactNotificationSubject(input.subject);
  const received = formatAdminNotificationTimestamp(input.receivedAt);

  const bodyHtml = [
    buildEmailBrandHeader({ compact: true }),
    buildEmailBodySection(`
      ${buildEmailHeading("New contact message", 2)}
      ${buildEmailParagraph("A visitor submitted a message through the HimalCyberX contact form.")}
      <p style="margin:0 0 10px;font-size:16px;line-height:1.7;color:#f4f7fb;">
        <strong style="color:#94a3b8;font-weight:600;">Name:</strong>
        ${escapeHtml(input.visitorName)}
      </p>
      <p style="margin:0 0 10px;font-size:16px;line-height:1.7;color:#f4f7fb;">
        <strong style="color:#94a3b8;font-weight:600;">Email:</strong>
        ${escapeHtml(input.visitorEmail)}
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#f4f7fb;">
        <strong style="color:#94a3b8;font-weight:600;">Subject:</strong>
        ${escapeHtml(input.subject)}
      </p>
      <p style="margin:0 0 8px;font-size:16px;line-height:1.7;color:#94a3b8;font-weight:600;">
        Message:
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#f4f7fb;white-space:pre-wrap;">
        ${escapeHtml(input.message)}
      </p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#f4f7fb;">
        <strong style="color:#94a3b8;font-weight:600;">Received:</strong>
        ${escapeHtml(received)}
      </p>
    `),
    buildEmailSignatureBanner(),
  ].join("");

  const html = buildEmailDocument({
    title: subject,
    bodyHtml,
    outerFooterHtml: buildTransactionalOuterFooter(
      "You are receiving this email because a visitor contacted HimalCyberX through the website contact form.",
    ),
  });

  const text = `HimalCyberX

NEW CONTACT MESSAGE

Name: ${input.visitorName}
Email: ${input.visitorEmail}
Subject: ${input.subject}

Message:
${input.message}

Received:
${received}

${HIMALCYBERX_SITE_URL}

You are receiving this email because a visitor contacted HimalCyberX through the website contact form.`;

  return {
    subject,
    html,
    text,
  };
}
