import Link from "next/link";
import type { PublicTutorialCard } from "@/lib/supabase/public-tutorials";
import {
  tutorialPath,
} from "@/lib/supabase/public-tutorials";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { DifficultyBadge } from "@/components/cyber-lab/DifficultyBadge";
import { linkFocus } from "@/components/cyber-lab/constants";
import { ArrowRightIcon } from "@/components/icons";
import { focusRing } from "@/lib/page-data";

interface PublishedTutorialCardProps {
  tutorial: PublicTutorialCard;
}

function FeaturedTutorialBadge() {
  return (
    <span className="rounded border border-hcx-green/30 bg-hcx-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-hcx-green">
      Featured Tutorial
    </span>
  );
}

export function PublishedTutorialCard({ tutorial }: PublishedTutorialCardProps) {
  const difficultyLevel =
    tutorial.difficulty === "Beginner"
      ? "beginner"
      : tutorial.difficulty === "Intermediate"
        ? "intermediate"
        : "advanced";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-hcx-border bg-hcx-card transition-colors duration-300 hover:border-hcx-cyan/25">
      <Link
        href={tutorialPath(tutorial.slug)}
        className={`relative block ${linkFocus}`}
      >
        <ArticleFeaturedVisual
          featured_image={tutorial.featured_image}
          title={tutorial.title}
          pattern="grid"
          className="h-40"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-md bg-hcx-bg/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
            {tutorial.category}
          </span>
          {tutorial.featured && <FeaturedTutorialBadge />}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-hcx-border bg-hcx-bg text-[10px] font-bold text-hcx-cyan"
          >
            #
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-hcx-text-secondary">
            Learning Guide
          </span>
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan">
          <Link href={tutorialPath(tutorial.slug)} className={linkFocus}>
            {tutorial.title}
          </Link>
        </h3>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-hcx-text-secondary">
          {tutorial.description}
        </p>

        <div className="mt-4 border-t border-hcx-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DifficultyBadge
              label={tutorial.difficulty}
              level={difficultyLevel}
            />
            {tutorial.estimated_time && (
              <span className="text-xs text-hcx-text-secondary">
                {tutorial.estimated_time}
              </span>
            )}
          </div>
        </div>

        <Link
          href={tutorialPath(tutorial.slug)}
          className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-hcx-cyan transition-colors hover:text-hcx-cyan/80 ${focusRing}`}
        >
          Start Tutorial
          <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
