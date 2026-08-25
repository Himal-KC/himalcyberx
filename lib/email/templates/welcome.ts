import {
  HIMALCYBERX_SITE_URL,
  WELCOME_EMAIL_SUBJECT,
} from "@/lib/email/constants";
import {
  buildEmailBodySection,
  buildEmailBrandHeader,
  buildEmailCtaButton,
  buildEmailDocument,
  buildEmailHeading,
  buildEmailParagraph,
  buildEmailSignatureBanner,
  buildSubscriberOuterFooter,
} from "@/lib/email/templates/email-shell";

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
  const bodyHtml = [
    buildEmailBrandHeader(),
    buildEmailBodySection(`
      ${buildEmailHeading("Welcome to HimalCyberX")}
      ${buildEmailParagraph("Thanks for subscribing.")}
      ${buildEmailParagraph(
        "You may receive updates about threat intelligence, security research, tutorials, cyber labs, and practical defensive guidance from HimalCyberX.",
        { muted: true },
      )}
      ${buildEmailParagraph(
        "Stay informed, stay prepared, and keep defending the future.",
        { muted: true },
      )}
      <div style="margin-top:28px;">
        ${buildEmailCtaButton({ label: "Explore HimalCyberX →", href: siteUrl })}
      </div>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
        Security reminder: HimalCyberX will never ask for your password or sensitive account credentials by email.
      </p>
    `),
    buildEmailSignatureBanner(),
  ].join("");

  const html = buildEmailDocument({
    title: WELCOME_EMAIL_SUBJECT,
    bodyHtml,
    outerFooterHtml: buildSubscriberOuterFooter({
      unsubscribeUrl,
      recipientEmail: toEmail,
    }),
  });

  const unsubscribeText = unsubscribeUrl
    ? `\n\nUnsubscribe: ${unsubscribeUrl}`
    : "";

  const text = `HimalCyberX
Cybersecurity Research & Learning

WELCOME TO HIMALCYBERX

Thanks for subscribing.

You may receive updates about:
- Threat Intelligence
- Tutorials
- Cyber Labs
- Security Research

Explore HimalCyberX: ${siteUrl}

Security reminder: HimalCyberX will never ask for your password or sensitive account credentials by email.

You are receiving this email because you subscribed to HimalCyberX updates.${unsubscribeText}

Sent to ${toEmail}

© ${new Date().getFullYear()} HimalCyberX`;

  return {
    subject: WELCOME_EMAIL_SUBJECT,
    html,
    text,
  };
}
