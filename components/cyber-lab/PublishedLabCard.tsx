import Link from "next/link";
import type { PublicLabCard } from "@/lib/supabase/public-labs";
import { labPath } from "@/lib/supabase/public-labs";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { DifficultyBadge } from "@/components/cyber-lab/DifficultyBadge";
import { linkFocus } from "@/components/cyber-lab/constants";
import { ArrowRightIcon } from "@/components/icons";

interface PublishedLabCardProps {
  lab: PublicLabCard;
}

function FeaturedLabBadge() {
  return (
    <span className="rounded border border-hcx-cyan/30 bg-hcx-cyan/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-hcx-cyan">
      Featured Lab
    </span>
  );
}

export function PublishedLabCard({ lab }: PublishedLabCardProps) {
  const difficultyLevel =
    lab.difficulty === "Beginner"
      ? "beginner"
      : lab.difficulty === "Intermediate"
        ? "intermediate"
        : "advanced";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-hcx-border bg-hcx-card transition-colors duration-300 hover:border-hcx-cyan/25">
      <Link href={labPath(lab.slug)} className={`relative block ${linkFocus}`}>
        <ArticleFeaturedVisual
          featured_image={lab.featured_image}
          title={lab.title}
          pattern="circuit"
          className="h-40"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-md bg-hcx-bg/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
            {lab.category}
          </span>
          {lab.featured && <FeaturedLabBadge />}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-lg font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan">
          <Link href={labPath(lab.slug)} className={linkFocus}>
            {lab.title}
          </Link>
        </h3>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-hcx-text-secondary">
          {lab.description}
        </p>

        <div className="mt-4 border-t border-hcx-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DifficultyBadge label={lab.difficulty} level={difficultyLevel} />
            {lab.estimated_time && (
              <span className="text-xs text-hcx-text-secondary">
                {lab.estimated_time}
              </span>
            )}
          </div>
        </div>

        <Link
          href={labPath(lab.slug)}
          className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-hcx-cyan transition-colors hover:text-hcx-cyan/80 ${linkFocus}`}
        >
          Start Lab
          <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
