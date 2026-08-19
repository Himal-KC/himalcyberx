import type { Metadata } from "next";
import { DEFAULT_SITE_SETTINGS } from "@/lib/settings/constants";
import type { PublicSiteSettings } from "@/lib/settings/site-settings";
import { toAbsoluteUrl } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";

export function buildRootMetadata(settings: PublicSiteSettings): Metadata {
  const siteName = settings.siteName || DEFAULT_SITE_SETTINGS.siteName;
  const defaultTitle =
    settings.seoTitle ||
    `${siteName} — ${settings.siteTagline || DEFAULT_SITE_SETTINGS.siteTagline}`;
  const description =
    settings.seoDescription || DEFAULT_SITE_SETTINGS.seoDescription;
  const keywords = settings.seoKeywords.trim();
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`,
    },
    description,
    ...(keywords
      ? { keywords: keywords.split(",").map((keyword) => keyword.trim()) }
      : {}),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName,
      title: defaultTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const siteUrl = getSiteUrl();

  return {
    title,
    description,
    ...(path
      ? {
          alternates: {
            canonical: `${siteUrl}${path}`,
          },
        }
      : {}),
    openGraph: {
      title,
      description,
      ...(path ? { url: `${siteUrl}${path}` } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export function buildContentMetadata({
  title,
  description,
  path,
  imageUrl,
}: {
  title: string;
  description: string;
  path: string;
  imageUrl?: string | null;
}): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path}`;
  const absoluteImageUrl = toAbsoluteUrl(imageUrl, siteUrl);
  const images = absoluteImageUrl
    ? [{ url: absoluteImageUrl, alt: title }]
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: absoluteImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(absoluteImageUrl ? { images: [absoluteImageUrl] } : {}),
    },
  };
}

export function buildTechArticleMetadata({
  title,
  description,
  path,
  imageUrl,
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  path: string;
  imageUrl?: string | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
}): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path}`;
  const absoluteImageUrl = toAbsoluteUrl(imageUrl, siteUrl);
  const images = absoluteImageUrl
    ? [{ url: absoluteImageUrl, alt: title }]
    : undefined;
  const authorName = DEFAULT_SITE_SETTINGS.publicAuthorName;
  const modified = modifiedTime || publishedTime || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    authors: [{ name: authorName }],
    openGraph: {
      type: "article",
      title,
      description,
      url,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modified ? { modifiedTime: modified } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(absoluteImageUrl ? { images: [absoluteImageUrl] } : {}),
    },
  };
}

export function buildArticleMetadata({
  title,
  description,
  path,
  imageUrl,
  author,
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  path: string;
  imageUrl?: string | null;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path}`;
  const absoluteImageUrl = toAbsoluteUrl(imageUrl, siteUrl);
  const images = absoluteImageUrl
    ? [{ url: absoluteImageUrl, alt: title }]
    : undefined;
  const modified = modifiedTime || publishedTime;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    authors: [{ name: author }],
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime,
      modifiedTime: modified,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: absoluteImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(absoluteImageUrl ? { images: [absoluteImageUrl] } : {}),
    },
  };
}
