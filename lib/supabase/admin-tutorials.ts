import { logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { Tutorial } from "@/lib/supabase/types";

export async function getAdminTutorials(): Promise<Tutorial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutorials")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    logQueryError("getAdminTutorials", error);
    return [];
  }

  return (data ?? []) as Tutorial[];
}

export async function getAdminTutorialById(
  id: string,
): Promise<Tutorial | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutorials")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logQueryError("getAdminTutorialById", error);
    return null;
  }

  return data as Tutorial | null;
}

export async function isTutorialSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from("tutorials").select("id").eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    logQueryError("isTutorialSlugTaken", error);
    return true;
  }

  return Boolean(data);
}
