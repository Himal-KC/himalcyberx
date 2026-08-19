export interface ArticleSeoSource {
  title: string;
  excerpt: string;
  seo_title?: string | null;
  seo_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  featured_image_alt?: string | null;
}

export interface ResolvedArticleSeo {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  imageAlt: string;
  usesTitleFallback: boolean;
  usesExcerptFallback: boolean;
  usesOgTitleFallback: boolean;
  usesOgDescriptionFallback: boolean;
  usesImageAltFallback: boolean;
}

export function resolveArticleSeo(source: ArticleSeoSource): ResolvedArticleSeo {
  const metaTitle = source.seo_title?.trim() || source.title.trim();
  const metaDescription = source.seo_description?.trim() || source.excerpt.trim();
  const ogTitle =
    source.og_title?.trim() || source.seo_title?.trim() || source.title.trim();
  const ogDescription =
    source.og_description?.trim() ||
    source.seo_description?.trim() ||
    source.excerpt.trim();
  const imageAlt = source.featured_image_alt?.trim() || source.title.trim();

  return {
    metaTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    imageAlt,
    usesTitleFallback: !source.seo_title?.trim(),
    usesExcerptFallback: !source.seo_description?.trim(),
    usesOgTitleFallback: !source.og_title?.trim(),
    usesOgDescriptionFallback: !source.og_description?.trim(),
    usesImageAltFallback: !source.featured_image_alt?.trim(),
  };
}
