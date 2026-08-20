import type { RelatedContentItem } from "@/lib/supabase/public-related-content";
import { RelatedContentCard } from "@/components/related/RelatedContentCard";

interface RelatedContentSectionProps {
  items: RelatedContentItem[];
}

export function RelatedContentSection({ items }: RelatedContentSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="related-content-heading"
      className="border-t border-hcx-border pt-12"
    >
      <h2
        id="related-content-heading"
        className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
      >
        Related Content
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <RelatedContentCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}
