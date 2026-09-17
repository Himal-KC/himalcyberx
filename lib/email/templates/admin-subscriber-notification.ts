import { ADMIN_SUBSCRIBER_NOTIFICATION_SUBJECT } from "@/lib/email/constants";
import {
  formatAdminNotificationTimestamp,
  formatSubscriberSourceLabel,
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

export interface AdminSubscriberNotificationInput {
  subscriberEmail: string;
  source: string;
  subscribedAt: Date | string;
}

export interface AdminSubscriberNotificationContent {
  subject: string;
  html: string;
  text: string;
}

export function buildAdminSubscriberNotificationEmail(
  input: AdminSubscriberNotificationInput,
): AdminSubscriberNotificationContent {
  const sourceLabel = formatSubscriberSourceLabel(input.source);
  const subscribed = formatAdminNotificationTimestamp(input.subscribedAt);

  const bodyHtml = [
    buildEmailBrandHeader({ compact: true }),
    buildEmailBodySection(`
      ${buildEmailHeading("New subscriber", 2)}
      ${buildEmailParagraph("A new HimalCyberX subscriber was added from the website.")}
      <p style="margin:0 0 10px;font-size:16px;line-height:1.7;color:#f4f7fb;">
        <strong style="color:#94a3b8;font-weight:600;">Email:</strong>
        ${escapeHtml(input.subscriberEmail)}
      </p>
      <p style="margin:0 0 10px;font-size:16px;line-height:1.7;color:#f4f7fb;">
        <strong style="color:#94a3b8;font-weight:600;">Source:</strong>
        ${escapeHtml(sourceLabel)}
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#f4f7fb;">
        <strong style="color:#94a3b8;font-weight:600;">Subscribed:</strong>
        ${escapeHtml(subscribed)}
      </p>
    `),
    buildEmailSignatureBanner(),
  ].join("");

  const html = buildEmailDocument({
    title: ADMIN_SUBSCRIBER_NOTIFICATION_SUBJECT,
    bodyHtml,
    outerFooterHtml: buildTransactionalOuterFooter(
      "You are receiving this email because a new subscriber signed up on HimalCyberX.",
    ),
  });

  const text = `HimalCyberX

NEW SUBSCRIBER

Email: ${input.subscriberEmail}
Source: ${sourceLabel}
Subscribed: ${subscribed}

You are receiving this email because a new subscriber signed up on HimalCyberX.`;

  return {
    subject: ADMIN_SUBSCRIBER_NOTIFICATION_SUBJECT,
    html,
    text,
  };
}
