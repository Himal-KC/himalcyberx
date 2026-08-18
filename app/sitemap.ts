import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";
import { getPublishedArticleSlugs } from "@/lib/supabase/public-articles";
import { getPublishedLabSlugs } from "@/lib/supabase/public-labs";
import { getPublishedTutorialSlugs } from "@/lib/supabase/public-tutorials";

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
  { path: "/search", changeFrequency: "weekly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const lastModified = new Date();

  const [articleSlugs, labSlugs, tutorialSlugs] = await Promise.all([
    getPublishedArticleSlugs(),
    getPublishedLabSlugs(),
    getPublishedTutorialSlugs(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const articleEntries: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${baseUrl}/articles/${slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const labEntries: MetadataRoute.Sitemap = labSlugs.map((slug) => ({
    url: `${baseUrl}/cyber-lab/${slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const tutorialEntries: MetadataRoute.Sitemap = tutorialSlugs.map((slug) => ({
    url: `${baseUrl}/tutorials/${slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    ...staticEntries,
    ...articleEntries,
    ...labEntries,
    ...tutorialEntries,
  ];
}
