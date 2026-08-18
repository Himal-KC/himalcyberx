import type { SupabaseClient } from "@supabase/supabase-js";

export const ARTICLE_IMAGES_BUCKET = "article-images";

export const MAX_ARTICLE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_ARTICLE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedArticleImageType = (typeof ALLOWED_ARTICLE_IMAGE_TYPES)[number];

export const ARTICLE_IMAGE_TYPE_ERROR =
  "Image must be JPEG, PNG or WebP.";

export const ARTICLE_IMAGE_SIZE_ERROR = "Image must be smaller than 5 MB.";

export interface ArticleImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateArticleImageFile(file: File): ArticleImageValidationResult {
  if (
    !ALLOWED_ARTICLE_IMAGE_TYPES.includes(file.type as AllowedArticleImageType)
  ) {
    return { valid: false, error: ARTICLE_IMAGE_TYPE_ERROR };
  }

  if (file.size > MAX_ARTICLE_IMAGE_SIZE_BYTES) {
    return { valid: false, error: ARTICLE_IMAGE_SIZE_ERROR };
  }

  return { valid: true };
}

export function sanitizeArticleImageFilename(filename: string): string {
  const trimmed = filename.trim().toLowerCase();
  const lastDot = trimmed.lastIndexOf(".");
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  const extension = lastDot > 0 ? trimmed.slice(lastDot) : "";

  const safeBase = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const safeExtension = extension.replace(/[^a-z0-9.]/g, "").slice(0, 10);

  return `${safeBase || "image"}${safeExtension || ".jpg"}`;
}

export function buildImageStoragePath(
  folder: "articles" | "labs" | "tutorials",
  filename: string,
): string {
  const sanitized = sanitizeArticleImageFilename(filename);
  return `${folder}/${Date.now()}-${sanitized}`;
}

export function buildArticleImageStoragePath(filename: string): string {
  return buildImageStoragePath("articles", filename);
}

export function buildLabImageStoragePath(filename: string): string {
  return buildImageStoragePath("labs", filename);
}

export function formatArticleImageFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface UploadedArticleImage {
  publicUrl: string;
  storagePath: string;
  filename: string;
  fileSize: number;
}

export async function uploadImage(
  supabase: SupabaseClient,
  file: File,
  folder: "articles" | "labs" | "tutorials" = "articles",
): Promise<{ data?: UploadedArticleImage; error?: string }> {
  const validation = validateArticleImageFile(file);
  if (!validation.valid) {
    return { error: validation.error };
  }

  const storagePath = buildImageStoragePath(folder, file.name);
  const { error: uploadError } = await supabase.storage
    .from(ARTICLE_IMAGES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return {
      error: uploadError.message || "Unable to upload image. Please try again.",
    };
  }

  const { data } = supabase.storage
    .from(ARTICLE_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  return {
    data: {
      publicUrl: data.publicUrl,
      storagePath,
      filename: file.name,
      fileSize: file.size,
    },
  };
}

export async function uploadArticleImage(
  supabase: SupabaseClient,
  file: File,
): Promise<{ data?: UploadedArticleImage; error?: string }> {
  return uploadImage(supabase, file, "articles");
}

export async function uploadLabImage(
  supabase: SupabaseClient,
  file: File,
): Promise<{ data?: UploadedArticleImage; error?: string }> {
  return uploadImage(supabase, file, "labs");
}

export async function uploadTutorialImage(
  supabase: SupabaseClient,
  file: File,
): Promise<{ data?: UploadedArticleImage; error?: string }> {
  return uploadImage(supabase, file, "tutorials");
}

export function extractArticleImageStoragePath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${ARTICLE_IMAGES_BUCKET}/`;
    const index = url.pathname.indexOf(marker);
    if (index === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}
export async function deleteArticleImage(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<void> {
  if (!storagePath) {
    return;
  }

  await supabase.storage.from(ARTICLE_IMAGES_BUCKET).remove([storagePath]);
}
