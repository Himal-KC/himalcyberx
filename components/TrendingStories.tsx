import { trendingStories } from "@/lib/sample-data";
import { SectionHeading } from "@/components/SectionHeading";
import { ArticlePlaceholder } from "@/components/ArticlePlaceholder";
import { DemoBadge } from "@/components/DemoBadge";

const linkFocus =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcx-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-hcx-bg";

export function TrendingStories() {
  return (
    <section id="trending" className="border-b border-hcx-border pt-8 pb-16 sm:pt-10 md:pb-20 lg:pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Trending Now"
          description="What security professionals are watching right now."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trendingStories.map((story) => (
            <article
              key={story.headline}
              className="group flex flex-col overflow-hidden rounded-xl border border-hcx-border bg-hcx-card transition-all duration-300 hover:-translate-y-1 hover:border-hcx-cyan/25 hover:shadow-[0_12px_40px_rgba(0,217,255,0.07)]"
            >
              <div className="relative">
                <ArticlePlaceholder
                  variant={story.pattern}
                  className="h-48 sm:h-52"
                />
                <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-hcx-bg/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
                    {story.category}
                  </span>
                  <DemoBadge />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="text-lg font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan sm:text-xl">
                  <a href="#" className={linkFocus}>
                    {story.headline}
                  </a>
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-hcx-text-secondary sm:text-[15px]">
                  {story.summary}
                </p>
                <div className="mt-5 border-t border-hcx-border pt-4">
                  <p className="text-sm font-medium text-hcx-text/90">
                    {story.author}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-hcx-text-secondary">
                    <time dateTime="2026-08-13">{story.date}</time>
                    <span aria-hidden="true">•</span>
                    <span>{story.readTime}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
