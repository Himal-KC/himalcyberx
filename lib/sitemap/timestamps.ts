export interface SitemapContentEntry {
  slug: string;
  lastModified?: Date;
}

export function parseSitemapDate(
  value: string | null | undefined,
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function resolveArticleSitemapDate(row: {
  updated_at?: string | null;
  published_at?: string | null;
  created_at?: string | null;
}): Date | undefined {
  return parseSitemapDate(
    row.updated_at ?? row.published_at ?? row.created_at ?? undefined,
  );
}

export function resolveContentSitemapDate(row: {
  updated_at?: string | null;
  published_at?: string | null;
}): Date | undefined {
  return parseSitemapDate(row.updated_at ?? row.published_at ?? undefined);
}
