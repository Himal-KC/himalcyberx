import Link from "next/link";
import type { PublicTutorialCard } from "@/lib/supabase/public-tutorials";
import { tutorialPath } from "@/lib/supabase/public-tutorials";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { gridPattern, buttonFocus } from "@/components/cyber-lab/constants";
import { ArrowRightIcon } from "@/components/icons";

interface FeaturedTutorialProps {
  tutorial: PublicTutorialCard | null;
}

export function FeaturedTutorial({ tutorial }: FeaturedTutorialProps) {
  if (!tutorial) {
    return null;
  }

  return (
    <div>
      <p className="font-tech text-[10px] font-semibold uppercase tracking-[0.2em] text-hcx-cyan">
        Featured Tutorial
      </p>

      <div className="relative mt-4 overflow-hidden rounded-lg border border-hcx-yellow/20 bg-hcx-card">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={gridPattern}
          aria-hidden="true"
        />

        <div className="relative">
          <Link href={tutorialPath(tutorial.slug)} className="block">
            <ArticleFeaturedVisual
              featured_image={tutorial.featured_image}
              title={tutorial.title}
              pattern="grid"
              className="h-48 sm:h-56"
            />
          </Link>

          <div className="grid gap-6 p-6 md:grid-cols-5 md:gap-8 md:p-8">
            <div className="md:col-span-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-hcx-yellow/30 bg-hcx-yellow/10 px-2.5 py-1 font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-yellow">
                  Featured Tutorial
                </span>
                <span className="rounded border border-hcx-cyan/25 bg-hcx-cyan/10 px-2.5 py-1 font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-cyan">
                  {tutorial.category}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-bold leading-snug text-hcx-text md:text-2xl">
                <Link
                  href={tutorialPath(tutorial.slug)}
                  className="hover:text-hcx-cyan"
                >
                  {tutorial.title}
                </Link>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-hcx-text-secondary md:text-base">
                {tutorial.description}
              </p>
            </div>

            <div className="flex flex-col justify-between gap-5 md:col-span-2">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary">
                    Difficulty
                  </dt>
                  <dd className="mt-1 font-medium text-hcx-green">
                    {tutorial.difficulty}
                  </dd>
                </div>
                <div>
                  <dt className="font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary">
                    Estimated Time
                  </dt>
                  <dd className="mt-1 text-hcx-text">
                    {tutorial.estimated_time || "—"}
                  </dd>
                </div>
              </dl>

              <Link
                href={tutorialPath(tutorial.slug)}
                className={`inline-flex items-center justify-center gap-2 rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 ${buttonFocus}`}
              >
                View Tutorial
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
