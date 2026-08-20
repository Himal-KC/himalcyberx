import Link from "next/link";
import { PublishedTutorialCard } from "@/components/tutorials/PublishedTutorialCard";
import { SectionHeading } from "@/components/SectionHeading";
import { ArrowRightIcon } from "@/components/icons";
import type { PublicTutorialCard } from "@/lib/supabase/public-tutorials";
import { focusRing } from "@/lib/page-data";

interface LatestTutorialsSectionProps {
  tutorials: PublicTutorialCard[];
}

export function LatestTutorialsSection({
  tutorials,
}: LatestTutorialsSectionProps) {
  if (tutorials.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-hcx-border bg-hcx-bg-secondary py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Learning Guides"
          title="Latest Tutorials"
          description="Step-by-step cybersecurity tutorials for analysts, defenders and learners."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {tutorials.map((tutorial) => (
            <PublishedTutorialCard key={tutorial.slug} tutorial={tutorial} />
          ))}
        </div>

        <div className="mt-10 flex justify-center md:justify-start">
          <Link
            href="/tutorials"
            className={`group inline-flex items-center gap-2 rounded-lg border border-hcx-border bg-hcx-card px-6 py-3 text-sm font-semibold text-hcx-text transition-all hover:border-hcx-cyan/30 hover:bg-hcx-bg hover:text-hcx-cyan ${focusRing}`}
          >
            View Tutorials
            <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
