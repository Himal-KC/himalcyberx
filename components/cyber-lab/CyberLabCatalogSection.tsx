import Link from "next/link";
import { PublishedLabCard } from "@/components/cyber-lab/PublishedLabCard";
import { CyberLabFilters } from "@/components/cyber-lab/CyberLabFilters";
import { SectionHeading } from "@/components/SectionHeading";
import type {
  CyberLabCategoryOption,
  CyberLabListFilters,
} from "@/lib/cyber-lab-list";
import type { PublicLabCard } from "@/lib/supabase/public-labs";
import { focusRing } from "@/lib/page-data";

interface CyberLabCatalogSectionProps {
  labs: PublicLabCard[];
  categories: CyberLabCategoryOption[];
  filters: CyberLabListFilters;
  filtersActive: boolean;
  totalPublished: number;
}

export function CyberLabCatalogSection({
  labs,
  categories,
  filters,
  filtersActive,
  totalPublished,
}: CyberLabCatalogSectionProps) {
  if (totalPublished === 0) {
    return (
      <section className="border-b border-hcx-border py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-12 text-center">
            <p className="text-base font-medium text-hcx-text">
              No cyber labs have been published yet.
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-hcx-text-secondary">
              HimalCyberX hands-on labs will appear here as new defensive
              security exercises are published.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="border-b border-hcx-border py-10 md:py-12"
      aria-labelledby="all-cyber-labs-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Hands-On Learning"
          title="All Cyber Labs"
          description="Browse published defensive security labs by category, difficulty and topic."
          compact
        />

        <CyberLabFilters filters={filters} categories={categories} />

        {labs.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {labs.map((lab) => (
              <PublishedLabCard key={lab.slug} lab={lab} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-12 text-center">
            <p className="text-base font-medium text-hcx-text">
              No labs match your current filters.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-hcx-text-secondary">
              Try adjusting your search, category or difficulty filters.
            </p>
            {filtersActive ? (
              <Link
                href="/cyber-lab"
                className={`mt-6 inline-flex rounded-lg border border-hcx-border bg-hcx-card px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
              >
                Reset Filters
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
