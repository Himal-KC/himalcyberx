import { buildContactAcknowledgementEmail } from "@/lib/email/templates/contact-acknowledgement";
import { buildContactReplyEmail } from "@/lib/email/templates/contact-reply";
import { buildContentNotificationEmail } from "@/lib/email/templates/content-notification";
import { buildWelcomeEmail } from "@/lib/email/templates/welcome";

export interface EmailPreviewItem {
  id: string;
  label: string;
  subject: string;
  html: string;
}

const SAMPLE_UNSUBSCRIBE_URL =
  "https://himalcyberx.com/unsubscribe?token=preview-only";

const SAMPLE_FEATURED_IMAGE =
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80";

export function getEmailPreviewItems(): EmailPreviewItem[] {
  const welcome = buildWelcomeEmail(
    "preview@example.com",
    SAMPLE_UNSUBSCRIBE_URL,
  );

  const article = buildContentNotificationEmail({
    contentType: "article",
    title: "How Threat Actors Are Using AI in Cyberattacks",
    description:
      "A practical overview of how AI-assisted phishing, reconnaissance, and malware development are changing defender priorities in 2026.",
    url: "https://himalcyberx.com/articles/how-threat-actors-are-using-ai-in-cyberattacks",
    featuredImage: SAMPLE_FEATURED_IMAGE,
    featuredImageAlt: "Abstract cybersecurity network visualization",
    publishedAt: new Date().toISOString(),
    unsubscribeUrl: SAMPLE_UNSUBSCRIBE_URL,
  });

  const tutorial = buildContentNotificationEmail({
    contentType: "tutorial",
    title: "Analyze a Phishing Email Header Step by Step",
    description:
      "Learn how to inspect headers, authentication results, and routing anomalies in suspicious email samples.",
    url: "https://himalcyberx.com/tutorials/analyze-phishing-email-header",
    featuredImage: SAMPLE_FEATURED_IMAGE,
    publishedAt: new Date().toISOString(),
    unsubscribeUrl: SAMPLE_UNSUBSCRIBE_URL,
  });

  const lab = buildContentNotificationEmail({
    contentType: "lab",
    title: "Windows Event Log Triage Basics",
    description:
      "Practice identifying suspicious authentication and process creation patterns in a guided lab environment.",
    url: "https://himalcyberx.com/cyber-lab/windows-event-log-triage",
    featuredImage: null,
    publishedAt: new Date().toISOString(),
    unsubscribeUrl: SAMPLE_UNSUBSCRIBE_URL,
  });

  const acknowledgement = buildContactAcknowledgementEmail("Himal");
  const reply = buildContactReplyEmail(
    "Re: Your message to HimalCyberX",
    "Thanks for reaching out.\n\nWe have reviewed your message and will follow up shortly with more detail.\n\nRegards,\nHimalCyberX",
  );

  return [
    { id: "welcome", label: "Welcome", subject: welcome.subject, html: welcome.html },
    {
      id: "article",
      label: "Article Notification",
      subject: article.subject,
      html: article.html,
    },
    {
      id: "tutorial",
      label: "Tutorial Notification",
      subject: tutorial.subject,
      html: tutorial.html,
    },
    {
      id: "lab",
      label: "Cyber Lab Notification",
      subject: lab.subject,
      html: lab.html,
    },
    {
      id: "acknowledgement",
      label: "Contact Acknowledgement",
      subject: acknowledgement.subject,
      html: acknowledgement.html,
    },
    {
      id: "reply",
      label: "Contact Reply",
      subject: reply.subject,
      html: reply.html,
    },
  ];
}
