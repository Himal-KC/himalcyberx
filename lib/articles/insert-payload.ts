import type {
  ArticleFormInput,
  ArticleFormStatus,
} from "@/lib/articles/validation";
import type { ArticleInsert } from "@/lib/supabase/types";

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

  return payload;
}
