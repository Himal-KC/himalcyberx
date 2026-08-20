import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ForensicsContentSection } from "@/components/forensics/ForensicsContentSection";
import { ForensicsTopicsSection } from "@/components/forensics/ForensicsTopicsSection";
import { buildForensicsPageData } from "@/lib/forensics-content";
import { getHomepageContentCatalog } from "@/lib/supabase/public-homepage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Digital Forensics & DFIR Research",
  description:
    "Digital forensics and incident response content covering forensic analysis, evidence handling, investigation workflows and defensive DFIR practices.",
  path: "/forensics",
});

export const revalidate = 60;

interface ForensicsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ForensicsPage({ searchParams }: ForensicsPageProps) {
  const params = await searchParams;
  const catalog = await getHomepageContentCatalog();
  const pageData = buildForensicsPageData(catalog, params);

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Forensics" }]} />
      <PageHero
        label="Digital Forensics • DFIR"
        title="Digital Forensics & Incident Response"
        description="Practical analysis of digital evidence, incident response workflows, forensic tools and investigative techniques."
        supportingText="Educational content focused on lawful, authorized and defensive investigation."
        compact
      />

      <Suspense fallback={null}>
        <ForensicsContentSection
          items={pageData.items}
          filters={pageData.filters}
          filtersActive={pageData.filtersActive}
          totalMatching={pageData.totalMatching}
        />
      </Suspense>

      <ForensicsTopicsSection topics={pageData.topics} />
    </PageShell>
  );
}
