import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { EXPLORE_TOPICS } from "@/lib/homepage/explore-topics";
import { focusRing } from "@/lib/page-data";

export function ExploreTopicsSection() {
  return (
    <section className="border-b border-hcx-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Browse by Topic"
          title="Explore Topics"
          description="Jump into the HimalCyberX sections that match your security interests."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPLORE_TOPICS.map((topic) => (
            <Link
              key={topic.href}
              href={topic.href}
              className={`group rounded-xl border border-hcx-border bg-hcx-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-hcx-cyan/25 hover:bg-hcx-bg-secondary/40 ${focusRing}`}
            >
              <h3 className="text-base font-semibold text-hcx-text transition-colors group-hover:text-hcx-cyan">
                {topic.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
                {topic.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
