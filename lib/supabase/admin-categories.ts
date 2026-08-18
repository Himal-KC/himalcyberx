import { logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/supabase/types";

export interface AdminCategoryRow extends Category {
  article_count: number;
}

function mapCategoryRows(
  rows: Array<Category & { articles?: Array<{ count: number }> }>,
): AdminCategoryRow[] {
  return rows.map((row) => ({
    ...row,
    article_count: row.articles?.[0]?.count ?? 0,
  }));
}

export async function getAdminCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    logQueryError("getAdminCategories", error);
    return [];
  }

  return data ?? [];
}

export async function getAdminCategoriesWithCounts(): Promise<AdminCategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*, articles(count)")
    .order("name", { ascending: true });

  if (error) {
    logQueryError("getAdminCategoriesWithCounts", error);
    return [];
  }

  return mapCategoryRows(
    (data ?? []) as Array<Category & { articles?: Array<{ count: number }> }>,
  );
}

export async function getAdminCategoryById(
  id: string,
): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logQueryError("getAdminCategoryById", error);
    return null;
  }

  return data;
}

export async function isCategorySlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from("categories").select("id").eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    logQueryError("isCategorySlugTaken", error);
    return true;
  }

  return Boolean(data);
}

export async function countArticlesByCategoryId(
  categoryId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (error) {
    logQueryError("countArticlesByCategoryId", error);
    return 0;
  }

  return count ?? 0;
}
