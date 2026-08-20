"use client";

import { useState } from "react";
import {
  AdminFilterField,
  AdminListFiltersShell,
  adminFilterInputClass,
} from "@/components/admin/AdminListFiltersShell";
import { ExportSubscribersButton } from "@/components/admin/subscribers/ExportSubscribersButton";
import {
  formatSubscriberSource,
  subscriberListFiltersAreActive,
  type SubscriberListFilters,
} from "@/lib/admin/subscriber-list";
import {
  useAdminListNavigation,
  useDebouncedSearchParam,
} from "@/components/admin/useAdminListNavigation";

function SubscriberSearchField() {
  const search = useDebouncedSearchParam("q");

  return (
    <AdminFilterField
      label="Search"
      htmlFor="subscriber-search"
      className="md:col-span-2 xl:col-span-3"
    >
      <input
        id="subscriber-search"
        type="search"
        value={search.value}
        onChange={(event) => search.onChange(event.target.value)}
        placeholder="Search by email"
        className={adminFilterInputClass}
      />
    </AdminFilterField>
  );
}

interface SubscribersListFiltersProps {
  filters: SubscriberListFilters;
  sources: string[];
  canExport: boolean;
}

export function SubscribersListFilters({
  filters,
  sources,
  canExport,
}: SubscribersListFiltersProps) {
  const { pushParams, reset, isPending } = useAdminListNavigation();
  const [searchResetKey, setSearchResetKey] = useState(0);

  function updateFilter(
    key: keyof SubscriberListFilters,
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
    <div className="space-y-4">
      <AdminListFiltersShell
        showReset={subscriberListFiltersAreActive(filters)}
        onReset={handleReset}
        isPending={isPending}
      >
        <SubscriberSearchField key={searchResetKey} />

        <AdminFilterField label="Status" htmlFor="subscriber-status">
          <select
            id="subscriber-status"
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className={adminFilterInputClass}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </AdminFilterField>

        <AdminFilterField label="Source" htmlFor="subscriber-source">
          <select
            id="subscriber-source"
            value={filters.source}
            onChange={(event) => updateFilter("source", event.target.value)}
            className={adminFilterInputClass}
          >
            <option value="all">All sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {formatSubscriberSource(source)}
              </option>
            ))}
          </select>
        </AdminFilterField>

        <AdminFilterField label="Sort" htmlFor="subscriber-sort">
          <select
            id="subscriber-sort"
            value={filters.sort}
            onChange={(event) =>
              updateFilter("sort", event.target.value, "newest")
            }
            className={adminFilterInputClass}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="updated">Recently Changed</option>
          </select>
        </AdminFilterField>
      </AdminListFiltersShell>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-hcx-text-secondary">
          Export includes only the currently filtered subscriber list.
        </p>
        <ExportSubscribersButton filters={filters} disabled={!canExport} />
      </div>
    </div>
  );
}
