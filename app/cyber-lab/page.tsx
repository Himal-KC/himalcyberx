import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CyberLabCatalogSection } from "@/components/cyber-lab/CyberLabCatalogSection";
import { CyberLabLearningPaths } from "@/components/cyber-lab/CyberLabLearningPaths";
import { FeaturedLab } from "@/components/cyber-lab/FeaturedLab";
import {
  buildCyberLabPageData,
  getCyberLabLearningPaths,
} from "@/lib/cyber-lab-list";
import { getPublishedLabs } from "@/lib/supabase/public-labs";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cybersecurity Labs & Hands-On Security Training",
  description:
    "Hands-on cybersecurity labs covering network security, digital forensics, defensive security and practical cyber skills.",
  path: "/cyber-lab",
});

export const revalidate = 60;

interface CyberLabPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CyberLabPage({ searchParams }: CyberLabPageProps) {
  const params = await searchParams;
  const labs = await getPublishedLabs();
  const pageData = buildCyberLabPageData(labs, params);
  const learningPaths = getCyberLabLearningPaths(labs);

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Cyber Lab" }]} />
      <PageHero
        label="Learn • Test • Defend"
        title="HCX Cyber Lab"
        description="Hands-on cybersecurity labs, technical walkthroughs and practical defensive security exercises."
        supportingText="Practice only in systems and environments you own or are explicitly authorized to test."
        compact
      />

      {pageData.featured ? (
        <section className="border-b border-hcx-border py-10 md:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FeaturedLab lab={pageData.featured} />
          </div>
        </section>
      ) : null}

      <Suspense fallback={null}>
        <CyberLabCatalogSection
          labs={pageData.gridLabs}
          categories={pageData.categories}
          filters={pageData.filters}
          filtersActive={pageData.filtersActive}
          totalPublished={pageData.totalPublished}
        />
      </Suspense>

      <CyberLabLearningPaths paths={learningPaths} />
    </PageShell>
  );
}
