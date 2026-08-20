"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { SearchResultsList } from "@/components/search/SearchResultsList";
import {
  countSearchResults,
  OVERLAY_SUGGESTED_SEARCHES,
  type GroupedSearchResults,
} from "@/lib/search";
import { focusRing, iconButtonClass } from "@/lib/page-data";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_RESULTS: GroupedSearchResults = {
  articles: [],
  labs: [],
  tutorials: [],
};

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedSearchResults>(EMPTY_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open && !wasOpen) {
    setWasOpen(true);
    setQuery("");
    setResults(EMPTY_RESULTS);
    setIsSearching(false);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const debouncedQuery = useDebouncedValue(query, 300);
  const trimmedQuery = debouncedQuery.trim();
  const canSearch = trimmedQuery.length >= 2;

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!canSearch) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function runSearch() {
      setIsSearching(true);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data = (await response.json()) as GroupedSearchResults;

        if (!cancelled) {
          setResults(data);
        }
      } catch (error) {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) {
          setResults(EMPTY_RESULTS);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    runSearch();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [canSearch, trimmedQuery]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults(EMPTY_RESULTS);
      setIsSearching(false);
    }
  };

  const submitSearch = useCallback(
    (term: string) => {
      const normalized = term.trim();
      if (!normalized) return;
      onClose();
      router.push(`/search?q=${encodeURIComponent(normalized)}`);
    },
    [onClose, router],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submitSearch(query);
  };

  const totalResults = countSearchResults(results);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col lg:items-start lg:justify-center lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Search HimalCyberX"
    >
      <button
        type="button"
        className="absolute inset-0 bg-hcx-bg/80 backdrop-blur-sm lg:block"
        aria-label="Close search"
        onClick={onClose}
      />

      <div className="relative flex min-h-0 w-full flex-1 flex-col border-b border-hcx-border bg-hcx-card shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:mx-auto lg:max-h-[min(80vh,720px)] lg:max-w-2xl lg:flex-none lg:rounded-xl lg:border lg:border-hcx-border">
        <div className="flex items-center justify-between border-b border-hcx-border px-4 py-4 sm:px-5">
          <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Search HimalCyberX
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`${iconButtonClass} text-hcx-text-secondary transition-colors hover:bg-hcx-bg-secondary hover:text-hcx-cyan`}
            aria-label="Close search"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="border-b border-hcx-border p-4 sm:p-5">
          <label htmlFor="search-overlay-input" className="sr-only">
            Search HimalCyberX
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hcx-text-secondary">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              id="search-overlay-input"
              type="search"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search articles, labs and tutorials..."
              className={`w-full rounded-lg border border-hcx-border bg-hcx-bg py-3 pl-10 pr-4 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 ${focusRing}`}
              autoComplete="off"
            />
          </div>
        </form>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
          aria-live="polite"
          aria-atomic="true"
        >
          {!canSearch && (
            <div>
              <p className="text-sm text-hcx-text-secondary">
                Search HimalCyberX content.
              </p>
              <div className="mt-4">
                <p className="font-tech text-[10px] font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
                  Suggested Searches
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {OVERLAY_SUGGESTED_SEARCHES.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => submitSearch(suggestion)}
                      className={`rounded-md border border-hcx-border bg-hcx-bg/60 px-3 py-2 text-sm text-hcx-text-secondary transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {canSearch && isSearching && (
            <p className="text-sm text-hcx-text-secondary">Searching...</p>
          )}

          {canSearch && !isSearching && totalResults === 0 && (
            <div>
              <p className="font-tech text-sm font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
                No results found
              </p>
              <p className="mt-2 text-sm text-hcx-text-secondary">
                Try a different keyword or browse our latest cybersecurity content.
              </p>
            </div>
          )}

          {canSearch && !isSearching && totalResults > 0 && (
            <div>
              <SearchResultsList
                results={results}
                compact
                showSectionHeadings
              />
              <div className="mt-4 border-t border-hcx-border pt-4">
                <Link
                  href={`/search?q=${encodeURIComponent(trimmedQuery)}`}
                  onClick={onClose}
                  className={`inline-flex items-center text-sm font-semibold text-hcx-cyan hover:underline ${focusRing}`}
                >
                  View all results →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
