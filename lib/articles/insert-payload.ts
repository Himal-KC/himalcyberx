import type {
  ArticleFormInput,
  ArticleFormStatus,
} from "@/lib/articles/validation";
import type { ArticleInsert } from "@/lib/supabase/types";

function optionalText(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

export function buildArticleInsertPayload({
  input,
  status,
  publishedAt,
  author,
}: {
  input: ArticleFormInput;
  status: ArticleFormStatus;
  publishedAt: string | null;
  author: string;
}): ArticleInsert {
  const payload: ArticleInsert = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    author,
    status,
    featured: input.featured,
    content_type: "real",
  };

  if (input.categoryId) {
    payload.category_id = input.categoryId;
  }

  if (publishedAt) {
    payload.published_at = publishedAt;
  }

  if (input.featured_image) {
    payload.featured_image = input.featured_image;
  }

  const featuredImageAlt = optionalText(input.featured_image_alt);
  if (featuredImageAlt) {
    payload.featured_image_alt = featuredImageAlt;
  }

  const seoTitle = optionalText(input.seo_title);
  if (seoTitle) {
    payload.seo_title = seoTitle;
  }

  const seoDescription = optionalText(input.seo_description);
  if (seoDescription) {
    payload.seo_description = seoDescription;
  }

  const ogTitle = optionalText(input.og_title);
  if (ogTitle) {
    payload.og_title = ogTitle;
  }

  const ogDescription = optionalText(input.og_description);
  if (ogDescription) {
    payload.og_description = ogDescription;
  }

  return payload;
}

export function buildArticleUpdateFields(input: ArticleFormInput): {
  featured_image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
} {
  return {
    featured_image_alt: optionalText(input.featured_image_alt),
    seo_title: optionalText(input.seo_title),
    seo_description: optionalText(input.seo_description),
    og_title: optionalText(input.og_title),
    og_description: optionalText(input.og_description),
  };
}
