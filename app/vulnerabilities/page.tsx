import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { VulnerabilityAnalysisSection } from "@/components/vulnerabilities/VulnerabilityAnalysisSection";
import { VulnerabilityResourcesSection } from "@/components/vulnerabilities/VulnerabilityResourcesSection";
import { VulnerabilityTopicsSection } from "@/components/vulnerabilities/VulnerabilityTopicsSection";
import {
  getVulnerabilityAnalysisArticles,
  getVulnerabilityResearchTopics,
} from "@/lib/vulnerabilities-content";
import { getPublishedArticles } from "@/lib/supabase/public-articles";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Vulnerability Intelligence & CVE Research",
  description:
    "Cybersecurity vulnerability research covering CVEs, exploitation risk, patching priorities and defensive remediation guidance.",
  path: "/vulnerabilities",
});

export const revalidate = 60;

export default async function VulnerabilitiesPage() {
  const publishedArticles = await getPublishedArticles();
  const vulnerabilityArticles =
    getVulnerabilityAnalysisArticles(publishedArticles);
  const researchTopics = getVulnerabilityResearchTopics(publishedArticles);

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Vulnerabilities" }]} />
      <PageHero
        label="HCX Vulnerability Research"
        title="Vulnerability Intelligence"
        description="Analysis of publicly disclosed vulnerabilities, exploitation risks, patching priorities and defensive guidance."
        supportingText="Coverage based on public advisories, CVE records and trusted security sources."
        compact
      />

      <VulnerabilityAnalysisSection articles={vulnerabilityArticles} />
      <VulnerabilityResourcesSection />
      <VulnerabilityTopicsSection topics={researchTopics} />
    </PageShell>
  );
}
