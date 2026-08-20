import Link from "next/link";
import { AISecurityTypeFilters } from "@/components/ai-security/AISecurityTypeFilters";
import { RelatedContentCard } from "@/components/related/RelatedContentCard";
import { SectionHeading } from "@/components/SectionHeading";
import type { AISecurityListFilters } from "@/lib/ai-security-content";
import type { RelatedContentItem } from "@/lib/supabase/public-related-content";
import { focusRing } from "@/lib/page-data";

interface AISecurityContentSectionProps {
  items: RelatedContentItem[];
  filters: AISecurityListFilters;
  filtersActive: boolean;
  totalMatching: number;
}

export function AISecurityContentSection({
  items,
  filters,
  filtersActive,
  totalMatching,
}: AISecurityContentSectionProps) {
  return (
    <section
      className="border-b border-hcx-border py-10 md:py-12"
      aria-labelledby="ai-security-content-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Published AI Security Content"
          title="AI Security Content"
          description="Articles, tutorials and cyber labs focused on AI security, LLM risk and responsible defensive AI."
          compact
        />

        <p className="-mt-4 mb-6 max-w-3xl text-sm leading-relaxed text-hcx-text-secondary/80">
          Focused on responsible, defensive and security-conscious use of AI
          technologies.
        </p>

        {totalMatching > 0 ? (
          <AISecurityTypeFilters filters={filters} />
        ) : null}

        {totalMatching === 0 ? (
          <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-12 text-center">
            <p className="text-base font-medium text-hcx-text">
              No AI security content has been published yet.
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-hcx-text-secondary">
              New research and practical guidance on AI security will appear
              here as it is published.
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
              Try another content type to browse published AI security material.
            </p>
            {filtersActive ? (
              <Link
                href="/ai-security"
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
