import type { ContentNotificationContentType } from "@/lib/notifications/constants";
import { HIMALCYBERX_SITE_URL } from "@/lib/email/constants";
import { escapeHtml } from "@/lib/email/templates/email-html";
import {
  buildContentTypeBadge,
  buildEmailBodySection,
  buildEmailBrandHeader,
  buildEmailCtaButton,
  buildEmailDocument,
  buildEmailHeading,
  buildEmailParagraph,
  buildEmailSignature,
  buildEmailSignatureBanner,
  buildFeaturedImageBanner,
  buildSubscriberOuterFooter,
} from "@/lib/email/templates/email-shell";

export interface ContentNotificationEmailInput {
  contentType: ContentNotificationContentType;
  title: string;
  description: string;
  url: string;
  featuredImage: string | null;
  featuredImageAlt?: string | null;
  publishedAt: string | null;
  unsubscribeUrl?: string | null;
}

export interface ContentNotificationEmailContent {
  subject: string;
  html: string;
  text: string;
}

const contentTypeBadges: Record<ContentNotificationContentType, string> = {
  article: "New Article",
  lab: "New Cyber Lab",
  tutorial: "New Tutorial",
};

const ctaLabels: Record<ContentNotificationContentType, string> = {
  article: "Read Article →",
  lab: "Open Cyber Lab →",
  tutorial: "View Tutorial →",
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

export function buildContentNotificationEmail(
  input: ContentNotificationEmailInput,
): ContentNotificationEmailContent {
  const badgeLabel = contentTypeBadges[input.contentType];
  const ctaLabel = ctaLabels[input.contentType];
  const subject = `${subjectPrefixes[input.contentType]} ${input.title}`;
  const publishedLabel = formatPublicationDate(input.publishedAt);
  const imageAlt =
    input.featuredImageAlt?.trim() || `${input.title} featured image`;

  const bodyHtml = [
    buildEmailBrandHeader(),
    buildFeaturedImageBanner({
      imageUrl: input.featuredImage,
      altText: imageAlt,
    }),
    buildEmailBodySection(`
      ${buildContentTypeBadge(badgeLabel)}
      ${buildEmailHeading(input.title, 2)}
      ${
        publishedLabel
          ? `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#94a3b8;">Published ${escapeHtml(publishedLabel)}</p>`
          : ""
      }
      ${buildEmailParagraph(input.description, { muted: true })}
      <div style="margin-top:28px;">
        ${buildEmailCtaButton({ label: ctaLabel, href: input.url })}
      </div>
    `),
    buildEmailSignatureBanner(),
    buildEmailSignature(),
  ].join("");

  const html = buildEmailDocument({
    title: subject,
    bodyHtml,
    outerFooterHtml: buildSubscriberOuterFooter({
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  });

  const unsubscribeText = input.unsubscribeUrl
    ? `\n\nUnsubscribe: ${input.unsubscribeUrl}`
    : "";

  const text = `HimalCyberX
${badgeLabel.toUpperCase()}

${input.title}
${publishedLabel ? `Published ${publishedLabel}` : ""}

${input.description}

${ctaLabel.replace(" →", "")}: ${input.url}${unsubscribeText}

© ${new Date().getFullYear()} HimalCyberX`;

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
