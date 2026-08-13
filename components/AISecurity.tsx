import { aiSecurityArticles } from "@/lib/sample-data";
import { SectionHeading } from "@/components/SectionHeading";

export function AISecurity() {
  return (
    <section id="ai-security" className="border-b border-hcx-border py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="AI + Cybersecurity"
          title="AI Security"
          description="Coverage at the intersection of artificial intelligence and cybersecurity — from adversarial threats to defensive innovation."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {aiSecurityArticles.map((article) => (
            <article
              key={article.headline}
              className="group flex flex-col rounded-xl border border-hcx-border bg-hcx-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-hcx-cyan/20 hover:shadow-[0_8px_30px_rgba(0,217,255,0.06)]"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-hcx-green">
                {article.category}
              </span>
              <h3 className="mt-3 text-lg font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan">
                <a href="#">{article.headline}</a>
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-hcx-text-secondary">
                {article.description}
              </p>
              <div className="mt-5 flex items-center gap-3 text-xs text-hcx-text-secondary">
                <time dateTime="2026-08-12">{article.date}</time>
                <span aria-hidden="true">•</span>
                <span>{article.readTime}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
