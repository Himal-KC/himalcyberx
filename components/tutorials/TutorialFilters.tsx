"use client";

import { useState } from "react";
import {
  useAdminListNavigation,
  useDebouncedSearchParam,
} from "@/components/admin/useAdminListNavigation";
import {
  tutorialFiltersAreActive,
  type TutorialCategoryOption,
  type TutorialListFilters,
} from "@/lib/tutorial-list";
import { focusRing } from "@/lib/page-data";

const filterInputClass = `w-full rounded-lg border border-hcx-border bg-hcx-card px-3 py-2.5 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 ${focusRing}`;

function TutorialSearchField() {
  const search = useDebouncedSearchParam("q");

  return (
    <div className="min-w-0 flex-1 sm:min-w-[14rem]">
      <label htmlFor="tutorial-search" className="sr-only">
        Search tutorials
      </label>
      <input
        id="tutorial-search"
        type="search"
        value={search.value}
        onChange={(event) => search.onChange(event.target.value)}
        placeholder="Search by title, description or category"
        className={filterInputClass}
      />
    </div>
  );
}

interface TutorialFiltersProps {
  filters: TutorialListFilters;
  categories: TutorialCategoryOption[];
}

export function TutorialFilters({ filters, categories }: TutorialFiltersProps) {
  const { pushParams, reset, isPending } = useAdminListNavigation();
  const [searchResetKey, setSearchResetKey] = useState(0);
  const showReset = tutorialFiltersAreActive(filters);

  function updateFilter(
    key: keyof TutorialListFilters,
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
        <TutorialSearchField key={searchResetKey} />

        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
          <div>
            <label
              htmlFor="tutorial-category"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary"
            >
              Category
            </label>
            <select
              id="tutorial-category"
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
              htmlFor="tutorial-difficulty"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary"
            >
              Difficulty
            </label>
            <select
              id="tutorial-difficulty"
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
