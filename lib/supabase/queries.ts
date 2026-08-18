import { hasSupabaseEnv } from "@/lib/supabase/env";
import { isRlsError, logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type {
  Article,
  Category,
  Lab,
  Tutorial,
} from "@/lib/supabase/types";

const PUBLISHED = "published" as const;

export interface DatabaseStatus {
  connected: boolean;
  readAccessRestricted: boolean;
  counts: {
    articles: number;
    labs: number;
    tutorials: number;
    categories: number;
  } | null;
}

async function countTable(table: "articles" | "labs" | "tutorials" | "categories") {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    logQueryError(`count:${table}`, error);
    throw error;
  }

  return count ?? 0;
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  if (!hasSupabaseEnv()) {
    return {
      connected: false,
      readAccessRestricted: false,
      counts: null,
    };
  }

  try {
    const [articles, labs, tutorials, categories] = await Promise.all([
      countTable("articles"),
      countTable("labs"),
      countTable("tutorials"),
      countTable("categories"),
    ]);

    return {
      connected: true,
      readAccessRestricted: false,
      counts: { articles, labs, tutorials, categories },
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      isRlsError({
        code: "code" in error ? String(error.code) : undefined,
        message: error.message,
      })
    ) {
      return {
        connected: true,
        readAccessRestricted: true,
        counts: null,
      };
    }

    return {
      connected: false,
      readAccessRestricted: false,
      counts: null,
    };
  }
}

export async function getPublishedArticles(): Promise<Article[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", PUBLISHED)
      .order("published_at", { ascending: false });

    if (error) {
      logQueryError("getPublishedArticles", error);
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", PUBLISHED)
      .maybeSingle();

    if (error) {
      logQueryError("getArticleBySlug", error);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function getFeaturedArticles(): Promise<Article[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", PUBLISHED)
      .eq("featured", true)
      .order("published_at", { ascending: false });

    if (error) {
      logQueryError("getFeaturedArticles", error);
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      logQueryError("getCategories", error);
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}

export async function getPublishedLabs(): Promise<Lab[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("labs")
      .select("*")
      .eq("status", PUBLISHED)
      .order("sort_order", { ascending: true });

    if (error) {
      logQueryError("getPublishedLabs", error);
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}

export async function getLabBySlug(slug: string): Promise<Lab | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("labs")
      .select("*")
      .eq("slug", slug)
      .eq("status", PUBLISHED)
      .maybeSingle();

    if (error) {
      logQueryError("getLabBySlug", error);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function getPublishedTutorials(): Promise<Tutorial[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .eq("status", PUBLISHED)
      .order("sort_order", { ascending: true });

    if (error) {
      logQueryError("getPublishedTutorials", error);
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}

export async function getTutorialBySlug(slug: string): Promise<Tutorial | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .eq("slug", slug)
      .eq("status", PUBLISHED)
      .maybeSingle();

    if (error) {
      logQueryError("getTutorialBySlug", error);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
