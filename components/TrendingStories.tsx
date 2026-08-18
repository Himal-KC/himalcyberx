import Link from "next/link";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";
import { articlePath } from "@/lib/articles";
import { SectionHeading } from "@/components/SectionHeading";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { focusRing } from "@/lib/page-data";

interface TrendingStoriesProps {
  stories: PublicArticleCard[];
}

export function TrendingStories({ stories }: TrendingStoriesProps) {
  if (stories.length === 0) {
    return null;
  }

  return (
    <section
      id="trending"
      className="border-b border-hcx-border pt-8 pb-16 sm:pt-10 md:pb-20 lg:pt-12"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Trending Now"
          description="Editorial topics and research from the HimalCyberX publication."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <article
              key={story.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-hcx-border bg-hcx-card transition-all duration-300 hover:-translate-y-1 hover:border-hcx-cyan/25 hover:shadow-[0_12px_40px_rgba(0,217,255,0.07)]"
            >
              <Link
                href={articlePath(story.slug)}
                className={`relative block ${focusRing}`}
              >
                <ArticleFeaturedVisual
                  featured_image={story.featured_image}
                  pattern={story.pattern}
                  title={story.title}
                  className="h-48 sm:h-52"
                />
                <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-hcx-bg/85 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
                    {story.category}
                  </span>
                </div>
              </Link>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="text-lg font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan sm:text-xl">
                  <Link href={articlePath(story.slug)} className={focusRing}>
                    {story.title}
                  </Link>
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-hcx-text-secondary sm:text-[15px]">
                  {story.excerpt}
                </p>
                <div className="mt-5 border-t border-hcx-border pt-4">
                  <p className="text-sm font-medium text-hcx-text/90">
                    {story.author}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-hcx-text-secondary">
                    <time dateTime={story.publishedAtIso}>
                      {story.publishedAtFormatted}
                    </time>
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
