import { slugifyTitle } from "@/lib/articles/validation";
import { isArticleSlugTaken } from "@/lib/supabase/admin-articles";
import { isLabSlugTaken } from "@/lib/supabase/admin-labs";
import { isTutorialSlugTaken } from "@/lib/supabase/admin-tutorials";
import type { AgentContentType } from "@/lib/supabase/types";

export function normalizeGeneratedSlug(slug: string): string {
  const normalized = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || slugifyTitle("hcx-draft");
}

async function isSlugTaken(
  contentType: AgentContentType,
  slug: string,
): Promise<boolean> {
  switch (contentType) {
    case "article":
      return isArticleSlugTaken(slug);
    case "tutorial":
      return isTutorialSlugTaken(slug);
    case "lab":
      return isLabSlugTaken(slug);
  }
}

export async function resolveUniqueSlug(
  contentType: AgentContentType,
  preferredSlug: string,
): Promise<string> {
  const base = normalizeGeneratedSlug(preferredSlug);
  if (!(await isSlugTaken(contentType, base))) {
    return base;
  }

  for (let index = 2; index <= 20; index += 1) {
    const candidate = `${base}-${index}`;
    if (!(await isSlugTaken(contentType, candidate))) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}
