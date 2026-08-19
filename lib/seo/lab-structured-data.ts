import {
  buildBreadcrumbStructuredData,
  buildTechArticleStructuredData,
} from "@/lib/seo/structured-data-helpers";
import { labPath, type PublicLabDetail } from "@/lib/supabase/public-labs";

export function buildLabStructuredData(
  lab: PublicLabDetail,
): Record<string, unknown> {
  return buildTechArticleStructuredData({
    title: lab.title,
    description: lab.description,
    canonicalPath: labPath(lab.slug),
    featuredImage: lab.featured_image,
    publishedAt: lab.published_at,
    updatedAt: lab.updated_at,
    category: lab.category,
    difficulty: lab.difficulty,
    estimatedTime: lab.estimated_time,
  });
}

export function buildLabBreadcrumbStructuredData(
  lab: PublicLabDetail,
): Record<string, unknown> {
  return buildBreadcrumbStructuredData([
    { name: "Home", path: "/" },
    { name: "Cyber Lab", path: "/cyber-lab" },
    { name: lab.title, path: labPath(lab.slug) },
  ]);
}
