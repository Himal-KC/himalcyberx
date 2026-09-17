import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, ProfileUpdate } from "@/lib/supabase/types";
import { logQueryError } from "@/lib/supabase/errors";

const PROFILE_COLUMNS =
  "user_id, display_name, username, avatar_url, bio, created_at, updated_at";

export async function getOwnProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logQueryError("getOwnProfile", error);
    return null;
  }

  return (data as Profile | null) ?? null;
}

export async function getOrCreateOwnProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const existing = await getOwnProfile(supabase, userId);
  if (existing) {
    return existing;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    user_id: userId,
  });

  if (insertError && insertError.code !== "23505") {
    logQueryError("getOrCreateOwnProfile", insertError);
  }

  return getOwnProfile(supabase, userId);
}

export async function updateOwnProfile(
  supabase: SupabaseClient,
  userId: string,
  fields: ProfileUpdate,
) {
  const payload: ProfileUpdate = {
    ...fields,
    updated_at: fields.updated_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("user_id", userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (data) {
    return { data: data as Profile, error: null };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select(PROFILE_COLUMNS)
    .single();

  return {
    data: (inserted as Profile | null) ?? null,
    error: insertError,
  };
}
