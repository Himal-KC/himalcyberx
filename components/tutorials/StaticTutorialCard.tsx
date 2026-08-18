import type { StaticTutorialItem } from "@/lib/tutorials-content";
import { DifficultyBadge } from "@/components/cyber-lab/DifficultyBadge";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";

interface StaticTutorialCardProps {
  tutorial: StaticTutorialItem;
}

const difficultyColor: Record<string, "beginner" | "intermediate" | "advanced"> =
  {
    Beginner: "beginner",
    Intermediate: "intermediate",
    Advanced: "advanced",
  };

export function StaticTutorialCard({ tutorial }: StaticTutorialCardProps) {
  const difficultyLevel = difficultyColor[tutorial.difficulty] ?? "beginner";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-hcx-border bg-hcx-card/80">
      <div className="relative">
        <ArticleFeaturedVisual
          featured_image={null}
          title={tutorial.title}
          pattern="grid"
          className="h-40"
        />
        <div className="absolute left-4 top-4">
          <span className="rounded-md bg-hcx-bg/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-hcx-cyan backdrop-blur-sm">
            {tutorial.category}
          </span>
        </div>
      </div>

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

        <h3 className="mt-3 text-lg font-semibold leading-snug text-hcx-text">
          {tutorial.title}
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
            <span className="text-xs text-hcx-text-secondary">
              {tutorial.estimatedTime}
            </span>
          </div>
        </div>

        <p className="mt-5 text-xs font-medium uppercase tracking-wide text-hcx-text-secondary/80">
          Full guide coming soon
        </p>
      </div>
    </article>
  );
}
