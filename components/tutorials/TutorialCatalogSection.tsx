import Link from "next/link";
import { PublishedTutorialCard } from "@/components/tutorials/PublishedTutorialCard";
import { TutorialFilters } from "@/components/tutorials/TutorialFilters";
import { SectionHeading } from "@/components/SectionHeading";
import type {
  TutorialCategoryOption,
  TutorialListFilters,
} from "@/lib/tutorial-list";
import type { PublicTutorialCard } from "@/lib/supabase/public-tutorials";
import { focusRing } from "@/lib/page-data";

interface TutorialCatalogSectionProps {
  tutorials: PublicTutorialCard[];
  categories: TutorialCategoryOption[];
  filters: TutorialListFilters;
  filtersActive: boolean;
  totalPublished: number;
}

export function TutorialCatalogSection({
  tutorials,
  categories,
  filters,
  filtersActive,
  totalPublished,
}: TutorialCatalogSectionProps) {
  if (totalPublished === 0) {
    return (
      <section className="border-b border-hcx-border py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-12 text-center">
            <p className="text-base font-medium text-hcx-text">
              No tutorials have been published yet.
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-hcx-text-secondary">
              New practical cybersecurity tutorials will appear here as they are
              published.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="border-b border-hcx-border py-10 md:py-12"
      aria-labelledby="all-tutorials-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Learn Step by Step"
          title="All Tutorials"
          description="Browse practical cybersecurity tutorials by topic, category and difficulty."
          compact
        />

        <TutorialFilters filters={filters} categories={categories} />

        {tutorials.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tutorials.map((tutorial) => (
              <PublishedTutorialCard key={tutorial.slug} tutorial={tutorial} />
            ))}
          </div>
        ) : filtersActive ? (
          <div className="mt-8 rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-12 text-center">
            <p className="text-base font-medium text-hcx-text">
              No tutorials match your current filters.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-hcx-text-secondary">
              Try adjusting your search, category or difficulty filters.
            </p>
            <Link
              href="/tutorials"
              className={`mt-6 inline-flex rounded-lg border border-hcx-border bg-hcx-card px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
            >
              Reset Filters
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-hcx-border/80 bg-hcx-bg-secondary/30 px-6 py-10 text-center">
            <p className="text-base font-medium text-hcx-text">
              More cybersecurity tutorials are coming soon.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-hcx-text-secondary">
              New practical cybersecurity tutorials will appear here as they are
              published.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
