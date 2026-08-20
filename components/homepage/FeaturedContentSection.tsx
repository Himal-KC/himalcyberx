import { FeaturedContentCard } from "@/components/homepage/FeaturedContentCard";
import { SectionHeading } from "@/components/SectionHeading";
import type { HomepageFeaturedItem } from "@/lib/supabase/public-homepage";

interface FeaturedContentSectionProps {
  items: HomepageFeaturedItem[];
}

export function FeaturedContentSection({ items }: FeaturedContentSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-hcx-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Editor's Picks"
          title="Featured Content"
          description="Highlighted research, labs and tutorials from across HimalCyberX."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {items.map((item) => (
            <FeaturedContentCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
