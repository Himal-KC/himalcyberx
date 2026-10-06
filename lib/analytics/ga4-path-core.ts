/** Defensive filter: exclude admin routes from top-content analytics. */
export function isExcludedAnalyticsPagePath(path: string): boolean {
  const normalized = path.trim() || "/";
  if (normalized === "/admin" || normalized.startsWith("/admin/")) {
    return true;
  }
  return false;
}

export function filterPublicContentPaths<T extends { path: string }>(
  rows: T[],
): T[] {
  return rows.filter((row) => !isExcludedAnalyticsPagePath(row.path));
}
