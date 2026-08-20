import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ThreatAnalysisSection } from "@/components/threats/ThreatAnalysisSection";
import { ThreatTopicsSection } from "@/components/threats/ThreatTopicsSection";
import { getThreatAnalysisArticles } from "@/lib/threats-content";
import { getPublishedArticles } from "@/lib/supabase/public-articles";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Threat Intelligence & Cyber Threat Research",
  description:
    "Cyber threat intelligence covering ransomware, malware, phishing, threat actors and emerging cybersecurity threats.",
  path: "/threats",
});

export const revalidate = 60;

export default async function ThreatsPage() {
  const publishedArticles = await getPublishedArticles();
  const threatArticles = getThreatAnalysisArticles(publishedArticles);

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Threats" }]} />
      <PageHero
        label="HCX Intelligence"
        title="Threat Intelligence"
        description="Research and analysis of ransomware, malware, phishing campaigns, threat actors and emerging cyber threats."
      />

      <section className="border-b border-hcx-border bg-hcx-bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <p className="max-w-3xl text-sm leading-relaxed text-hcx-text-secondary">
            Independent analysis based on publicly available security
            information.
          </p>
        </div>
      </section>

      <ThreatAnalysisSection articles={threatArticles} />
      <ThreatTopicsSection />
    </PageShell>
  );
}
