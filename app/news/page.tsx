import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { NewsContent } from "@/components/pages/NewsContent";
import { buildNewsListItems } from "@/lib/news-content";
import { getPublishedArticles } from "@/lib/supabase/public-articles";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cybersecurity News",
  description:
    "Editorial analysis, research, guides and threat intelligence from HimalCyberX.",
  path: "/news",
});

export const revalidate = 60;

export default async function NewsPage() {
  const dbArticles = await getPublishedArticles();
  const articles = buildNewsListItems(dbArticles);

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "News" }]} />
      <PageHero
        label="Editorial"
        title="Latest from HCX"
        description="Editorial analysis, research, guides and threat intelligence from HimalCyberX."
      />
      <NewsContent articles={articles} />
    </PageShell>
  );
}
