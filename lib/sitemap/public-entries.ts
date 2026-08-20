import { cache } from "react";
import {
  isArticlePubliclyAvailable,
  isPublishedAtPubliclyAvailable,
} from "@/lib/articles/publishing";
import {
  resolveArticleSitemapDate,
  resolveContentSitemapDate,
  type SitemapContentEntry,
} from "@/lib/sitemap/timestamps";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { logQueryError } from "@/lib/supabase/errors";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import type { Article, Lab, Tutorial } from "@/lib/supabase/types";

const PUBLISHED = "published" as const;

export interface SitemapContentGroups {
  articles: SitemapContentEntry[];
  labs: SitemapContentEntry[];
  tutorials: SitemapContentEntry[];
}

const EMPTY_GROUPS: SitemapContentGroups = {
  articles: [],
  labs: [],
  tutorials: [],
};

export const getSitemapContentEntries = cache(
  async (): Promise<SitemapContentGroups> => {
    if (!hasSupabaseEnv()) {
      return EMPTY_GROUPS;
    }

    try {
      const supabase = createPublicServerClient();
      const [articlesResult, labsResult, tutorialsResult] = await Promise.all([
        supabase
          .from("articles")
          .select("slug, updated_at, published_at, created_at, status")
          .eq("status", PUBLISHED),
        supabase
          .from("labs")
          .select("slug, updated_at, published_at, status")
          .eq("status", PUBLISHED),
        supabase
          .from("tutorials")
          .select("slug, updated_at, published_at, status")
          .eq("status", PUBLISHED),
      ]);

      if (articlesResult.error) {
        logQueryError("getSitemapContentEntries:articles", articlesResult.error);
      }

      if (labsResult.error) {
        logQueryError("getSitemapContentEntries:labs", labsResult.error);
      }

      if (tutorialsResult.error) {
        logQueryError(
          "getSitemapContentEntries:tutorials",
          tutorialsResult.error,
        );
      }

      const articles = ((articlesResult.data ?? []) as Article[])
        .filter((row) => isArticlePubliclyAvailable(row))
        .map((row) => ({
          slug: row.slug,
          lastModified: resolveArticleSitemapDate(row),
        }));

      const labs = ((labsResult.data ?? []) as Lab[])
        .filter((row) => isPublishedAtPubliclyAvailable(row.published_at))
        .map((row) => ({
          slug: row.slug,
          lastModified: resolveContentSitemapDate(row),
        }));

      const tutorials = ((tutorialsResult.data ?? []) as Tutorial[])
        .filter((row) => isPublishedAtPubliclyAvailable(row.published_at))
        .map((row) => ({
          slug: row.slug,
          lastModified: resolveContentSitemapDate(row),
        }));

      return { articles, labs, tutorials };
    } catch {
      return EMPTY_GROUPS;
    }
  },
);
