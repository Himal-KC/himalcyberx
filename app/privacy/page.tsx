import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import type { LegalSection } from "@/components/legal/LegalDocumentPage";
import { LEGAL_LAST_UPDATED, LEGAL_LAST_UPDATED_ISO } from "@/lib/legal/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings/site-settings";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Read the HimalCyberX Privacy Policy to understand how newsletter subscriptions and contact form submissions are handled.",
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
      ],
    },
    {
      title: "Newsletter Subscriptions",
      paragraphs: [
        `If you subscribe to the ${siteName} newsletter, we collect the email address you submit. This information is used to send cybersecurity research updates, threat intelligence summaries and practical learning announcements when those communications are sent.`,
        "You may unsubscribe from newsletter communications when that option is made available, or you may contact us to request removal of your subscription details.",
      ],
    },
    {
      title: "Contact Form Information",
      paragraphs: [
        `When you submit the ${siteName} contact form, we collect the information you provide, including your name, email address, subject and message content. This information is used to review and respond to your enquiry, feedback or research suggestion.`,
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
        `${siteName} may use essential technical mechanisms required for the website to function. At present, the site does not describe the use of advanced advertising trackers or extensive behavioural analytics.`,
        "Basic analytics or performance monitoring may be introduced in the future to understand how visitors use the website and to improve content. If that changes, this Privacy Policy will be updated accordingly.",
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
      heroDescription="How HimalCyberX handles information submitted through newsletter and contact forms."
      lastUpdated={LEGAL_LAST_UPDATED}
      lastUpdatedIso={LEGAL_LAST_UPDATED_ISO}
      introduction={`This Privacy Policy explains how ${settings.siteName} handles information voluntarily submitted through this website. ${settings.siteName} is an independent cybersecurity research and education platform. This policy is provided for transparency and does not represent formal legal certification or regulatory compliance claims.`}
      sections={buildPrivacySections(settings.siteName)}
      contactText="If you have questions about this Privacy Policy or wish to make a privacy-related request, please"
      siteName={settings.siteName}
    />
  );
}
