import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FeaturedTutorial } from "@/components/tutorials/FeaturedTutorial";
import { TutorialCatalogSection } from "@/components/tutorials/TutorialCatalogSection";
import { buildTutorialPageData } from "@/lib/tutorial-list";
import { getPublishedTutorials } from "@/lib/supabase/public-tutorials";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cybersecurity Tutorials & Practical Security Guides",
  description:
    "Step-by-step cybersecurity tutorials covering defensive security, digital forensics, networking, security tools and practical cyber skills.",
  path: "/tutorials",
});

export const revalidate = 60;

interface TutorialsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TutorialsPage({ searchParams }: TutorialsPageProps) {
  const params = await searchParams;
  const tutorials = await getPublishedTutorials();
  const pageData = buildTutorialPageData(tutorials, params);

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Tutorials" }]} />
      <PageHero
        label="Practical Security Guides"
        title="Cybersecurity Tutorials"
        description="Step-by-step cybersecurity guides covering defensive security, digital forensics, networking, security tools and practical technical skills."
        supportingText="Built for practical learning in safe and authorized environments."
        compact
      />

      {pageData.featured ? (
        <section className="border-b border-hcx-border py-10 md:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FeaturedTutorial tutorial={pageData.featured} />
          </div>
        </section>
      ) : null}

      <Suspense fallback={null}>
        <TutorialCatalogSection
          tutorials={pageData.gridTutorials}
          categories={pageData.categories}
          filters={pageData.filters}
          filtersActive={pageData.filtersActive}
          totalPublished={pageData.totalPublished}
        />
      </Suspense>
    </PageShell>
  );
}
