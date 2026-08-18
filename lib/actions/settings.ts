"use server";

import { revalidatePath } from "next/cache";
import {
  formatDevErrorMessage,
  getAuthenticatedServerClient,
  logSafeDbError,
} from "@/lib/supabase/admin-session";
import { getAdminSiteSettings } from "@/lib/settings/site-settings";
import {
  parseSiteSettingsFormData,
  toSiteSettingsPayload,
  validateSiteSettingsInput,
} from "@/lib/settings/validation";

export interface SiteSettingsActionState {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function saveSiteSettings(
  _prevState: SiteSettingsActionState,
  formData: FormData,
): Promise<SiteSettingsActionState> {
  const auth = await getAuthenticatedServerClient("saveSiteSettings");

  if (!auth.ok) {
    return { message: auth.error };
  }

  const input = parseSiteSettingsFormData(formData);
  const fieldErrors = validateSiteSettingsInput(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Please correct the errors below.",
      fieldErrors,
    };
  }

  const payload = toSiteSettingsPayload(input);
  const existing = await getAdminSiteSettings();

  const { error } = existing
    ? await auth.supabase
        .from("site_settings")
        .update(payload)
        .eq("id", existing.id)
    : await auth.supabase.from("site_settings").insert(payload);

  if (error) {
    logSafeDbError("saveSiteSettings", auth.user.id, {
      code: error.code,
      message: error.message,
    });

    return {
      message: formatDevErrorMessage(
        error,
        "Unable to save settings. Please try again.",
      ),
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");

  return {
    success: true,
    message: "Settings saved successfully.",
  };
}
