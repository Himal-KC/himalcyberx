import {
  DEFAULT_ARTICLE_AUTHOR,
  isAuthorEmail,
} from "@/lib/articles/author";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export const ARTICLE_STATUSES = ["draft", "published", "archived"] as const;

export type ArticleFormStatus = (typeof ARTICLE_STATUSES)[number];

export interface ArticleFormInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  categoryId: string;
  status: ArticleFormStatus;
  featured: boolean;
  featured_image: string;
  publishedAt: string;
}

export interface ArticleValidationResult {
  fieldErrors: Record<string, string>;
  values: ArticleFormInput;
}

export function parseArticleFormData(formData: FormData): ArticleFormInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    author: String(formData.get("author") ?? DEFAULT_ARTICLE_AUTHOR).trim(),
    categoryId: String(formData.get("category_id") ?? "").trim(),
    status: String(formData.get("status") ?? "draft").trim() as ArticleFormStatus,
    featured: formData.get("featured") === "on",
    featured_image: String(formData.get("featured_image") ?? "").trim(),
    publishedAt: String(formData.get("published_at") ?? "").trim(),
  };
}

export function validateArticleInput(
  input: ArticleFormInput,
  options?: { requireCategory?: boolean },
): ArticleValidationResult {
  const fieldErrors: Record<string, string> = {};

  if (input.title.length < 8) {
    fieldErrors.title = "Title must be at least 8 characters.";
  }

  if (!input.slug) {
    fieldErrors.slug = "Slug is required.";
  } else if (!isValidSlug(input.slug)) {
    fieldErrors.slug =
      "Slug must be lowercase, use hyphens, and contain only letters and numbers.";
  }

  if (input.excerpt.length < 20) {
    fieldErrors.excerpt = "Excerpt must be at least 20 characters.";
  }

  if (input.content.length < 100) {
    fieldErrors.content = "Content must be at least 100 characters.";
  }

  if (input.status === "published" && !input.author) {
    fieldErrors.author = "Author is required when publishing.";
  } else if (input.author && isAuthorEmail(input.author)) {
    fieldErrors.author = "Use a display name instead of an email address.";
  }

  if (!ARTICLE_STATUSES.includes(input.status)) {
    fieldErrors.status = "Status must be draft, published, or archived.";
  }

  if (options?.requireCategory && !input.categoryId) {
    fieldErrors.category_id = "Please select a category.";
  }

  if (
    input.featured_image &&
    !/^https?:\/\/.+/i.test(input.featured_image)
  ) {
    fieldErrors.featured_image = "Featured image URL must be a valid URL.";
  }

  return { fieldErrors, values: input };
}

export function resolveSubmitStatus(
  formData: FormData,
  input: ArticleFormInput,
): ArticleFormStatus {
  const intent = String(formData.get("intent") ?? "");

  if (intent === "draft") {
    return "draft";
  }

  if (intent === "publish") {
    return "published";
  }

  return input.status;
}

export function resolvePublishedAt(
  status: ArticleFormStatus,
  publishedAtInput: string,
  existingPublishedAt?: string | null,
): string | null {
  if (status === "draft") {
    return publishedAtInput || null;
  }

  if (publishedAtInput) {
    return new Date(publishedAtInput).toISOString();
  }

  if (existingPublishedAt) {
    return existingPublishedAt;
  }

  if (status === "published") {
    return new Date().toISOString();
  }

  return null;
}
