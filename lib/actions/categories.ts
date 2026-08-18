"use server";

import { revalidatePath } from "next/cache";
import {
  parseCategoryFormData,
  validateCategoryInput,
} from "@/lib/categories/validation";
import { getAuthClaims } from "@/lib/supabase/auth";
import {
  countArticlesByCategoryId,
  getAdminCategoryById,
  isCategorySlugTaken,
} from "@/lib/supabase/admin-categories";
import {
  formatDevErrorMessage,
  getAuthenticatedServerClient,
  isDevelopment,
  logAdminAuthDebug,
} from "@/lib/supabase/admin-session";
import { isRlsError } from "@/lib/supabase/errors";

export interface CategoryActionState {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/articles/new");
  revalidatePath("/admin/articles");
}

function rlsMessage(operation: "insert" | "update" | "delete"): string {
  const policies: Record<typeof operation, string> = {
    insert: '"Authenticated users can insert categories"',
    update: '"Authenticated users can update categories"',
    delete: '"Authenticated users can delete categories"',
  };

  return `${operation.charAt(0).toUpperCase()}${operation.slice(1)} blocked by Row Level Security. Review and apply the policy in supabase/admin-policies.sql: ${policies[operation]} on public.categories for the authenticated role.`;
}

export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const claims = await getAuthClaims();
  const auth = await getAuthenticatedServerClient("createCategory", {
    getClaimsHasSub: Boolean(claims?.sub),
  });

  if (!auth.ok) {
    if (isDevelopment() && auth.authErrorMessage) {
      return {
        message: `${auth.error} (${auth.authErrorMessage})`,
      };
    }

    return { message: auth.error };
  }

  const { supabase, user } = auth;

  const input = parseCategoryFormData(formData);
  const fieldErrors = validateCategoryInput(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Please correct the errors below.",
      fieldErrors,
    };
  }

  if (await isCategorySlugTaken(input.slug)) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: { slug: "This slug is already in use." },
    };
  }

  const { error } = await supabase.from("categories").insert({
    name: input.name,
    slug: input.slug,
    description: input.description || null,
  });

  if (error) {
    logAdminAuthDebug("createCategory:insert", {
      hasUser: true,
      userId: user.id,
      dbErrorCode: error.code,
      dbErrorMessage: error.message,
    });

    if (isRlsError(error)) {
      return {
        message: formatDevErrorMessage(error, rlsMessage("insert")),
      };
    }

    return {
      message: formatDevErrorMessage(
        error,
        "Unable to create category. Please try again.",
      ),
    };
  }

  revalidateCategoryPaths();
  return { success: true };
}

export async function updateCategory(
  categoryId: string,
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const auth = await getAuthenticatedServerClient("updateCategory");
  if (!auth.ok) {
    return { message: auth.error };
  }

  const { supabase } = auth;

  const existing = await getAdminCategoryById(categoryId);
  if (!existing) {
    return { message: "Category not found." };
  }

  const input = parseCategoryFormData(formData);
  const fieldErrors = validateCategoryInput(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Please correct the errors below.",
      fieldErrors,
    };
  }

  if (await isCategorySlugTaken(input.slug, categoryId)) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: { slug: "This slug is already in use." },
    };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    if (isRlsError(error)) {
      return { message: rlsMessage("update") };
    }

    console.error("[updateCategory]", error.code, error.message);
    return { message: "Unable to save category. Please try again." };
  }

  revalidateCategoryPaths();
  return { success: true };
}

export async function deleteCategory(
  categoryId: string,
): Promise<{ error?: string }> {
  const auth = await getAuthenticatedServerClient("deleteCategory");
  if (!auth.ok) {
    return { error: auth.error };
  }

  const { supabase } = auth;

  const existing = await getAdminCategoryById(categoryId);
  if (!existing) {
    return { error: "Category not found." };
  }

  const articleCount = await countArticlesByCategoryId(categoryId);
  if (articleCount > 0) {
    return {
      error: `This category is assigned to ${articleCount} article${articleCount === 1 ? "" : "s"}. Reassign or remove those articles before deleting.`,
    };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    if (isRlsError(error)) {
      return { error: rlsMessage("delete") };
    }

    console.error("[deleteCategory]", error.code, error.message);
    return { error: "Unable to delete category. Please try again." };
  }

  revalidateCategoryPaths();
  return {};
}
