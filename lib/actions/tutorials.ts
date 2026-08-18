"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildTutorialInsertPayload,
  buildTutorialUpdatePayload,
} from "@/lib/tutorials/insert-payload";
import {
  parseTutorialFormData,
  resolveTutorialPublishedAt,
  resolveTutorialSubmitStatus,
  validateTutorialInput,
} from "@/lib/tutorials/validation";
import {
  getAdminTutorialById,
  isTutorialSlugTaken,
} from "@/lib/supabase/admin-tutorials";
import {
  formatDevErrorMessage,
  getAuthenticatedServerClient,
  isDevelopment,
  logSafeDbError,
} from "@/lib/supabase/admin-session";
import { isRlsError } from "@/lib/supabase/errors";

export interface TutorialActionState {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function revalidateTutorialPaths(slug?: string) {
  revalidatePath("/admin/tutorials");
  revalidatePath("/admin/tutorials/new");
  revalidatePath("/tutorials");
  if (slug) {
    revalidatePath(`/tutorials/${slug}`);
  }
}

function tutorialInsertRlsMessage(): string {
  return 'Insert blocked by Row Level Security. Apply policies in supabase/tutorials-policies.sql on public.tutorials for the authenticated role.';
}

export async function createTutorial(
  _prevState: TutorialActionState,
  formData: FormData,
): Promise<TutorialActionState> {
  const auth = await getAuthenticatedServerClient("createTutorial");

  if (!auth.ok) {
    if (isDevelopment() && auth.authErrorMessage) {
      return {
        message: `${auth.error} (${auth.authErrorMessage})`,
      };
    }

    return { message: auth.error };
  }

  const { supabase, user } = auth;
  const input = parseTutorialFormData(formData);
  const status = resolveTutorialSubmitStatus(formData, input);
  const validation = validateTutorialInput({ ...input, status });

  if (Object.keys(validation.fieldErrors).length > 0) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: validation.fieldErrors,
    };
  }

  if (await isTutorialSlugTaken(input.slug)) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: { slug: "This slug is already in use." },
    };
  }

  const publishedAt = resolveTutorialPublishedAt(status);
  const insertPayload = buildTutorialInsertPayload({
    input,
    status,
    publishedAt,
  });

  const { data, error } = await supabase
    .from("tutorials")
    .insert(insertPayload)
    .select("id, slug")
    .single();

  if (error) {
    logSafeDbError("createTutorial:insert", user.id, {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (isRlsError(error)) {
      return {
        message: formatDevErrorMessage(error, tutorialInsertRlsMessage()),
      };
    }

    return {
      message: formatDevErrorMessage(
        error,
        "Unable to create tutorial. Please try again.",
      ),
    };
  }

  revalidateTutorialPaths(data.slug);
  redirect("/admin/tutorials");
}

export async function updateTutorial(
  tutorialId: string,
  _prevState: TutorialActionState,
  formData: FormData,
): Promise<TutorialActionState> {
  const auth = await getAuthenticatedServerClient("updateTutorial");

  if (!auth.ok) {
    return { message: auth.error };
  }

  const existing = await getAdminTutorialById(tutorialId);
  if (!existing) {
    return { message: "Tutorial not found." };
  }

  const input = parseTutorialFormData(formData);
  const status = resolveTutorialSubmitStatus(formData, input);
  const validation = validateTutorialInput({ ...input, status });

  if (Object.keys(validation.fieldErrors).length > 0) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: validation.fieldErrors,
    };
  }

  if (await isTutorialSlugTaken(input.slug, tutorialId)) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: { slug: "This slug is already in use." },
    };
  }

  const publishedAt = resolveTutorialPublishedAt(status, existing.published_at);
  const updatePayload = buildTutorialUpdatePayload({
    input,
    status,
    publishedAt,
  });

  const { data, error } = await auth.supabase
    .from("tutorials")
    .update(updatePayload)
    .eq("id", tutorialId)
    .select("slug")
    .single();

  if (error) {
    logSafeDbError("updateTutorial:update", auth.user.id, {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    return {
      message: formatDevErrorMessage(
        error,
        "Unable to save changes. Please try again.",
      ),
    };
  }

  revalidateTutorialPaths(data.slug);
  if (existing.slug !== data.slug) {
    revalidatePath(`/tutorials/${existing.slug}`);
  }

  redirect("/admin/tutorials?success=updated");
}

export async function deleteTutorial(
  tutorialId: string,
): Promise<{ error?: string }> {
  const auth = await getAuthenticatedServerClient("deleteTutorial");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const existing = await getAdminTutorialById(tutorialId);
  if (!existing) {
    return { error: "Tutorial not found." };
  }

  const { error } = await auth.supabase
    .from("tutorials")
    .delete()
    .eq("id", tutorialId);

  if (error) {
    logSafeDbError("deleteTutorial", auth.user.id, {
      code: error.code,
      message: error.message,
    });
    return { error: "Unable to delete tutorial. Please try again." };
  }

  revalidateTutorialPaths(existing.slug);
  return {};
}
