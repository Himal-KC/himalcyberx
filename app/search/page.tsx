import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SearchPageContent } from "@/components/search/SearchPageContent";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { searchPublishedContent } from "@/lib/supabase/public-search";

export const metadata: Metadata = buildPageMetadata({
  title: "Search",
  description:
    "Search published cybersecurity articles, cyber labs and tutorials on HimalCyberX.",
  path: "/search",
  noIndex: true,
});

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results =
    query.length >= 2 ? await searchPublishedContent(query) : {
      articles: [],
      labs: [],
      tutorials: [],
    };

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Search" }]} />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-12 text-hcx-text-secondary sm:px-6 lg:px-8">
            Loading search...
          </div>
        }
      >
        <SearchPageContent
          key={query}
          initialQuery={query}
          results={results}
        />
      </Suspense>
    </PageShell>
  );
}
