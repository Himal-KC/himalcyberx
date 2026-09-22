"use server";

import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/lib/form-types";
import { LEARNER_PROFILE_PATH } from "@/lib/auth/constants";
import { getLearnerServerClient } from "@/lib/auth/session";
import {
  buildProfileUpdatePayload,
  validateProfileFields,
} from "@/lib/auth/profile-validation";
import {
  getAvatarFileFromFormData,
} from "@/lib/storage/avatars";
import {
  removeOwnAvatar,
  uploadOwnAvatar,
} from "@/lib/storage/avatar-upload-core";
import { createSupabaseAvatarStore } from "@/lib/storage/avatar-store";
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

  const store = createSupabaseAvatarStore(
    auth.supabase,
    getSupabaseEnv().url,
    auth.user.id,
  );
  const result = await uploadOwnAvatar(store, {
    file: getAvatarFileFromFormData(formData),
  });

  if (!result.ok) {
    const fieldErrors =
      result.error === "empty_file" ||
      result.error === "invalid_type" ||
      result.error === "too_large"
        ? { avatar: result.message }
        : undefined;

    return {
      success: false,
      message: result.message,
      fieldErrors,
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

  const store = createSupabaseAvatarStore(
    auth.supabase,
    getSupabaseEnv().url,
    auth.user.id,
  );
  const result = await removeOwnAvatar(store);

  if (!result.ok) {
    return {
      success: false,
      message: result.message,
    };
  }

  revalidatePath(LEARNER_PROFILE_PATH);
  return {
    success: true,
    message: "Your avatar has been removed.",
  };
}
