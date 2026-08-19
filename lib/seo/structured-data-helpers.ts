import { DEFAULT_SITE_SETTINGS } from "@/lib/settings/constants";
import { toAbsoluteUrl } from "@/lib/seo/json-ld";
import { organizationStructuredDataId } from "@/lib/seo/site-structured-data";
import { getSiteUrl } from "@/lib/seo/site-url";

type ContentDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface TechArticleStructuredDataInput {
  title: string;
  description: string;
  canonicalPath: string;
  featuredImage: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  category: string;
  difficulty: ContentDifficulty;
  estimatedTime: string | null;
}

export function buildAuthorPerson(siteUrl: string): Record<string, unknown> {
  return {
    "@type": "Person",
    name: DEFAULT_SITE_SETTINGS.publicAuthorName,
    url: toAbsoluteUrl("/about", siteUrl),
  };
}

export function buildOrganizationPublisherReference(
  siteUrl: string,
): Record<string, unknown> {
  return {
    "@id": organizationStructuredDataId(siteUrl),
  };
}

export function mapEducationalLevel(
  difficulty: ContentDifficulty,
): string {
  return difficulty;
}

/**
 * Converts common admin-entered time labels (e.g. "45 min") to ISO 8601 duration.
 * Returns undefined when the value cannot be parsed confidently.
 */
export function parseTimeRequired(
  estimatedTime: string | null | undefined,
): string | undefined {
  if (!estimatedTime?.trim()) {
    return undefined;
  }

  const normalized = estimatedTime.trim().toLowerCase();

  const combined = normalized.match(
    /^(\d+)\s*(?:h|hr|hrs|hour|hours)\s*(\d+)\s*(?:m|min|mins|minute|minutes)$/,
  );
  if (combined) {
    return `PT${combined[1]}H${combined[2]}M`;
  }

  const hours = normalized.match(/^(\d+)\s*(?:h|hr|hrs|hour|hours)$/);
  if (hours) {
    return `PT${hours[1]}H`;
  }

  const minutes = normalized.match(/^(\d+)\s*(?:m|min|mins|minute|minutes)$/);
  if (minutes) {
    return `PT${minutes[1]}M`;
  }

  return undefined;
}

export function buildTechArticleStructuredData(
  input: TechArticleStructuredDataInput,
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}${input.canonicalPath}`;
  const imageUrl = toAbsoluteUrl(input.featuredImage, siteUrl);
  const timeRequired = parseTimeRequired(input.estimatedTime);

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": canonicalUrl,
    headline: input.title,
    description: input.description,
    author: buildAuthorPerson(siteUrl),
    publisher: buildOrganizationPublisherReference(siteUrl),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    about: {
      "@type": "Thing",
      name: input.category,
    },
    educationalLevel: mapEducationalLevel(input.difficulty),
  };

  if (input.publishedAt) {
    structuredData.datePublished = input.publishedAt;
  }

  const dateModified = input.updatedAt || input.publishedAt;
  if (dateModified) {
    structuredData.dateModified = dateModified;
  }

  if (imageUrl) {
    structuredData.image = [imageUrl];
  }

  if (timeRequired) {
    structuredData.timeRequired = timeRequired;
  }

  return structuredData;
}

export function buildBreadcrumbStructuredData(
  items: Array<{ name: string; path: string }>,
): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}
