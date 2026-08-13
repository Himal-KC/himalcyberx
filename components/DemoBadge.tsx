import type { ReactNode } from "react";

export function DemoBadge({
  className = "",
  children = "Demo Content",
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex rounded border border-hcx-border bg-hcx-bg/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary ${className}`}
    >
      {children}
    </span>
  );
}
