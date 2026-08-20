import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { SectionHeading } from "@/components/SectionHeading";
import type { ForensicsTopic } from "@/lib/forensics-content";
import { focusRing } from "@/lib/page-data";

interface ForensicsTopicsSectionProps {
  topics: ForensicsTopic[];
}

export function ForensicsTopicsSection({ topics }: ForensicsTopicsSectionProps) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <section
      className="border-b border-hcx-border bg-hcx-bg-secondary py-10 md:py-12"
      aria-labelledby="forensics-topics-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Browse by Topic"
          title="Forensics Topics"
          description="Explore published DFIR content by investigation focus area."
          compact
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Link
              key={topic.href}
              href={topic.href}
              className={`group flex h-full flex-col rounded-lg border border-hcx-border bg-hcx-card p-5 transition-colors hover:border-hcx-cyan/25 ${focusRing}`}
            >
              <h3 className="text-base font-semibold text-hcx-text transition-colors group-hover:text-hcx-cyan">
                {topic.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-hcx-text-secondary">
                {topic.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-hcx-text-secondary transition-colors group-hover:text-hcx-cyan">
                Explore
                <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
