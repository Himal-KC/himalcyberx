import type { cyberLabModules } from "@/lib/sample-data";
import { DifficultyBadge } from "@/components/cyber-lab/DifficultyBadge";
import { gridPattern, linkFocus } from "@/components/cyber-lab/constants";
import { ArrowRightIcon } from "@/components/icons";
import type { ComponentType } from "react";

type LabModule = (typeof cyberLabModules)[number];

interface LabCardProps {
  module: LabModule;
  icon: ComponentType<{ className?: string }>;
}

export function LabCard({ module, icon: Icon }: LabCardProps) {
  const tagLabel = module.tagType === "tools" ? "Tools" : "Topics";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-hcx-border bg-hcx-card transition-colors duration-300 hover:border-hcx-cyan/25">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={gridPattern}
        aria-hidden="true"
      />

      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hcx-cyan/20 bg-hcx-cyan/5 text-hcx-cyan">
            <Icon />
          </div>
          <span className="font-tech text-[10px] font-medium uppercase tracking-wider text-hcx-text-secondary/70">
            {module.labId}
          </span>
        </div>

        <p className="mt-4 font-tech text-[10px] font-semibold uppercase tracking-[0.16em] text-hcx-cyan">
          {module.category}
        </p>

        <h3 className="mt-2 text-lg font-semibold leading-snug text-hcx-text">
          {module.title}
        </h3>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-hcx-text-secondary">
          {module.description}
        </p>

        <div className="mt-4">
          <p className="font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary/80">
            {tagLabel}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {module.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-hcx-border bg-hcx-bg/50 px-2 py-0.5 font-tech text-[11px] text-hcx-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-hcx-border pt-4">
          <DifficultyBadge
            label={module.difficulty}
            level={module.difficultyLevel}
          />
        </div>

        <a
          href="#"
          className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-hcx-cyan transition-colors hover:text-hcx-cyan/80 ${linkFocus}`}
        >
          {module.buttonText}
          <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </article>
  );
}
