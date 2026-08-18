import { logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { Lab } from "@/lib/supabase/types";

export async function getAdminLabs(): Promise<Lab[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("labs")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    logQueryError("getAdminLabs", error);
    return [];
  }

  return (data ?? []) as Lab[];
}

export async function getAdminLabById(id: string): Promise<Lab | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("labs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logQueryError("getAdminLabById", error);
    return null;
  }

  return data as Lab | null;
}

export async function isLabSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from("labs").select("id").eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    logQueryError("isLabSlugTaken", error);
    return true;
  }

  return Boolean(data);
}
