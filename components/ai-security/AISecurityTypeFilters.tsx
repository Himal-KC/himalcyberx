"use client";

import { useAdminListNavigation } from "@/components/admin/useAdminListNavigation";
import type {
  AISecurityContentTypeFilter,
  AISecurityListFilters,
} from "@/lib/ai-security-content";
import { focusRing } from "@/lib/page-data";

const TYPE_OPTIONS: Array<{
  value: AISecurityContentTypeFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "article", label: "Articles" },
  { value: "tutorial", label: "Tutorials" },
  { value: "lab", label: "Labs" },
];

interface AISecurityTypeFiltersProps {
  filters: AISecurityListFilters;
}

export function AISecurityTypeFilters({ filters }: AISecurityTypeFiltersProps) {
  const { pushParams } = useAdminListNavigation();

  function updateType(value: AISecurityContentTypeFilter) {
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
            className={`min-h-11 rounded-md border px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${focusRing} ${
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
