import Link from "next/link";
import { aiSecurityTopics } from "@/lib/sample-data";
import { SectionHeading } from "@/components/SectionHeading";
import { focusRing } from "@/lib/page-data";

export function AISecurity() {
  return (
    <section id="ai-security" className="border-b border-hcx-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="AI + Cybersecurity"
          title="AI Security"
          description="Educational coverage at the intersection of artificial intelligence and cybersecurity — from adversarial risks to defensive innovation."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {aiSecurityTopics.map((topic) => (
            <article
              key={topic.id}
              className="group flex flex-col rounded-xl border border-hcx-border bg-hcx-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-hcx-cyan/20 hover:shadow-[0_8px_30px_rgba(0,217,255,0.06)]"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-hcx-green">
                {topic.category}
              </span>
              <h3 className="mt-3 text-lg font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan">
                <Link
                  href={`/ai-security#${topic.id}`}
                  className={focusRing}
                >
                  {topic.title}
                </Link>
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-hcx-text-secondary">
                {topic.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
