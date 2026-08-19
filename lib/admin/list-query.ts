export function readQueryString(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export function setQueryParam(
  params: URLSearchParams,
  key: string,
  value: string,
  defaultValue = "",
): void {
  const trimmed = value.trim();

  if (!trimmed || trimmed === defaultValue) {
    params.delete(key);
    return;
  }

  params.set(key, trimmed);
}

export function hasQueryParams(
  params: URLSearchParams,
  keys: string[],
): boolean {
  return keys.some((key) => {
    const value = params.get(key);
    return Boolean(value && value.trim());
  });
}

export function matchesSearchQuery(
  query: string,
  values: Array<string | null | undefined>,
): boolean {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return values.some((value) =>
    (value ?? "").toLowerCase().includes(normalized),
  );
}

export type ContentSortOption = "newest" | "oldest" | "updated";

export function sortByContentDate<T extends { created_at: string; updated_at: string }>(
  items: T[],
  sort: ContentSortOption,
): T[] {
  const sorted = [...items];

  switch (sort) {
    case "oldest":
      return sorted.sort(
        (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
      );
    case "updated":
      return sorted.sort(
        (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
      );
    case "newest":
    default:
      return sorted.sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
      );
  }
}
