import { formatArticleDate } from "@/lib/articles";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { Tutorial, TutorialDifficulty } from "@/lib/supabase/types";

const PUBLISHED = "published" as const;

export function normalizeTutorialSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).trim().toLowerCase();
  } catch {
    return slug.trim().toLowerCase();
  }
}

export interface PublicTutorialCard {
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: TutorialDifficulty;
  estimated_time: string | null;
  featured: boolean;
  featured_image: string | null;
  published_at: string | null;
  publishedAtFormatted: string;
}

export interface PublicTutorialDetail extends PublicTutorialCard {
  requirements: string | null;
  introduction: string | null;
  instructions: string | null;
  key_takeaways: string | null;
  security_notes: string | null;
}

function mapPublicTutorialCard(row: Tutorial): PublicTutorialCard {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    estimated_time: row.estimated_time,
    featured: row.featured,
    featured_image: row.featured_image,
    published_at: row.published_at,
    publishedAtFormatted: row.published_at
      ? formatArticleDate(row.published_at)
      : "",
  };
}

function mapPublicTutorialDetail(row: Tutorial): PublicTutorialDetail {
  return {
    ...mapPublicTutorialCard(row),
    requirements: row.requirements,
    introduction: row.introduction,
    instructions: row.instructions,
    key_takeaways: row.key_takeaways,
    security_notes: row.security_notes,
  };
}

export async function getPublishedTutorials(): Promise<PublicTutorialCard[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tutorials")
      .select(
        "slug, title, description, category, difficulty, estimated_time, featured, featured_image, published_at, status",
      )
      .eq("status", PUBLISHED)
      .order("published_at", { ascending: false, nullsFirst: false });

    if (error) {
      logQueryError("getPublishedTutorials", error);
      return [];
    }

    return ((data ?? []) as Tutorial[]).map(mapPublicTutorialCard);
  } catch {
    return [];
  }
}

export async function getFeaturedTutorials(): Promise<PublicTutorialCard[]> {
  const tutorials = await getPublishedTutorials();
  return tutorials.filter((tutorial) => tutorial.featured);
}

export async function getTutorialBySlug(
  slug: string,
): Promise<PublicTutorialDetail | null> {
  const requestedSlug = normalizeTutorialSlug(slug);

  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .eq("slug", requestedSlug)
      .eq("status", PUBLISHED)
      .maybeSingle();

    if (error) {
      logQueryError("getTutorialBySlug", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return mapPublicTutorialDetail(data as Tutorial);
  } catch {
    return null;
  }
}

export async function getPublishedTutorialSlugs(): Promise<string[]> {
  const tutorials = await getPublishedTutorials();
  return tutorials.map((tutorial) => tutorial.slug);
}

export function tutorialPath(slug: string): string {
  return `/tutorials/${slug}`;
}
