"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildLabInsertPayload, buildLabUpdatePayload } from "@/lib/labs/insert-payload";
import {
  parseLabFormData,
  resolveLabPublishedAt,
  resolveLabSubmitStatus,
  validateLabInput,
} from "@/lib/labs/validation";
import { getAdminLabById, isLabSlugTaken } from "@/lib/supabase/admin-labs";
import {
  formatDevErrorMessage,
  getAuthenticatedServerClient,
  isDevelopment,
  logSafeDbError,
} from "@/lib/supabase/admin-session";
import { isRlsError } from "@/lib/supabase/errors";
import { notifySubscribersOfNewlyPublicContent } from "@/lib/notifications/publish-notification";

export interface LabActionState {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function revalidateLabPaths(slug?: string) {
  revalidatePath("/admin/labs");
  revalidatePath("/admin/labs/new");
  revalidatePath("/cyber-lab");
  if (slug) {
    revalidatePath(`/cyber-lab/${slug}`);
  }
}

function labInsertRlsMessage(): string {
  return 'Insert blocked by Row Level Security. Apply policies in supabase/labs-policies.sql on public.labs for the authenticated role.';
}

export async function createLab(
  _prevState: LabActionState,
  formData: FormData,
): Promise<LabActionState> {
  const auth = await getAuthenticatedServerClient("createLab");

  if (!auth.ok) {
    if (isDevelopment() && auth.authErrorMessage) {
      return {
        message: `${auth.error} (${auth.authErrorMessage})`,
      };
    }

    return { message: auth.error };
  }

  const { supabase, user } = auth;
  const input = parseLabFormData(formData);
  const status = resolveLabSubmitStatus(formData, input);
  const validation = validateLabInput({ ...input, status });

  if (Object.keys(validation.fieldErrors).length > 0) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: validation.fieldErrors,
    };
  }

  if (await isLabSlugTaken(input.slug)) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: { slug: "This slug is already in use." },
    };
  }

  const publishedAt = resolveLabPublishedAt(status);
  const insertPayload = buildLabInsertPayload({
    input,
    status,
    publishedAt,
  });

  const { data, error } = await supabase
    .from("labs")
    .insert(insertPayload)
    .select(
      "id, slug, title, description, featured_image, published_at, status",
    )
    .single();

  if (error) {
    logSafeDbError("createLab:insert", user.id, {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (isRlsError(error)) {
      return {
        message: formatDevErrorMessage(error, labInsertRlsMessage()),
      };
    }

    return {
      message: formatDevErrorMessage(
        error,
        "Unable to create lab. Please try again.",
      ),
    };
  }

  await notifySubscribersOfNewlyPublicContent({
    contentType: "lab",
    previous: null,
    next: data,
  });

  revalidateLabPaths(data.slug);
  redirect("/admin/labs");
}

export async function updateLab(
  labId: string,
  _prevState: LabActionState,
  formData: FormData,
): Promise<LabActionState> {
  const auth = await getAuthenticatedServerClient("updateLab");

  if (!auth.ok) {
    return { message: auth.error };
  }

  const existing = await getAdminLabById(labId);
  if (!existing) {
    return { message: "Lab not found." };
  }

  const input = parseLabFormData(formData);
  const status = resolveLabSubmitStatus(formData, input);
  const validation = validateLabInput({ ...input, status });

  if (Object.keys(validation.fieldErrors).length > 0) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: validation.fieldErrors,
    };
  }

  if (await isLabSlugTaken(input.slug, labId)) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: { slug: "This slug is already in use." },
    };
  }

  const publishedAt = resolveLabPublishedAt(status, existing.published_at);
  const updatePayload = buildLabUpdatePayload({
    input,
    status,
    publishedAt,
  });

  const { data, error } = await auth.supabase
    .from("labs")
    .update(updatePayload)
    .eq("id", labId)
    .select(
      "id, slug, title, description, featured_image, published_at, status",
    )
    .single();

  if (error) {
    logSafeDbError("updateLab:update", auth.user.id, {
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

  await notifySubscribersOfNewlyPublicContent({
    contentType: "lab",
    previous: {
      status: existing.status,
      published_at: existing.published_at,
    },
    next: data,
  });

  revalidateLabPaths(data.slug);
  if (existing.slug !== data.slug) {
    revalidatePath(`/cyber-lab/${existing.slug}`);
  }

  redirect("/admin/labs?success=updated");
}

export async function deleteLab(
  labId: string,
): Promise<{ error?: string }> {
  const auth = await getAuthenticatedServerClient("deleteLab");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const existing = await getAdminLabById(labId);
  if (!existing) {
    return { error: "Lab not found." };
  }

  const { error } = await auth.supabase
    .from("labs")
    .delete()
    .eq("id", labId);

  if (error) {
    logSafeDbError("deleteLab", auth.user.id, {
      code: error.code,
      message: error.message,
    });
    return { error: "Unable to delete lab. Please try again." };
  }

  revalidateLabPaths(existing.slug);
  return {};
}
