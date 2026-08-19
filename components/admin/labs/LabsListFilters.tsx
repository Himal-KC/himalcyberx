"use client";

import { useState } from "react";

import {
  AdminFilterField,
  AdminListFiltersShell,
  adminFilterInputClass,
} from "@/components/admin/AdminListFiltersShell";
import {
  labListFiltersAreActive,
  type LabListFilters,
} from "@/lib/admin/lab-list";
import {
  useAdminListNavigation,
  useDebouncedSearchParam,
} from "@/components/admin/useAdminListNavigation";
import { LAB_DIFFICULTIES } from "@/lib/labs/constants";

function LabSearchField() {
  const search = useDebouncedSearchParam("q");

  return (
    <AdminFilterField label="Search" htmlFor="lab-search" className="md:col-span-2 xl:col-span-3">
      <input
        id="lab-search"
        type="search"
        value={search.value}
        onChange={(event) => search.onChange(event.target.value)}
        placeholder="Search by title or slug"
        className={adminFilterInputClass}
      />
    </AdminFilterField>
  );
}

interface LabsListFiltersProps {
  filters: LabListFilters;
  categories: string[];
}

export function LabsListFilters({ filters, categories }: LabsListFiltersProps) {
  const { pushParams, reset, isPending } = useAdminListNavigation();
  const [searchResetKey, setSearchResetKey] = useState(0);

  function handleReset() {
    reset();
    setSearchResetKey((current) => current + 1);
  }

  function updateFilter(
    key: keyof LabListFilters,
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

  return (
    <AdminListFiltersShell
      showReset={labListFiltersAreActive(filters)}
      onReset={handleReset}
      isPending={isPending}
    >
      <LabSearchField key={searchResetKey} />

      <AdminFilterField label="Difficulty" htmlFor="lab-difficulty">
        <select
          id="lab-difficulty"
          value={filters.difficulty}
          onChange={(event) => updateFilter("difficulty", event.target.value)}
          className={adminFilterInputClass}
        >
          <option value="all">All</option>
          {LAB_DIFFICULTIES.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </select>
      </AdminFilterField>

      <AdminFilterField label="Category" htmlFor="lab-category">
        <select
          id="lab-category"
          value={filters.category}
          onChange={(event) => updateFilter("category", event.target.value)}
          className={adminFilterInputClass}
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </AdminFilterField>

      <AdminFilterField label="Status" htmlFor="lab-status">
        <select
          id="lab-status"
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
          className={adminFilterInputClass}
        >
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </AdminFilterField>

      <AdminFilterField label="Sort" htmlFor="lab-sort">
        <select
          id="lab-sort"
          value={filters.sort}
          onChange={(event) =>
            updateFilter("sort", event.target.value, "newest")
          }
          className={adminFilterInputClass}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="updated">Recently Updated</option>
        </select>
      </AdminFilterField>
    </AdminListFiltersShell>
  );
}
