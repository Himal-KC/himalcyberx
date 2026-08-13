import { featuredStory, latestStories } from "@/lib/sample-data";
import { SectionHeading } from "@/components/SectionHeading";
import { ArticlePlaceholder } from "@/components/ArticlePlaceholder";
import { DemoBadge } from "@/components/DemoBadge";
import { ArrowRightIcon } from "@/components/icons";

const linkFocus =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcx-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-hcx-bg";

const buttonFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcx-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-hcx-bg";

export function LatestNews() {
  return (
    <section
      id="latest-news"
      className="border-b border-hcx-border py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Latest Cybersecurity News"
          description="Recent security developments, research and defensive guidance."
        />

        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          <article className="group lg:col-span-3">
            <a
              href="#"
              className={`block overflow-hidden rounded-xl border border-hcx-border bg-hcx-card transition-all duration-300 hover:border-hcx-cyan/25 hover:shadow-[0_12px_40px_rgba(0,217,255,0.07)] ${linkFocus}`}
            >
              <div className="relative">
                <ArticlePlaceholder
                  variant="featured"
                  className="h-52 sm:h-64 md:h-72"
                />
                <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-hcx-bg/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
                    {featuredStory.category}
                  </span>
                  <DemoBadge />
                </div>
              </div>

              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-bold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan md:text-3xl">
                  {featuredStory.headline}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-hcx-text-secondary md:text-[17px]">
                  {featuredStory.description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-hcx-text-secondary">
                  <span className="font-medium text-hcx-text/90">
                    {featuredStory.author}
                  </span>
                  <span aria-hidden="true">•</span>
                  <time dateTime="2026-08-13">{featuredStory.date}</time>
                  <span aria-hidden="true">•</span>
                  <span>{featuredStory.readTime}</span>
                </div>
              </div>
            </a>
          </article>

          <div className="flex flex-col gap-4 lg:col-span-2">
            {latestStories.map((story) => (
              <article
                key={story.headline}
                className="group rounded-xl border border-hcx-border bg-hcx-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-hcx-cyan/25 hover:bg-hcx-bg-secondary/50 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-hcx-cyan">
                    {story.category}
                  </span>
                  <DemoBadge className="shrink-0" />
                </div>
                <h3 className="mt-2.5 text-base font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan sm:text-[17px]">
                  <a href="#" className={`flex items-start justify-between gap-3 ${linkFocus}`}>
                    <span>{story.headline}</span>
                    <ArrowRightIcon className="mt-1 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </a>
                </h3>
                <p className="mt-2 text-sm text-hcx-text-secondary">
                  {story.readTime} read
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-center md:justify-start">
          <a
            href="#"
            className={`group inline-flex items-center gap-2 rounded-lg border border-hcx-border bg-hcx-card px-6 py-3 text-sm font-semibold text-hcx-text transition-all hover:border-hcx-cyan/30 hover:bg-hcx-bg-secondary hover:text-hcx-cyan ${buttonFocus}`}
          >
            View All News
            <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
