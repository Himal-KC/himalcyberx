import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import type { LegalSection } from "@/components/legal/LegalDocumentPage";
import { LEGAL_LAST_UPDATED, LEGAL_LAST_UPDATED_ISO } from "@/lib/legal/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings/site-settings";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Read the HimalCyberX Privacy Policy for details on newsletter subscriptions, contact form data, service providers, analytics and your privacy choices.",
  path: "/privacy",
});

function buildPrivacySections(siteName: string): LegalSection[] {
  return [
    {
      title: "Information We Collect",
      paragraphs: [
        `${siteName} collects only information that you voluntarily provide when using certain features on this website. We do not require account registration for general browsing of public content.`,
        "Depending on how you interact with the site, information may include:",
      ],
      list: [
        "Newsletter subscription email addresses submitted through signup forms.",
        "Contact form details such as your name, email address, subject and message.",
        "Limited technical information used to help protect public forms, such as an IP address processed for rate limiting and abuse prevention.",
      ],
    },
    {
      title: "Newsletter Subscriptions",
      paragraphs: [
        `If you subscribe to the ${siteName} newsletter, we collect the email address you submit and basic subscription metadata such as signup source and subscription status.`,
        `This information is used to send welcome messages, cybersecurity research updates, threat intelligence summaries, practical learning announcements and related newsletter communications when those messages are sent.`,
        "You may unsubscribe using the secure unsubscribe link included in newsletter emails, or contact us to request removal of your subscription details.",
      ],
    },
    {
      title: "Contact Form Information",
      paragraphs: [
        `When you submit the ${siteName} contact form, we collect the information you provide, including your name, email address, subject and message content. This information is used to review and respond to enquiries, feedback, correction requests, research suggestions or responsible security concerns.`,
        "Please do not submit sensitive personal information unless it is necessary for your enquiry.",
      ],
    },
    {
      title: "How Information Is Used",
      paragraphs: [
        `Information submitted through ${siteName} forms is used for the purposes described above, including:`,
      ],
      list: [
        "Managing newsletter subscriptions and related communications.",
        "Responding to contact enquiries and website feedback.",
        "Maintaining basic records needed to operate the website responsibly.",
        "Protecting public forms from abuse through validation, honeypot checks and rate limiting.",
      ],
    },
    {
      title: "Service Providers",
      paragraphs: [
        `${siteName} uses trusted third-party service providers to operate parts of the website. Depending on how you use the site, information may be processed by providers such as:`,
      ],
      list: [
        "Supabase — secure backend storage for newsletter subscriptions and contact form messages.",
        "Resend — delivery of transactional emails such as newsletter welcome messages and content update notifications to subscribers.",
        "Upstash — rate limiting for public forms, which may process IP addresses to help prevent abuse when that protection is enabled.",
        "Google Analytics — website usage measurement when analytics is enabled through site configuration.",
      ],
      closingParagraphs: [
        "These providers process information only as needed to provide their services to the website. Their own privacy practices may also apply.",
      ],
    },
    {
      title: "Data Storage and Security",
      paragraphs: [
        `Information submitted through forms on ${siteName} may be stored in secure backend systems used to operate the website. We take reasonable steps to protect submitted information, but no method of transmission or storage is completely secure.`,
        "This website is intended for public cybersecurity research and education. It is not designed to collect highly sensitive personal data.",
      ],
    },
    {
      title: "Cookies and Analytics",
      paragraphs: [
        `${siteName} may use cookies or similar technologies needed for essential site operation, including administrative authentication mechanisms that apply only to site administrators.`,
        "When configured, the site may use Google Analytics (GA4) to understand how visitors use public pages and to improve content. Analytics is not loaded on admin pages.",
        "At present, this website does not use a separate cookie consent banner. If analytics, advertising or similar technologies change materially, this Privacy Policy will be updated accordingly.",
      ],
    },
    {
      title: "Advertising",
      paragraphs: [
        `${siteName} does not currently serve third-party advertising on this website.`,
        "If third-party advertising services are introduced in the future, including services such as Google AdSense, this Privacy Policy will be updated to describe the technologies used, the information involved and the choices available to visitors.",
      ],
    },
    {
      title: "Third-Party Links",
      paragraphs: [
        `${siteName} may link to external websites, tools, documentation and reference materials. Those third-party services operate under their own privacy policies and practices, which are outside the control of ${siteName}.`,
        "We encourage you to review the privacy policies of any external sites you visit.",
      ],
    },
    {
      title: "Data Retention",
      paragraphs: [
        "We retain submitted information only for as long as reasonably necessary to fulfil the purposes described in this policy, including responding to enquiries, maintaining newsletter subscriptions and operating the website.",
        "You may request deletion of personal information you have submitted through our forms by contacting us.",
      ],
    },
    {
      title: "User Rights",
      paragraphs: [
        "Depending on your location, you may have rights to request access to, correction of, or deletion of personal information you have submitted through this website.",
        `To make a privacy-related request, please contact ${siteName} through the contact page. We will review reasonable requests in good faith.`,
      ],
    },
    {
      title: "Changes to This Privacy Policy",
      paragraphs: [
        `This Privacy Policy may be updated as ${siteName} adds features, changes how information is handled, or improves transparency. Material changes will be reflected on this page with an updated "Last updated" date.`,
        "Continued use of the website after changes are posted constitutes your acknowledgment of the updated policy.",
      ],
    },
  ];
}

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <LegalDocumentPage
      breadcrumbLabel="Privacy Policy"
      heroLabel="Legal"
      heroTitle="PRIVACY POLICY"
      heroDescription="How HimalCyberX handles information submitted through newsletter and contact forms, and the service providers used to operate the site."
      lastUpdated={LEGAL_LAST_UPDATED}
      lastUpdatedIso={LEGAL_LAST_UPDATED_ISO}
      introduction={`This Privacy Policy explains how ${settings.siteName} handles information voluntarily submitted through this website. ${settings.siteName} is an independent cybersecurity research and education platform. This policy is provided for transparency and does not represent formal legal certification or regulatory compliance claims.`}
      sections={buildPrivacySections(settings.siteName)}
      contactText="If you have questions about this Privacy Policy or wish to make a privacy-related request, please"
      siteName={settings.siteName}
    />
  );
}
