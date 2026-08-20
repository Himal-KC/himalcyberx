import Link from "next/link";
import { ForensicsTypeFilters } from "@/components/forensics/ForensicsTypeFilters";
import { RelatedContentCard } from "@/components/related/RelatedContentCard";
import { SectionHeading } from "@/components/SectionHeading";
import type {
  ForensicsContentItem,
  ForensicsListFilters,
} from "@/lib/forensics-content";
import { focusRing } from "@/lib/page-data";

interface ForensicsContentSectionProps {
  items: ForensicsContentItem[];
  filters: ForensicsListFilters;
  filtersActive: boolean;
  totalMatching: number;
}

export function ForensicsContentSection({
  items,
  filters,
  filtersActive,
  totalMatching,
}: ForensicsContentSectionProps) {
  return (
    <section
      className="border-b border-hcx-border py-10 md:py-12"
      aria-labelledby="forensics-content-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Published DFIR Content"
          title="Forensics Content"
          description="Articles, cyber labs and tutorials focused on digital forensics and incident response."
          compact
        />

        <p className="-mt-4 mb-6 max-w-3xl text-sm leading-relaxed text-hcx-text-secondary/80">
          For authorized, lawful and defensive investigation only.
        </p>

        {totalMatching > 0 ? (
          <ForensicsTypeFilters filters={filters} />
        ) : null}

        {totalMatching === 0 ? (
          <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-12 text-center">
            <p className="text-base font-medium text-hcx-text">
              No digital forensics content has been published yet.
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-hcx-text-secondary">
              HimalCyberX forensics articles, labs and tutorials will appear here
              as new DFIR content is published.
            </p>
          </div>
        ) : items.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <RelatedContentCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-12 text-center">
            <p className="text-base font-medium text-hcx-text">
              No matching content for this filter.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-hcx-text-secondary">
              Try another content type to browse published forensics material.
            </p>
            {filtersActive ? (
              <Link
                href="/forensics"
                className={`mt-6 inline-flex rounded-lg border border-hcx-border bg-hcx-card px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
              >
                Show all content
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
