import type { SupabaseClient } from "@supabase/supabase-js";
import { AVATARS_BUCKET } from "@/lib/auth/constants";
import {
  isAllowedAvatarStoragePath,
  isAvatarOwnerId,
} from "@/lib/storage/avatars";
import type { AvatarUploadStore } from "@/lib/storage/avatar-upload-core";
import { updateOwnProfile } from "@/lib/supabase/profiles";

type StorageErrorLike = { message?: string } | null;

function errorMessage(error: StorageErrorLike): string | null {
  return error?.message ?? null;
}

export function createSupabaseAvatarStore(
  supabase: SupabaseClient,
  supabaseUrl: string,
  sessionUserId: string,
): AvatarUploadStore {
  return {
    now: () => new Date(),
    getSessionUser: async () =>
      isAvatarOwnerId(sessionUserId) ? { id: sessionUserId } : null,
    getSupabaseUrl: () => supabaseUrl,
    uploadAvatar: async (path, bytes, contentType) => {
      if (!isAllowedAvatarStoragePath(path, sessionUserId)) {
        return { error: "unauthorized_path" };
      }

      const { error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(path, bytes, {
          upsert: true,
          contentType,
          cacheControl: "3600",
        });

      return { error: errorMessage(error) };
    },
    listOwnAvatarPaths: async (userId) => {
      if (userId !== sessionUserId || !isAvatarOwnerId(userId)) {
        return { paths: [], error: "unauthorized_path" };
      }

      const { data, error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .list(userId);

      if (error) {
        return { paths: [], error: errorMessage(error) };
      }

      const paths = (data ?? [])
        .map((item) => `${userId}/${item.name}`)
        .filter((path) => isAllowedAvatarStoragePath(path, userId));

      return { paths, error: null };
    },
    removePaths: async (paths) => {
      const allowed = paths.filter((path) =>
        isAllowedAvatarStoragePath(path, sessionUserId),
      );
      if (allowed.length === 0) {
        return { error: null };
      }

      const { error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .remove(allowed);

      return { error: errorMessage(error) };
    },
    updateProfileAvatar: async (userId, avatarUrl) => {
      if (userId !== sessionUserId) {
        return { error: "unauthorized_path" };
      }

      const { error } = await updateOwnProfile(supabase, sessionUserId, {
        avatar_url: avatarUrl,
      });

      return { error: errorMessage(error) };
    },
  };
}
