import { breakingHeadline } from "@/lib/sample-data";
import { ArrowRightIcon } from "@/components/icons";

export function BreakingNewsBar() {
  return (
    <div
      className="border-b border-hcx-border/80 bg-hcx-bg-secondary"
      role="region"
      aria-label="Breaking news"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-2 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full bg-hcx-red animate-pulse-dot"
            aria-hidden="true"
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-hcx-red sm:text-xs">
            Breaking
          </span>
        </div>

        <span
          className="shrink-0 text-hcx-text-secondary/30"
          aria-hidden="true"
        >
          |
        </span>

        <span className="shrink-0 rounded border border-hcx-border bg-hcx-card/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-hcx-text-secondary sm:text-[10px]">
          Demo
        </span>

        <a
          href="#latest-news"
          className="group flex min-w-0 flex-1 items-center gap-2 text-sm text-hcx-text transition-colors hover:text-hcx-cyan"
        >
          <span className="truncate">{breakingHeadline}</span>
          <ArrowRightIcon className="shrink-0 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}
