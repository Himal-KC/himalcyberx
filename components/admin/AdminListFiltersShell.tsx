import type { ReactNode } from "react";
import { focusRing } from "@/lib/page-data";

export const adminFilterInputClass =
  "mt-2 w-full rounded-lg border border-hcx-border bg-hcx-bg px-3 py-2.5 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20";

export const adminFilterLabelClass =
  "block text-xs font-medium uppercase tracking-[0.12em] text-hcx-text-secondary";

interface AdminListFiltersShellProps {
  children: ReactNode;
  showReset: boolean;
  onReset: () => void;
  isPending?: boolean;
}

export function AdminListFiltersShell({
  children,
  showReset,
  onReset,
  isPending = false,
}: AdminListFiltersShellProps) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Search & Filters
        </h2>
        {showReset ? (
          <button
            type="button"
            onClick={onReset}
            disabled={isPending}
            className={`text-sm font-medium text-hcx-cyan hover:underline disabled:opacity-60 ${focusRing}`}
          >
            Reset Filters
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

interface AdminFilterFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

export function AdminFilterField({
  label,
  htmlFor,
  children,
  className,
}: AdminFilterFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={adminFilterLabelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}
