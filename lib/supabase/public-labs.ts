import { formatArticleDate } from "@/lib/articles";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { logQueryError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { Lab, LabDifficulty } from "@/lib/supabase/types";

const PUBLISHED = "published" as const;

export function normalizeLabSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).trim().toLowerCase();
  } catch {
    return slug.trim().toLowerCase();
  }
}

export interface PublicLabCard {
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: LabDifficulty;
  estimated_time: string | null;
  featured: boolean;
  featured_image: string | null;
  published_at: string | null;
  publishedAtFormatted: string;
}

export interface PublicLabDetail extends PublicLabCard {
  updated_at: string | null;
  learning_objectives: string | null;
  requirements_tools: string | null;
  introduction: string | null;
  instructions: string | null;
  expected_result: string | null;
  security_notes: string | null;
}

function mapPublicLabCard(row: Lab): PublicLabCard {
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

function mapPublicLabDetail(row: Lab): PublicLabDetail {
  return {
    ...mapPublicLabCard(row),
    updated_at: row.updated_at ?? null,
    learning_objectives: row.learning_objectives,
    requirements_tools: row.requirements_tools,
    introduction: row.introduction,
    instructions: row.instructions,
    expected_result: row.expected_result,
    security_notes: row.security_notes,
  };
}

export async function getPublishedLabs(): Promise<PublicLabCard[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("labs")
      .select(
        "slug, title, description, category, difficulty, estimated_time, featured, featured_image, published_at, status",
      )
      .eq("status", PUBLISHED)
      .order("published_at", { ascending: false, nullsFirst: false });

    if (error) {
      logQueryError("getPublishedLabs", error);
      return [];
    }

    return ((data ?? []) as Lab[]).map(mapPublicLabCard);
  } catch {
    return [];
  }
}

export async function getFeaturedLabs(): Promise<PublicLabCard[]> {
  const labs = await getPublishedLabs();
  return labs.filter((lab) => lab.featured);
}

export async function getFeaturedLab(): Promise<PublicLabCard | null> {
  const featuredLabs = await getFeaturedLabs();
  return featuredLabs[0] ?? null;
}

export async function getLabBySlug(
  slug: string,
): Promise<PublicLabDetail | null> {
  const requestedSlug = normalizeLabSlug(slug);

  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("labs")
      .select("*")
      .eq("slug", requestedSlug)
      .eq("status", PUBLISHED)
      .maybeSingle();

    if (error) {
      logQueryError("getLabBySlug", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return mapPublicLabDetail(data as Lab);
  } catch {
    return null;
  }
}

export async function getPublishedLabSlugs(): Promise<string[]> {
  const labs = await getPublishedLabs();
  return labs.map((lab) => lab.slug);
}

export function labPath(slug: string): string {
  return `/cyber-lab/${slug}`;
}
