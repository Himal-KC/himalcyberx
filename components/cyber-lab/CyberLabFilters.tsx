"use client";

import { useState } from "react";
import {
  useAdminListNavigation,
  useDebouncedSearchParam,
} from "@/components/admin/useAdminListNavigation";
import {
  cyberLabFiltersAreActive,
  type CyberLabCategoryOption,
  type CyberLabListFilters,
} from "@/lib/cyber-lab-list";
import { focusRing } from "@/lib/page-data";

const filterInputClass = `w-full rounded-lg border border-hcx-border bg-hcx-card px-3 py-2.5 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 ${focusRing}`;

function CyberLabSearchField() {
  const search = useDebouncedSearchParam("q");

  return (
    <div className="min-w-0 flex-1 sm:min-w-[14rem]">
      <label htmlFor="cyber-lab-search" className="sr-only">
        Search labs
      </label>
      <input
        id="cyber-lab-search"
        type="search"
        value={search.value}
        onChange={(event) => search.onChange(event.target.value)}
        placeholder="Search by title or description"
        className={filterInputClass}
      />
    </div>
  );
}

interface CyberLabFiltersProps {
  filters: CyberLabListFilters;
  categories: CyberLabCategoryOption[];
}

export function CyberLabFilters({ filters, categories }: CyberLabFiltersProps) {
  const { pushParams, reset, isPending } = useAdminListNavigation();
  const [searchResetKey, setSearchResetKey] = useState(0);
  const showReset = cyberLabFiltersAreActive(filters);

  function updateFilter(
    key: keyof CyberLabListFilters,
    value: string,
    defaultValue = "all",
  ) {
    pushParams((params) => {
      if (value === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
  }

  function handleReset() {
    reset();
    setSearchResetKey((current) => current + 1);
  }

  return (
    <div className="rounded-xl border border-hcx-border bg-hcx-card/60 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <CyberLabSearchField key={searchResetKey} />

        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
          <div>
            <label
              htmlFor="cyber-lab-category"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary"
            >
              Category
            </label>
            <select
              id="cyber-lab-category"
              value={filters.category}
              onChange={(event) => updateFilter("category", event.target.value)}
              className={filterInputClass}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cyber-lab-difficulty"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary"
            >
              Difficulty
            </label>
            <select
              id="cyber-lab-difficulty"
              value={filters.difficulty}
              onChange={(event) =>
                updateFilter("difficulty", event.target.value)
              }
              className={filterInputClass}
            >
              <option value="all">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {showReset ? (
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className={`shrink-0 rounded-lg border border-hcx-border bg-hcx-bg-secondary px-4 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
          >
            Reset Filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
