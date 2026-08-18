import { securityUpdateMessage } from "@/lib/sample-data";

export function SecurityUpdateBar() {
  return (
    <div
      className="border-b border-hcx-border/80 bg-hcx-bg-secondary"
      role="region"
      aria-label="Security update"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-2 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full bg-hcx-cyan"
            aria-hidden="true"
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-hcx-cyan sm:text-xs">
            Security Update
          </span>
        </div>

        <span
          className="shrink-0 text-hcx-text-secondary/30"
          aria-hidden="true"
        >
          |
        </span>

        <p className="min-w-0 flex-1 truncate text-sm text-hcx-text-secondary">
          {securityUpdateMessage}
        </p>
      </div>
    </div>
  );
}
