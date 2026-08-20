import Link from "next/link";
import { PublishedLabCard } from "@/components/cyber-lab/PublishedLabCard";
import { SectionHeading } from "@/components/SectionHeading";
import { ArrowRightIcon } from "@/components/icons";
import type { PublicLabCard } from "@/lib/supabase/public-labs";
import { focusRing } from "@/lib/page-data";

interface LatestCyberLabsSectionProps {
  labs: PublicLabCard[];
}

export function LatestCyberLabsSection({ labs }: LatestCyberLabsSectionProps) {
  if (labs.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-hcx-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Hands-On Learning"
          title="Latest Cyber Labs"
          description="Practice defensive security skills with guided, hands-on lab environments."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {labs.map((lab) => (
            <PublishedLabCard key={lab.slug} lab={lab} />
          ))}
        </div>

        <div className="mt-10 flex justify-center md:justify-start">
          <Link
            href="/cyber-lab"
            className={`group inline-flex items-center gap-2 rounded-lg border border-hcx-border bg-hcx-card px-6 py-3 text-sm font-semibold text-hcx-text transition-all hover:border-hcx-cyan/30 hover:bg-hcx-bg-secondary hover:text-hcx-cyan ${focusRing}`}
          >
            Explore Cyber Lab
            <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
