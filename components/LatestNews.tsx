import Link from "next/link";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import { articlePath } from "@/lib/articles";
import { SectionHeading } from "@/components/SectionHeading";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { ArrowRightIcon } from "@/components/icons";
import { focusRing } from "@/lib/page-data";

interface LatestNewsProps {
  featured: PublicArticleCard | null;
  latest: PublicArticleCard[];
}

export function LatestNews({ featured, latest }: LatestNewsProps) {
  if (!featured && latest.length === 0) {
    return null;
  }

  return (
    <section
      id="latest-news"
      className="border-b border-hcx-border py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Latest from HCX"
          description="Editorial analysis, research, guides and threat intelligence from HimalCyberX."
        />

        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          {featured && (
            <article className="group lg:col-span-3">
              <Link
                href={articlePath(featured.slug)}
                className={`block overflow-hidden rounded-xl border border-hcx-border bg-hcx-card transition-all duration-300 hover:border-hcx-cyan/25 hover:shadow-[0_12px_40px_rgba(0,217,255,0.07)] ${focusRing}`}
              >
                <div className="relative">
                  <ArticleFeaturedVisual
                    featured_image={featured.featured_image}
                    pattern={featured.pattern ?? "featured"}
                    title={featured.title}
                    className="h-52 sm:h-64 md:h-72"
                  />
                  <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-hcx-bg/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
                      {featured.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-bold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan md:text-3xl">
                    {featured.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-hcx-text-secondary md:text-[17px]">
                    {featured.excerpt}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-hcx-text-secondary">
                    <span className="font-medium text-hcx-text/90">
                      {featured.author}
                    </span>
                    <span aria-hidden="true">•</span>
                    <time dateTime={featured.publishedAtIso}>
                      {featured.publishedAtFormatted}
                    </time>
                    <span aria-hidden="true">•</span>
                    <span>{featured.readTime}</span>
                  </div>
                </div>
              </Link>
            </article>
          )}

          <div className="flex flex-col gap-4 lg:col-span-2">
            {latest.map((story) => (
              <article
                key={story.id}
                className="group rounded-xl border border-hcx-border bg-hcx-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-hcx-cyan/25 hover:bg-hcx-bg-secondary/50 sm:p-6"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-hcx-cyan">
                  {story.category}
                </span>
                <h3 className="mt-2.5 text-base font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan sm:text-[17px]">
                  <Link
                    href={articlePath(story.slug)}
                    className={`flex items-start justify-between gap-3 ${focusRing}`}
                  >
                    <span>{story.title}</span>
                    <ArrowRightIcon className="mt-1 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-hcx-text-secondary">
                  {story.readTime}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-center md:justify-start">
          <Link
            href="/news"
            className={`group inline-flex items-center gap-2 rounded-lg border border-hcx-border bg-hcx-card px-6 py-3 text-sm font-semibold text-hcx-text transition-all hover:border-hcx-cyan/30 hover:bg-hcx-bg-secondary hover:text-hcx-cyan ${focusRing}`}
          >
            View All from HCX
            <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
