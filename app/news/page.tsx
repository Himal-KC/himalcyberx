import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { NewsContent } from "@/components/pages/NewsContent";
import { buildNewsPageData } from "@/lib/news-list";
import { getPublishedArticles } from "@/lib/supabase/public-articles";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cybersecurity News & Research",
  description:
    "HimalCyberX covers threat intelligence, security research, vulnerabilities, phishing, ransomware, digital forensics, and emerging cyber threats.",
  path: "/news",
});

export const revalidate = 60;

interface NewsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const articles = await getPublishedArticles();
  const pageData = buildNewsPageData(articles, params);

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "News" }]} />
      <PageHero
        label="Editorial"
        title="Cybersecurity News & Research"
        description="HimalCyberX covers threat intelligence, security research, vulnerabilities, phishing, ransomware, digital forensics, and emerging cyber threats."
      />
      <Suspense fallback={null}>
        <NewsContent
          featured={pageData.featured}
          articles={pageData.gridArticles}
          categories={pageData.categories}
          filters={pageData.filters}
          filtersActive={pageData.filtersActive}
          totalPublished={pageData.totalPublished}
        />
      </Suspense>
    </PageShell>
  );
}
