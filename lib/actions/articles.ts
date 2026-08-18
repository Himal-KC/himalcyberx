"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildArticleInsertPayload } from "@/lib/articles/insert-payload";
import { resolveStoredArticleAuthor } from "@/lib/articles/author";
import {
  parseArticleFormData,
  resolvePublishedAt,
  resolveSubmitStatus,
  validateArticleInput,
} from "@/lib/articles/validation";
import { getAuthClaims } from "@/lib/supabase/auth";
import {
  getAdminArticleById,
  isArticleSlugTaken,
} from "@/lib/supabase/admin-articles";
import {
  formatDevErrorMessage,
  getAuthenticatedServerClient,
  isDevelopment,
  logSafeDbError,
} from "@/lib/supabase/admin-session";
import { isRlsError } from "@/lib/supabase/errors";
import {
  deleteArticleImage,
  extractArticleImageStoragePath,
} from "@/lib/storage/article-images";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArticleUpdate } from "@/lib/supabase/types";

type ArticleUpdatePayload = ArticleUpdate;

export interface ArticleActionState {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function revalidateArticlePaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/articles");
  revalidatePath("/admin/articles/new");
  revalidatePath("/news");
  revalidatePath("/threats");
  revalidatePath("/ai-security");
  revalidatePath("/search");
  if (slug) {
    revalidatePath(`/articles/${slug}`);
  }
}

function articleInsertRlsMessage(): string {
  return 'Insert blocked by Row Level Security. Apply the policy in supabase/admin-policies.sql: "Authenticated users can insert articles" on public.articles for the authenticated role.';
}

export async function createArticle(
  _prevState: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const claims = await getAuthClaims();
  const auth = await getAuthenticatedServerClient("createArticle", {
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

  const input = parseArticleFormData(formData);
  const status = resolveSubmitStatus(formData, input);
  const validation = validateArticleInput({ ...input, status });

  if (Object.keys(validation.fieldErrors).length > 0) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: validation.fieldErrors,
    };
  }

  if (await isArticleSlugTaken(input.slug)) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: { slug: "This slug is already in use." },
    };
  }

  const publishedAt = resolvePublishedAt(status, input.publishedAt);
  const author = resolveStoredArticleAuthor(input.author);
  const insertPayload = buildArticleInsertPayload({
    input,
    status,
    publishedAt,
    author,
  });

  const { data, error } = await supabase
    .from("articles")
    .insert(insertPayload)
    .select("id, slug")
    .single();

  if (error) {
    logSafeDbError("createArticle:insert", user.id, {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (isRlsError(error)) {
      return {
        message: formatDevErrorMessage(error, articleInsertRlsMessage()),
      };
    }

    return {
      message: formatDevErrorMessage(
        error,
        "Unable to create article. Please try again.",
      ),
    };
  }

  revalidateArticlePaths(data.slug);
  redirect("/admin/articles");
}

export async function updateArticle(
  articleId: string,
  _prevState: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const auth = await getAuthenticatedServerClient("updateArticle");

  if (!auth.ok) {
    return { message: auth.error };
  }

  const existing = await getAdminArticleById(articleId);
  if (!existing) {
    return { message: "Article not found." };
  }

  const input = parseArticleFormData(formData);
  const categoriesAvailable =
    String(formData.get("categories_available") ?? "") === "true";
  const validation = validateArticleInput(input, {
    requireCategory: categoriesAvailable,
  });

  if (Object.keys(validation.fieldErrors).length > 0) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: validation.fieldErrors,
    };
  }

  if (await isArticleSlugTaken(input.slug, articleId)) {
    return {
      message: "Please correct the errors below.",
      fieldErrors: { slug: "This slug is already in use." },
    };
  }

  const publishedAt = resolvePublishedAt(
    input.status,
    input.publishedAt,
    existing.published_at,
  );

  const author = resolveStoredArticleAuthor(input.author);

  const updatePayload: ArticleUpdatePayload = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    author,
    category_id: input.categoryId || null,
    status: input.status,
    featured: input.featured,
    featured_image: input.featured_image || null,
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await auth.supabase
    .from("articles")
    .update(updatePayload)
    .eq("id", articleId)
    .select("slug")
    .single();

  if (error) {
    logSafeDbError("updateArticle", auth.user.id, {
      code: error.code,
      message: error.message,
    });

    return {
      message: formatDevErrorMessage(
        error,
        "Unable to update article. Please try again.",
      ),
    };
  }

  revalidateArticlePaths(data.slug);
  if (existing.slug !== data.slug) {
    revalidatePath(`/articles/${existing.slug}`);
  }

  redirect("/admin/articles?success=updated");
}

async function removeArticleFeaturedImage(
  featuredImage: string | null,
  supabase: SupabaseClient,
): Promise<void> {
  if (!featuredImage) {
    return;
  }

  const storagePath = extractArticleImageStoragePath(featuredImage);
  if (!storagePath || !storagePath.startsWith("articles/")) {
    return;
  }

  await deleteArticleImage(supabase, storagePath);
}

export async function deleteArticle(
  articleId: string,
): Promise<{ error?: string }> {
  const auth = await getAuthenticatedServerClient("deleteArticle");

  if (!auth.ok) {
    return { error: auth.error };
  }

  const existing = await getAdminArticleById(articleId);
  if (!existing) {
    return { error: "Article not found." };
  }

  const { error } = await auth.supabase
    .from("articles")
    .delete()
    .eq("id", articleId);

  if (error) {
    logSafeDbError("deleteArticle", auth.user.id, {
      code: error.code,
      message: error.message,
    });

    return { error: "Unable to delete article. Please try again." };
  }

  await removeArticleFeaturedImage(existing.featured_image, auth.supabase);

  revalidateArticlePaths(existing.slug);
  revalidatePath("/admin/articles");
  return {};
}
