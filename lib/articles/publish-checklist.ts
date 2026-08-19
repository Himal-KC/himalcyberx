import { getArticleContentTextLength } from "@/lib/articles/content";
import { resolveArticleSeo } from "@/lib/articles/seo";

export interface PublishChecklistInput {
  title: string;
  excerpt: string;
  content: string;
  categoryId: string;
  featuredImage: string;
  featuredImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  categoriesAvailable: boolean;
}

export interface PublishChecklistItem {
  id: string;
  label: string;
  complete: boolean;
  detail?: string;
}

export function buildPublishChecklist(
  input: PublishChecklistInput,
): PublishChecklistItem[] {
  const seo = resolveArticleSeo({
    title: input.title,
    excerpt: input.excerpt,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
    og_title: input.ogTitle,
    og_description: input.ogDescription,
    featured_image_alt: input.featuredImageAlt,
  });

  const hasContent = getArticleContentTextLength(input.content) >= 100;
  const hasFeaturedImage = Boolean(input.featuredImage.trim());
  const hasAltText = Boolean(
    input.featuredImageAlt.trim() || input.title.trim(),
  );
  const hasSeoTitle = Boolean(seo.metaTitle.trim());
  const hasSeoDescription = Boolean(seo.metaDescription.trim());

  return [
    {
      id: "title",
      label: "Title present",
      complete: input.title.trim().length >= 8,
    },
    {
      id: "excerpt",
      label: "Excerpt present",
      complete: input.excerpt.trim().length >= 20,
    },
    {
      id: "content",
      label: "Content present",
      complete: hasContent,
    },
    {
      id: "category",
      label: "Category selected",
      complete: !input.categoriesAvailable || Boolean(input.categoryId.trim()),
    },
    {
      id: "featured-image",
      label: "Featured image present",
      complete: hasFeaturedImage,
    },
    {
      id: "alt-text",
      label: "Alt text present",
      complete: !hasFeaturedImage || hasAltText,
      detail: hasFeaturedImage && seo.usesImageAltFallback
        ? "Using article title as fallback"
        : undefined,
    },
    {
      id: "seo-title",
      label: "SEO title present or valid fallback",
      complete: hasSeoTitle,
      detail: seo.usesTitleFallback ? "Using article title" : undefined,
    },
    {
      id: "seo-description",
      label: "SEO description present or valid fallback",
      complete: hasSeoDescription,
      detail: seo.usesExcerptFallback ? "Using excerpt" : undefined,
    },
  ];
}

export function getPublishWarnings(input: PublishChecklistInput): string[] {
  return buildPublishChecklist(input)
    .filter((item) => !item.complete)
    .map((item) => item.label);
}

export function hasPublishWarnings(input: PublishChecklistInput): boolean {
  return getPublishWarnings(input).length > 0;
}

export function formatPublishWarningMessage(warnings: string[]): string {
  return [
    "Some recommended items are missing before publishing:",
    ...warnings.map((warning) => `• ${warning}`),
    "",
    "Publish anyway?",
  ].join("\n");
}
