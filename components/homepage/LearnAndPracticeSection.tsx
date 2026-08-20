import Link from "next/link";
import { PublishedLabCard } from "@/components/cyber-lab/PublishedLabCard";
import { PublishedTutorialCard } from "@/components/tutorials/PublishedTutorialCard";
import { SectionHeading } from "@/components/SectionHeading";
import { ArrowRightIcon } from "@/components/icons";
import type { PublicLabCard } from "@/lib/supabase/public-labs";
import type { PublicTutorialCard } from "@/lib/supabase/public-tutorials";
import { focusRing } from "@/lib/page-data";

interface LearnAndPracticeSectionProps {
  labs: PublicLabCard[];
  tutorials: PublicTutorialCard[];
}

function SubsectionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-hcx-cyan transition-colors hover:text-hcx-cyan/80 ${focusRing}`}
    >
      {label}
      <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function LearnAndPracticeSection({
  labs,
  tutorials,
}: LearnAndPracticeSectionProps) {
  if (labs.length === 0 && tutorials.length === 0) {
    return null;
  }

  const useTwoColumns = labs.length > 0 && tutorials.length > 0;

  return (
    <section className="border-b border-hcx-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Hands-On Learning"
          title="Learn & Practice"
          description="Hands-on cyber labs and step-by-step security tutorials."
        />

        <div
          className={
            useTwoColumns
              ? "grid gap-10 lg:grid-cols-2 lg:gap-12"
              : "mx-auto max-w-xl lg:max-w-2xl"
          }
        >
          {labs.length > 0 && (
            <div className="flex flex-col">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h3 className="text-lg font-semibold text-hcx-text">
                  Latest Cyber Labs
                </h3>
                <SubsectionLink href="/cyber-lab" label="Explore Cyber Labs" />
              </div>
              <div className="mt-5 flex flex-col gap-5">
                {labs.map((lab) => (
                  <PublishedLabCard key={lab.slug} lab={lab} />
                ))}
              </div>
            </div>
          )}

          {tutorials.length > 0 && (
            <div className="flex flex-col">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h3 className="text-lg font-semibold text-hcx-text">
                  Latest Tutorials
                </h3>
                <SubsectionLink href="/tutorials" label="View Tutorials" />
              </div>
              <div className="mt-5 flex flex-col gap-5">
                {tutorials.map((tutorial) => (
                  <PublishedTutorialCard
                    key={tutorial.slug}
                    tutorial={tutorial}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
