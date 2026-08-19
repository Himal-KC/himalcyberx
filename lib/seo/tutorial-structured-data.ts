import {
  buildBreadcrumbStructuredData,
  buildTechArticleStructuredData,
} from "@/lib/seo/structured-data-helpers";
import {
  tutorialPath,
  type PublicTutorialDetail,
} from "@/lib/supabase/public-tutorials";

export function buildTutorialStructuredData(
  tutorial: PublicTutorialDetail,
): Record<string, unknown> {
  return buildTechArticleStructuredData({
    title: tutorial.title,
    description: tutorial.description,
    canonicalPath: tutorialPath(tutorial.slug),
    featuredImage: tutorial.featured_image,
    publishedAt: tutorial.published_at,
    updatedAt: tutorial.updated_at,
    category: tutorial.category,
    difficulty: tutorial.difficulty,
    estimatedTime: tutorial.estimated_time,
  });
}

export function buildTutorialBreadcrumbStructuredData(
  tutorial: PublicTutorialDetail,
): Record<string, unknown> {
  return buildBreadcrumbStructuredData([
    { name: "Home", path: "/" },
    { name: "Tutorials", path: "/tutorials" },
    { name: tutorial.title, path: tutorialPath(tutorial.slug) },
  ]);
}
