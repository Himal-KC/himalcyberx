import type { MetadataRoute } from "next";
import { getSitemapContentEntries } from "@/lib/sitemap/public-entries";
import type { SitemapContentEntry } from "@/lib/sitemap/timestamps";
import { getSiteUrl } from "@/lib/seo/site-url";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/news", changeFrequency: "daily", priority: 0.9 },
  { path: "/threats", changeFrequency: "daily", priority: 0.9 },
  { path: "/vulnerabilities", changeFrequency: "weekly", priority: 0.8 },
  { path: "/cyber-lab", changeFrequency: "weekly", priority: 0.9 },
  { path: "/forensics", changeFrequency: "weekly", priority: 0.8 },
  { path: "/tutorials", changeFrequency: "weekly", priority: 0.9 },
  { path: "/ai-security", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

function buildContentSitemapEntries(
  baseUrl: string,
  pathPrefix: string,
  entries: SitemapContentEntry[],
): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    url: `${baseUrl}${pathPrefix}/${entry.slug}`,
    ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
    changeFrequency: "weekly",
    priority: 0.8,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const { articles, labs, tutorials } = await getSitemapContentEntries();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  return [
    ...staticEntries,
    ...buildContentSitemapEntries(baseUrl, "/articles", articles),
    ...buildContentSitemapEntries(baseUrl, "/cyber-lab", labs),
    ...buildContentSitemapEntries(baseUrl, "/tutorials", tutorials),
  ];
}
