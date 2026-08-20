"use client";

import { useAdminListNavigation } from "@/components/admin/useAdminListNavigation";
import type { ForensicsContentTypeFilter, ForensicsListFilters } from "@/lib/forensics-content";
import { focusRing } from "@/lib/page-data";

const TYPE_OPTIONS: Array<{ value: ForensicsContentTypeFilter; label: string }> =
  [
    { value: "all", label: "All" },
    { value: "article", label: "Articles" },
    { value: "lab", label: "Labs" },
    { value: "tutorial", label: "Tutorials" },
  ];

interface ForensicsTypeFiltersProps {
  filters: ForensicsListFilters;
}

export function ForensicsTypeFilters({ filters }: ForensicsTypeFiltersProps) {
  const { pushParams } = useAdminListNavigation();

  function updateType(value: ForensicsContentTypeFilter) {
    pushParams((params) => {
      if (value === "all") {
        params.delete("type");
      } else {
        params.set("type", value);
      }
    });
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter by content type"
    >
      {TYPE_OPTIONS.map((option) => {
        const active = filters.type === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => updateType(option.value)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${focusRing} ${
              active
                ? "border-hcx-cyan/40 bg-hcx-cyan/10 text-hcx-cyan"
                : "border-hcx-border bg-hcx-card text-hcx-text-secondary hover:border-hcx-cyan/25 hover:text-hcx-cyan"
            }`}
            aria-pressed={active}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
