import { logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminArticleRow,
  Article,
  ArticleStatus,
} from "@/lib/supabase/types";

export interface ArticleSummaryCounts {
  published: number;
  draft: number;
  archived: number;
  total: number;
}

export async function getAdminArticleSummary(): Promise<ArticleSummaryCounts> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("status");

  if (error) {
    logQueryError("getAdminArticleSummary", error);
    return { published: 0, draft: 0, archived: 0, total: 0 };
  }

  const rows = (data ?? []) as Array<{ status: ArticleStatus }>;
  return {
    published: rows.filter((row) => row.status === "published").length,
    draft: rows.filter((row) => row.status === "draft").length,
    archived: rows.filter((row) => row.status === "archived").length,
    total: rows.length,
  };
}

export async function getAdminArticles(): Promise<AdminArticleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, categories(name)")
    .order("updated_at", { ascending: false });

  if (error) {
    logQueryError("getAdminArticles", error);
    return [];
  }

  return (data ?? []) as AdminArticleRow[];
}

export async function getAdminArticleById(
  id: string,
): Promise<Article | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logQueryError("getAdminArticleById", error);
    return null;
  }

  return data;
}

export { getAdminCategories } from "@/lib/supabase/admin-categories";

export async function isArticleSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from("articles").select("id").eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    logQueryError("isArticleSlugTaken", error);
    return true;
  }

  return Boolean(data);
}

export async function countArticlesByStatus(
  status: ArticleStatus,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("status", status);

  if (error) {
    logQueryError(`countArticlesByStatus:${status}`, error);
    return 0;
  }

  return count ?? 0;
}
