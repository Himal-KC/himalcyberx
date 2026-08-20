import { articlePath } from "@/lib/articles";
import { toAbsoluteUrl } from "@/lib/seo/json-ld";
import { buildOrganizationPublisherReference } from "@/lib/seo/structured-data-helpers";
import { getSiteUrl } from "@/lib/seo/site-url";
import type { PublicArticleCard } from "@/lib/supabase/public-articles";

export function buildArticleStructuredData(
  article: PublicArticleCard,
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}${articlePath(article.slug)}`;
  const imageUrl = toAbsoluteUrl(article.featured_image, siteUrl);
  const dateModified = article.updatedAtIso || article.publishedAtIso;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAtIso,
    dateModified,
    author: {
      "@type": "Person",
      name: article.author,
      url: toAbsoluteUrl("/about", siteUrl),
    },
    publisher: buildOrganizationPublisherReference(siteUrl),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  if (imageUrl) {
    structuredData.image = [imageUrl];
  }

  return structuredData;
}

export function buildArticleBreadcrumbStructuredData(
  article: PublicArticleCard,
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}${articlePath(article.slug)}`;

  const items: Array<Record<string, unknown>> = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${siteUrl}/`,
    },
  ];

  if (article.category && article.categoryHref) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: article.category,
      item: `${siteUrl}${article.categoryHref}`,
    });
  }

  items.push({
    "@type": "ListItem",
    position: items.length + 1,
    name: article.title,
    item: canonicalUrl,
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}
