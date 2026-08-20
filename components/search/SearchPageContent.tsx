"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { SearchResultsList } from "@/components/search/SearchResultsList";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";
import {
  countSearchResults,
  filterGroupedSearchResults,
  SEARCH_FILTERS,
  type GroupedSearchResults,
  type SearchFilter,
} from "@/lib/search";
import { focusRing } from "@/lib/page-data";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

interface SearchPageContentProps {
  initialQuery: string;
  results: GroupedSearchResults;
}

export function SearchPageContent({
  initialQuery,
  results,
}: SearchPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryFromUrl = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(queryFromUrl || initialQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(queryFromUrl);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("All");

  if (queryFromUrl !== prevUrlQuery) {
    setPrevUrlQuery(queryFromUrl);
    setInputValue(queryFromUrl);
  }

  const debouncedInput = useDebouncedValue(inputValue, 300);

  const updateUrl = useCallback(
    (query: string) => {
      const params = new URLSearchParams();
      const trimmed = query.trim();
      if (trimmed) params.set("q", trimmed);
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  useEffect(() => {
    if (debouncedInput.trim() !== queryFromUrl.trim()) {
      updateUrl(debouncedInput);
    }
  }, [debouncedInput, queryFromUrl, updateUrl]);

  const activeQuery = queryFromUrl.trim();
  const canSearch = activeQuery.length >= 2;
  const filteredResults = filterGroupedSearchResults(results, activeFilter);
  const totalResults = countSearchResults(filteredResults);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateUrl(inputValue);
  };

  const handleSuggestionSelect = (query: string) => {
    setInputValue(query);
    updateUrl(query);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <header className="max-w-3xl">
        <p className="font-tech text-xs font-semibold uppercase tracking-[0.2em] text-hcx-cyan">
          HCX Search
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-hcx-text sm:text-4xl">
          SEARCH
        </h1>
        {activeQuery ? (
          <p className="mt-3 text-base leading-relaxed text-hcx-text-secondary sm:text-lg">
            Results for &ldquo;{activeQuery}&rdquo;
          </p>
        ) : (
          <p className="mt-3 text-base leading-relaxed text-hcx-text-secondary sm:text-lg">
            Search HimalCyberX content.
          </p>
        )}
      </header>

      <form onSubmit={handleSubmit} className="mt-8 max-w-3xl">
        <label htmlFor="search-page-input" className="sr-only">
          Search HimalCyberX
        </label>
        <div className="relative flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hcx-text-secondary">
              <SearchIcon />
            </span>
            <input
              id="search-page-input"
              type="search"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Search articles, labs and tutorials..."
              className={`w-full rounded-lg border border-hcx-border bg-hcx-card py-3.5 pl-10 pr-4 text-base text-hcx-text placeholder:text-hcx-text-secondary/60 sm:py-4 ${focusRing}`}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className={`shrink-0 rounded-lg bg-hcx-cyan px-6 py-3.5 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 sm:py-4 ${focusRing}`}
          >
            Search
          </button>
        </div>
      </form>

      {!canSearch && (
        <div className="mt-10 max-w-3xl rounded-lg border border-hcx-border bg-hcx-card p-5 sm:p-6">
          <SearchSuggestions onSelect={handleSuggestionSelect} />
        </div>
      )}

      {canSearch && (
        <div className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm text-hcx-text-secondary">
              {totalResults} {totalResults === 1 ? "result" : "results"}
            </p>

            <div
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
              role="group"
              aria-label="Filter results by type"
            >
              {SEARCH_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`shrink-0 rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${focusRing} ${
                    activeFilter === filter
                      ? "border-hcx-cyan/40 bg-hcx-cyan/10 text-hcx-cyan"
                      : "border-hcx-border bg-hcx-card text-hcx-text-secondary hover:border-hcx-cyan/25 hover:text-hcx-cyan"
                  }`}
                  aria-pressed={activeFilter === filter}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {totalResults > 0 ? (
            <div className="mt-8">
              <SearchResultsList
                results={filteredResults}
                showSectionHeadings={activeFilter === "All"}
              />
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-hcx-border bg-hcx-card p-8 text-center sm:p-12">
              <p className="font-tech text-sm font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
                No results found
              </p>
              <p className="mt-3 text-hcx-text-secondary">
                Try a different keyword or browse our latest cybersecurity content.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/cyber-lab"
                  className={`rounded-lg border border-hcx-border bg-hcx-bg-secondary px-4 py-2.5 text-sm font-medium text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
                >
                  Cyber Lab
                </Link>
                <Link
                  href="/news"
                  className={`rounded-lg border border-hcx-border bg-hcx-bg-secondary px-4 py-2.5 text-sm font-medium text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
                >
                  Articles
                </Link>
                <Link
                  href="/tutorials"
                  className={`rounded-lg border border-hcx-border bg-hcx-bg-secondary px-4 py-2.5 text-sm font-medium text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
                >
                  Tutorials
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
