"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useAdminListNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const pushParams = useCallback(
    (build: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      build(params);
      const query = params.toString();

      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  const reset = useCallback(
    (preserveKeys: string[] = []) => {
      const params = new URLSearchParams();

      for (const key of preserveKeys) {
        const value = searchParams.get(key);
        if (value) {
          params.set(key, value);
        }
      }

      const query = params.toString();

      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  return { pushParams, reset, isPending, searchParams };
}

export function useDebouncedSearchParam(
  paramKey: string,
  delayMs = 400,
): {
  value: string;
  onChange: (value: string) => void;
  isPending: boolean;
} {
  const { pushParams, isPending, searchParams } = useAdminListNavigation();
  const paramValue = searchParams.get(paramKey) ?? "";
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? paramValue;

  useEffect(() => {
    if (draft === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      pushParams((params) => {
        const trimmed = draft.trim();
        if (trimmed) {
          params.set(paramKey, trimmed);
        } else {
          params.delete(paramKey);
        }
      });
      setDraft(null);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, draft, paramKey, pushParams]);

  return { value, onChange: setDraft, isPending };
}
