import "server-only";

import type {
  ArticleInventoryItem,
  CategoryInventoryItem,
  LabInventoryItem,
  SiteContentInventory,
  TutorialInventoryItem,
} from "@/lib/agent/types";
import { getAdminArticles } from "@/lib/supabase/admin-articles";
import { getAdminCategories } from "@/lib/supabase/admin-categories";
import { getAdminLabs } from "@/lib/supabase/admin-labs";
import { getAdminTutorials } from "@/lib/supabase/admin-tutorials";
import type { AdminArticleRow, Lab, Tutorial } from "@/lib/supabase/types";

function mapArticleRow(row: AdminArticleRow): ArticleInventoryItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    status: row.status,
    content: row.content,
    publishedAt: row.published_at,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    seoKeywords: row.seo_keywords,
  };
}

function mapTutorialRow(row: Tutorial): TutorialInventoryItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    status: row.status,
    requirements: row.requirements,
    introduction: row.introduction,
    instructions: row.instructions,
    keyTakeaways: row.key_takeaways,
    securityNotes: row.security_notes,
    publishedAt: row.published_at,
  };
}

function mapLabRow(row: Lab): LabInventoryItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    status: row.status,
    learningObjectives: row.learning_objectives,
    requirementsTools: row.requirements_tools,
    introduction: row.introduction,
    instructions: row.instructions,
    expectedResult: row.expected_result,
    securityNotes: row.security_notes,
    publishedAt: row.published_at,
  };
}

function mapCategoryRow(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}): CategoryInventoryItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

/**
 * Loads full admin-visible content inventory (draft + published).
 * Must only be called from authenticated admin server contexts.
 */
export async function loadSiteContentInventory(): Promise<SiteContentInventory> {
  const [articles, tutorials, labs, categories] = await Promise.all([
    getAdminArticles(),
    getAdminTutorials(),
    getAdminLabs(),
    getAdminCategories(),
  ]);

  return {
    articles: articles.map(mapArticleRow),
    tutorials: tutorials.map(mapTutorialRow),
    labs: labs.map(mapLabRow),
    categories: categories.map(mapCategoryRow),
  };
}
