import {
  FeaturedContentPrimaryCard,
  FeaturedContentSupportingCard,
} from "@/components/homepage/FeaturedContentCard";
import { SectionHeading } from "@/components/SectionHeading";
import type { HomepageFeaturedItem } from "@/lib/supabase/public-homepage";

interface FeaturedContentSectionProps {
  items: HomepageFeaturedItem[];
}

export function FeaturedContentSection({ items }: FeaturedContentSectionProps) {
  if (items.length === 0) {
    return null;
  }

  const primary = items[0];
  const supporting = items.slice(1, 3);
  const hasSupporting = supporting.length > 0;

  return (
    <section className="border-b border-hcx-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Editor's Picks"
          title="Featured Content"
          description="Highlighted research, labs and tutorials from across HimalCyberX."
        />

        <div
          className={
            hasSupporting
              ? "grid gap-5 lg:grid-cols-3 lg:gap-8"
              : "max-w-4xl"
          }
        >
          <div className={hasSupporting ? "lg:col-span-2" : undefined}>
            <FeaturedContentPrimaryCard item={primary} />
          </div>

          {hasSupporting ? (
            <div className="flex flex-col gap-4 lg:col-span-1">
              {supporting.map((item) => (
                <FeaturedContentSupportingCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
