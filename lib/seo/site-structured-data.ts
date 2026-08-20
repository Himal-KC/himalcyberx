import { DEFAULT_SITE_SETTINGS } from "@/lib/settings/constants";
import { getSiteUrl } from "@/lib/seo/site-url";

const ORGANIZATION_NAME = DEFAULT_SITE_SETTINGS.siteName;

export function organizationStructuredDataId(siteUrl: string): string {
  return `${siteUrl}/#organization`;
}

function organizationId(siteUrl: string): string {
  return organizationStructuredDataId(siteUrl);
}

function websiteId(siteUrl: string): string {
  return `${siteUrl}/#website`;
}

function homepageUrl(siteUrl: string): string {
  return `${siteUrl}/`;
}

export function buildOrganizationStructuredData(): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(siteUrl),
    name: ORGANIZATION_NAME,
    url: homepageUrl(siteUrl),
  };
}

export function buildWebSiteStructuredData(): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(siteUrl),
    name: ORGANIZATION_NAME,
    url: homepageUrl(siteUrl),
    publisher: {
      "@id": organizationId(siteUrl),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
