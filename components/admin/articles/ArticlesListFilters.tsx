"use client";

import { useState } from "react";

import {
  AdminFilterField,
  AdminListFiltersShell,
  adminFilterInputClass,
} from "@/components/admin/AdminListFiltersShell";
import {
  articleListFiltersAreActive,
  type ArticleListFilters,
} from "@/lib/admin/article-list";
import {
  useAdminListNavigation,
  useDebouncedSearchParam,
} from "@/components/admin/useAdminListNavigation";
import type { Category } from "@/lib/supabase/types";

function ArticleSearchField() {
  const search = useDebouncedSearchParam("q");

  return (
    <AdminFilterField label="Search" htmlFor="article-search" className="md:col-span-2 xl:col-span-3">
      <input
        id="article-search"
        type="search"
        value={search.value}
        onChange={(event) => search.onChange(event.target.value)}
        placeholder="Search by title or slug"
        className={adminFilterInputClass}
      />
    </AdminFilterField>
  );
}

interface ArticlesListFiltersProps {
  filters: ArticleListFilters;
  categories: Pick<Category, "id" | "name">[];
  preserveKeys?: string[];
}

export function ArticlesListFilters({
  filters,
  categories,
  preserveKeys = ["success"],
}: ArticlesListFiltersProps) {
  const { pushParams, reset, isPending } = useAdminListNavigation();
  const [searchResetKey, setSearchResetKey] = useState(0);

  function handleReset() {
    reset(preserveKeys);
    setSearchResetKey((current) => current + 1);
  }

  function updateFilter(
    key: keyof ArticleListFilters,
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
      showReset={articleListFiltersAreActive(filters)}
      onReset={handleReset}
      isPending={isPending}
    >
      <ArticleSearchField key={searchResetKey} />

      <AdminFilterField label="Status" htmlFor="article-status">
        <select
          id="article-status"
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
          className={adminFilterInputClass}
        >
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </AdminFilterField>

      <AdminFilterField label="Category" htmlFor="article-category">
        <select
          id="article-category"
          value={filters.category}
          onChange={(event) => updateFilter("category", event.target.value)}
          className={adminFilterInputClass}
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </AdminFilterField>

      <AdminFilterField label="Featured" htmlFor="article-featured">
        <select
          id="article-featured"
          value={filters.featured}
          onChange={(event) => updateFilter("featured", event.target.value)}
          className={adminFilterInputClass}
        >
          <option value="all">All</option>
          <option value="featured">Featured</option>
          <option value="not-featured">Not Featured</option>
        </select>
      </AdminFilterField>

      <AdminFilterField label="Sort" htmlFor="article-sort">
        <select
          id="article-sort"
          value={filters.sort}
          onChange={(event) =>
            updateFilter("sort", event.target.value, "newest")
          }
          className={adminFilterInputClass}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="updated">Recently Updated</option>
          <option value="scheduled-soon">Scheduled Soon</option>
        </select>
      </AdminFilterField>
    </AdminListFiltersShell>
  );
}
