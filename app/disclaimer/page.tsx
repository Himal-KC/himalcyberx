import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import type { LegalSection } from "@/components/legal/LegalDocumentPage";
import {
  DISCLAIMER_LAST_UPDATED,
  DISCLAIMER_LAST_UPDATED_ISO,
} from "@/lib/legal/constants";
import { focusRing } from "@/lib/page-data";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings/site-settings";

export const metadata: Metadata = buildPageMetadata({
  title: "Disclaimer",
  description:
    "Read the HimalCyberX disclaimer covering cybersecurity education, authorized security testing, technical accuracy, external resources and responsible use.",
  path: "/disclaimer",
});

function buildDisclaimerSections(siteName: string): LegalSection[] {
  return [
    {
      title: "Educational and Informational Purpose",
      paragraphs: [
        `Content published on ${siteName} is provided for general educational and informational purposes. It is intended to support cybersecurity awareness, defensive security learning and responsible research commentary.`,
        "Nothing on this website should be treated as professional cybersecurity, legal, financial, compliance, incident response or other specialist advice. You should seek qualified professional guidance where appropriate for your specific circumstances.",
      ],
    },
    {
      title: "Authorized Security Testing",
      paragraphs: [
        `Cybersecurity tutorials, labs, commands, techniques and tools discussed on ${siteName} should only be used on:`,
      ],
      list: [
        "systems owned by you;",
        "systems where you have explicit authorization to perform security testing; or",
        "intentionally designed training or lab environments.",
      ],
      closingParagraphs: [
        `${siteName} does not encourage unauthorized access, malicious activity, disruption, data theft or illegal use of security techniques. You are solely responsible for ensuring that your activities comply with applicable laws, contracts, policies and ethical standards.`,
      ],
    },
    {
      title: "Cybersecurity Risk",
      paragraphs: [
        "Cybersecurity tools, commands, configuration changes and testing activities can affect systems, applications, networks or data if used incorrectly or without adequate preparation.",
        "You are responsible for understanding commands, scripts, tools and techniques before using them. Where appropriate, use isolated testing environments, backups and change controls before applying techniques to production or sensitive systems.",
      ],
    },
    {
      title: "Accuracy and Changing Information",
      paragraphs: [
        "Cybersecurity changes rapidly. Threat intelligence, vulnerabilities, CVEs, software versions, vendor guidance, defensive recommendations and other technical information may change after publication.",
        `${siteName} aims to provide accurate and useful information, but we do not guarantee that every article, lab, tutorial or reference will always remain complete, current or free from error.`,
      ],
    },
    {
      title: "No Guarantee of Security",
      paragraphs: [
        `Following security recommendations, tutorials or defensive guidance from ${siteName} cannot guarantee that a system, network, application, account or organisation will be completely secure.`,
        "Security outcomes depend on many factors, including implementation quality, environment complexity, attacker capability, configuration drift and ongoing maintenance.",
      ],
    },
    {
      title: "External Links and Third-Party Resources",
      paragraphs: [
        `${siteName} articles and educational materials may link to external sources such as security vendors, government agencies, research organisations, documentation sites and other third-party websites.`,
        `${siteName} is not responsible for the availability, accuracy, security, privacy practices or content of third-party websites or services. Your use of external resources is subject to the terms and policies of those providers.`,
      ],
    },
    {
      title: "Responsible Disclosure",
      paragraphs: [
        `${siteName} supports responsible and ethical vulnerability research and responsible disclosure practices.`,
        "Security vulnerabilities should be reported to affected vendors, maintainers or organisations through appropriate disclosure channels where applicable, rather than exploited for harm or unauthorized access.",
      ],
    },
    {
      title: "Limitation of Liability",
      paragraphs: [
        `To the extent permitted by applicable law, ${siteName} and its contributors shall not be liable for any loss or damage arising from your use of, or reliance on, information provided through this website.`,
        "You use content from this site at your own discretion and responsibility, including when applying technical guidance, running commands, using security tools or conducting security testing activities.",
      ],
    },
  ];
}

export default async function DisclaimerPage() {
  const settings = await getSiteSettings();

  return (
    <LegalDocumentPage
      breadcrumbLabel="Disclaimer"
      heroLabel="Legal"
      heroTitle="DISCLAIMER"
      heroDescription="Important information about educational use, authorized security testing and responsible interpretation of cybersecurity content."
      lastUpdated={DISCLAIMER_LAST_UPDATED}
      lastUpdatedIso={DISCLAIMER_LAST_UPDATED_ISO}
      introduction={`${settings.siteName} provides cybersecurity research, threat intelligence, educational articles, tutorials, cyber labs and related security information. The content is intended for educational, informational and defensive security purposes.`}
      sections={buildDisclaimerSections(settings.siteName)}
      contactContent={
        <p>
          If you have questions about this Disclaimer, please contact us through
          our{" "}
          <Link
            href="/contact"
            className={`text-hcx-cyan hover:underline ${focusRing}`}
          >
            Contact page
          </Link>
          .
        </p>
      }
      siteName={settings.siteName}
    />
  );
}
