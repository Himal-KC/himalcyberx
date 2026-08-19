"use client";

import { useState } from "react";

import {
  AdminFilterField,
  AdminListFiltersShell,
  adminFilterInputClass,
} from "@/components/admin/AdminListFiltersShell";
import {
  tutorialListFiltersAreActive,
  type TutorialListFilters,
} from "@/lib/admin/tutorial-list";
import {
  useAdminListNavigation,
  useDebouncedSearchParam,
} from "@/components/admin/useAdminListNavigation";
import { TUTORIAL_DIFFICULTIES } from "@/lib/tutorials/constants";

function TutorialSearchField() {
  const search = useDebouncedSearchParam("q");

  return (
    <AdminFilterField
      label="Search"
      htmlFor="tutorial-search"
      className="md:col-span-2 xl:col-span-3"
    >
      <input
        id="tutorial-search"
        type="search"
        value={search.value}
        onChange={(event) => search.onChange(event.target.value)}
        placeholder="Search by title or slug"
        className={adminFilterInputClass}
      />
    </AdminFilterField>
  );
}

interface TutorialsListFiltersProps {
  filters: TutorialListFilters;
  categories: string[];
}

export function TutorialsListFilters({
  filters,
  categories,
}: TutorialsListFiltersProps) {
  const { pushParams, reset, isPending } = useAdminListNavigation();
  const [searchResetKey, setSearchResetKey] = useState(0);

  function handleReset() {
    reset();
    setSearchResetKey((current) => current + 1);
  }

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

  return (
    <AdminListFiltersShell
      showReset={tutorialListFiltersAreActive(filters)}
      onReset={handleReset}
      isPending={isPending}
    >
      <TutorialSearchField key={searchResetKey} />

      <AdminFilterField label="Difficulty" htmlFor="tutorial-difficulty">
        <select
          id="tutorial-difficulty"
          value={filters.difficulty}
          onChange={(event) => updateFilter("difficulty", event.target.value)}
          className={adminFilterInputClass}
        >
          <option value="all">All</option>
          {TUTORIAL_DIFFICULTIES.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </select>
      </AdminFilterField>

      <AdminFilterField label="Category" htmlFor="tutorial-category">
        <select
          id="tutorial-category"
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

      <AdminFilterField label="Status" htmlFor="tutorial-status">
        <select
          id="tutorial-status"
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
          className={adminFilterInputClass}
        >
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </AdminFilterField>

      <AdminFilterField label="Sort" htmlFor="tutorial-sort">
        <select
          id="tutorial-sort"
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
