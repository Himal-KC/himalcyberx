"use client";

import { useState } from "react";
import {
  useAdminListNavigation,
  useDebouncedSearchParam,
} from "@/components/admin/useAdminListNavigation";
import {
  newsListFiltersAreActive,
  type NewsCategoryOption,
  type NewsListFilters,
} from "@/lib/news-list";
import { focusRing } from "@/lib/page-data";

const filterInputClass = `w-full rounded-lg border border-hcx-border bg-hcx-card px-3 py-2.5 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 ${focusRing}`;

function NewsSearchField() {
  const search = useDebouncedSearchParam("q");

  return (
    <div className="min-w-0 flex-1 sm:min-w-[14rem]">
      <label htmlFor="news-search" className="sr-only">
        Search articles
      </label>
      <input
        id="news-search"
        type="search"
        value={search.value}
        onChange={(event) => search.onChange(event.target.value)}
        placeholder="Search by title or excerpt"
        className={filterInputClass}
      />
    </div>
  );
}

interface NewsListFiltersProps {
  filters: NewsListFilters;
  categories: NewsCategoryOption[];
}

export function NewsListFilters({ filters, categories }: NewsListFiltersProps) {
  const { pushParams, reset, isPending } = useAdminListNavigation();
  const [searchResetKey, setSearchResetKey] = useState(0);
  const showReset = newsListFiltersAreActive(filters);

  function updateFilter(
    key: keyof NewsListFilters,
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
        <NewsSearchField key={searchResetKey} />

        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
          <div>
            <label
              htmlFor="news-category"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary"
            >
              Category
            </label>
            <select
              id="news-category"
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
              htmlFor="news-sort"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary"
            >
              Sort
            </label>
            <select
              id="news-sort"
              value={filters.sort}
              onChange={(event) =>
                updateFilter("sort", event.target.value, "newest")
              }
              className={filterInputClass}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="updated">Recently Updated</option>
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
