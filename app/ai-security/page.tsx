import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AISecurityContentSection } from "@/components/ai-security/AISecurityContentSection";
import { AISecurityTopicsSection } from "@/components/ai-security/AISecurityTopicsSection";
import { buildAISecurityPageData } from "@/lib/ai-security-content";
import { getHomepageContentCatalog } from "@/lib/supabase/public-homepage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Security, LLM Security & Emerging Cyber Threats",
  description:
    "AI security research covering LLM security, prompt injection, AI-assisted threats, deepfakes, governance and responsible defensive AI.",
  path: "/ai-security",
});

export const revalidate = 60;

interface AISecurityPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AISecurityPage({
  searchParams,
}: AISecurityPageProps) {
  const params = await searchParams;
  const catalog = await getHomepageContentCatalog();
  const pageData = buildAISecurityPageData(catalog, params);

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "AI Security" }]} />
      <PageHero
        label="AI + Cybersecurity"
        title="AI Security"
        description="Research and practical guidance covering AI-assisted threats, prompt injection, LLM security, deepfake risk, AI governance and defensive use of artificial intelligence."
        supportingText="Focused on responsible, defensive and security-conscious use of AI technologies."
        compact
      />

      <Suspense fallback={null}>
        <AISecurityContentSection
          items={pageData.items}
          filters={pageData.filters}
          filtersActive={pageData.filtersActive}
          totalMatching={pageData.totalMatching}
        />
      </Suspense>

      <AISecurityTopicsSection topics={pageData.topics} />
    </PageShell>
  );
}
