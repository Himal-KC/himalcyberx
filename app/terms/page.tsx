import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import type { LegalSection } from "@/components/legal/LegalDocumentPage";
import { LEGAL_LAST_UPDATED, LEGAL_LAST_UPDATED_ISO } from "@/lib/legal/constants";
import { focusRing } from "@/lib/page-data";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings/site-settings";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Use",
  description:
    "Read the HimalCyberX Terms of Use, including educational purpose, ethical cybersecurity practice and authorized testing requirements.",
  path: "/terms",
});

function buildTermsSections(siteName: string): LegalSection[] {
  return [
    {
      title: "Acceptance of Terms",
      paragraphs: [
        `By accessing or using ${siteName}, you agree to these Terms of Use. If you do not agree, you should not use this website.`,
        "These terms apply to all visitors and users of the public website, including readers of articles, labs, tutorials and other educational content.",
      ],
    },
    {
      title: "Educational Purpose",
      paragraphs: [
        `Content on ${siteName} is provided for cybersecurity education, awareness, research commentary and defensive security learning.`,
        "Information on this website does not constitute legal, professional, compliance, incident response or investment advice.",
      ],
    },
    {
      title: "Cybersecurity and Ethical Use",
      paragraphs: [
        `${siteName} cybersecurity labs, tutorials and technical information are provided for educational, defensive security and authorized testing purposes.`,
        `${siteName} does not encourage unauthorized access, disruption, malicious activity or illegal use of cybersecurity techniques. You are responsible for ensuring that your use of any information from this website complies with applicable laws, policies and ethical standards.`,
        "For additional responsible-use guidance, see the Disclaimer published on this website.",
      ],
    },
    {
      title: "Authorized Testing",
      paragraphs: [
        "You must only test systems, networks, applications or devices that you own or have explicit written permission to assess.",
        "Techniques discussed on this website should be applied only in controlled lab environments or other clearly authorized contexts. Unauthorized testing may be unlawful and may cause harm.",
      ],
    },
    {
      title: "Intellectual Property",
      paragraphs: [
        `Unless otherwise stated, content published on ${siteName} — including articles, labs, tutorials, branding and site materials — is owned by or licensed to ${siteName} and is protected by applicable intellectual property laws.`,
        "You may not copy, republish, redistribute or commercially exploit site content without permission, except where limited personal, educational or reference use is permitted by law.",
      ],
    },
    {
      title: "Accuracy of Information",
      paragraphs: [
        `${siteName} aims to provide accurate and useful cybersecurity information, but content may become outdated as threats, tools and technologies evolve.`,
        "Information is provided on an \"as is\" and \"as available\" basis without warranties of completeness, accuracy or fitness for a particular purpose. You use the content at your own discretion and risk.",
      ],
    },
    {
      title: "External Links",
      paragraphs: [
        `${siteName} may reference or link to third-party websites, tools, documentation and resources. Those external services are not controlled by ${siteName}, and we are not responsible for their content, availability or practices.`,
        "Your use of third-party resources is subject to the terms and policies of those providers.",
      ],
    },
    {
      title: "Site Availability and Changes",
      paragraphs: [
        `We aim to keep ${siteName} available and useful, but access may be interrupted for maintenance, updates, security work or technical reasons.`,
        "Content, features and site materials may be added, changed or removed without prior notice.",
      ],
    },
    {
      title: "Related Policies",
      paragraphs: [
        `These Terms should be read together with the ${siteName} Privacy Policy, which explains how information submitted through the website is handled.`,
        "The Disclaimer provides additional information about educational use, authorized security testing, technical accuracy and responsible interpretation of cybersecurity content.",
      ],
    },
    {
      title: "Limitation of Liability",
      paragraphs: [
        `To the fullest extent permitted by applicable law, ${siteName} and its contributors shall not be liable for any direct, indirect, incidental, consequential or special damages arising from your use of this website or reliance on its content.`,
        "This includes, without limitation, damages related to security testing, system disruption, data loss, business interruption or misuse of technical information obtained from the site.",
      ],
    },
    {
      title: "Changes to These Terms",
      paragraphs: [
        `These Terms of Use may be updated as ${siteName} evolves. Material changes will be posted on this page with an updated "Last updated" date.`,
        "Your continued use of the website after changes are posted constitutes acceptance of the revised terms.",
      ],
    },
  ];
}

export default async function TermsPage() {
  const settings = await getSiteSettings();

  return (
    <LegalDocumentPage
      breadcrumbLabel="Terms of Use"
      heroLabel="Legal"
      heroTitle="TERMS OF USE"
      heroDescription="Terms governing use of HimalCyberX content, labs, tutorials and educational resources."
      lastUpdated={LEGAL_LAST_UPDATED}
      lastUpdatedIso={LEGAL_LAST_UPDATED_ISO}
      introduction={`These Terms of Use govern your access to and use of ${settings.siteName}, an independent cybersecurity research and education website. Please read them carefully before using the site.`}
      sections={buildTermsSections(settings.siteName)}
      supplementaryContent={
        <p>
          Related pages:{" "}
          <Link
            href="/privacy"
            className={`text-hcx-cyan hover:underline ${focusRing}`}
          >
            Privacy Policy
          </Link>
          ,{" "}
          <Link
            href="/disclaimer"
            className={`text-hcx-cyan hover:underline ${focusRing}`}
          >
            Disclaimer
          </Link>
          .
        </p>
      }
      contactText="If you have questions about these Terms of Use, please"
      siteName={settings.siteName}
    />
  );
}
