"use server";

import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/lib/form-types";
import { AVATARS_BUCKET, LEARNER_PROFILE_PATH } from "@/lib/auth/constants";
import { getLearnerServerClient } from "@/lib/auth/session";
import {
  buildProfileUpdatePayload,
  validateProfileFields,
} from "@/lib/auth/profile-validation";
import {
  buildAvatarStoragePath,
  buildPublicAvatarUrl,
  validateAvatarFile,
} from "@/lib/storage/avatars";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { updateOwnProfile } from "@/lib/supabase/profiles";

function unavailable(): FormActionState {
  return {
    success: false,
    message: "Profile updates are temporarily unavailable. Please try again later.",
  };
}

export async function updateLearnerProfile(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  if (!hasSupabaseEnv()) {
    return unavailable();
  }

  const auth = await getLearnerServerClient();
  if (!auth.ok) {
    return { success: false, message: auth.error };
  }

  const validated = validateProfileFields({
    displayName: String(formData.get("displayName") ?? ""),
    username: String(formData.get("username") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  });

  if (!validated.ok) {
    return {
      success: false,
      message: "Please fix the highlighted fields and try again.",
      fieldErrors: validated.fieldErrors,
    };
  }

  const payload = buildProfileUpdatePayload(validated.values);
  const { error } = await updateOwnProfile(
    auth.supabase,
    auth.user.id,
    payload,
  );

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: "That username is already taken.",
        fieldErrors: { username: "That username is already taken." },
      };
    }

    return {
      success: false,
      message: "Unable to update your profile. Please try again.",
    };
  }

  revalidatePath(LEARNER_PROFILE_PATH);
  return {
    success: true,
    message: "Your profile has been updated.",
  };
}

export async function uploadLearnerAvatar(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  if (!hasSupabaseEnv()) {
    return unavailable();
  }

  const auth = await getLearnerServerClient();
  if (!auth.ok) {
    return { success: false, message: auth.error };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return {
      success: false,
      message: "Choose an image to upload.",
      fieldErrors: { avatar: "Choose an image to upload." },
    };
  }

  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    const avatarError =
      validation.error ?? "That image cannot be used as an avatar.";
    return {
      success: false,
      message: avatarError,
      fieldErrors: { avatar: avatarError },
    };
  }

  const path = buildAvatarStoragePath(auth.user.id, file.type);
  const { error: uploadError } = await auth.supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return {
      success: false,
      message:
        "Avatar upload is not available yet. You can still save your name, username, and bio.",
    };
  }

  const { url } = getSupabaseEnv();
  const avatarUrl = buildPublicAvatarUrl(url, auth.user.id, file.type);
  const { error } = await updateOwnProfile(auth.supabase, auth.user.id, {
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return {
      success: false,
      message: "Avatar uploaded, but the profile could not be updated. Please try again.",
    };
  }

  revalidatePath(LEARNER_PROFILE_PATH);
  return {
    success: true,
    message: "Your avatar has been updated.",
  };
}

export async function removeLearnerAvatar(
  prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  void prevState;
  void formData;
  if (!hasSupabaseEnv()) {
    return unavailable();
  }

  const auth = await getLearnerServerClient();
  if (!auth.ok) {
    return { success: false, message: auth.error };
  }

  const { error } = await updateOwnProfile(auth.supabase, auth.user.id, {
    avatar_url: null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return {
      success: false,
      message: "Unable to remove your avatar. Please try again.",
    };
  }

  revalidatePath(LEARNER_PROFILE_PATH);
  return {
    success: true,
    message: "Your avatar has been removed.",
  };
}
