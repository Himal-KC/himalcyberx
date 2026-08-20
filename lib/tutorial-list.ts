import { matchesSearchQuery, readQueryString } from "@/lib/admin/list-query";
import type { PublicTutorialCard } from "@/lib/supabase/public-tutorials";
import type { TutorialDifficulty } from "@/lib/supabase/types";

export type TutorialDifficultyFilter =
  | "all"
  | "beginner"
  | "intermediate"
  | "advanced";

export interface TutorialListFilters {
  q: string;
  category: string;
  difficulty: TutorialDifficultyFilter;
}

export interface TutorialCategoryOption {
  value: string;
  label: string;
}

export const DEFAULT_TUTORIAL_FILTERS: TutorialListFilters = {
  q: "",
  category: "all",
  difficulty: "all",
};

const DIFFICULTY_FILTER_MAP: Record<
  Exclude<TutorialDifficultyFilter, "all">,
  TutorialDifficulty
> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function slugifyTutorialCategory(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTutorialCategoryKey(tutorial: PublicTutorialCard): string {
  return slugifyTutorialCategory(tutorial.category);
}

export function parseTutorialFilters(
  params: Record<string, string | string[] | undefined>,
): TutorialListFilters {
  const difficulty = readQueryString(params.difficulty);

  return {
    q: readQueryString(params.q),
    category: readQueryString(params.category) || "all",
    difficulty:
      difficulty === "beginner" ||
      difficulty === "intermediate" ||
      difficulty === "advanced"
        ? difficulty
        : "all",
  };
}

export function tutorialFiltersAreActive(filters: TutorialListFilters): boolean {
  return (
    Boolean(filters.q.trim()) ||
    filters.category !== "all" ||
    filters.difficulty !== "all"
  );
}

export function extractTutorialCategories(
  tutorials: PublicTutorialCard[],
): TutorialCategoryOption[] {
  const categories = new Map<string, string>();

  for (const tutorial of tutorials) {
    const value = getTutorialCategoryKey(tutorial);
    categories.set(value, tutorial.category);
  }

  return Array.from(categories.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function selectFeaturedTutorial(
  tutorials: PublicTutorialCard[],
): PublicTutorialCard | null {
  return tutorials.find((tutorial) => tutorial.featured) ?? null;
}

export function filterTutorials(
  tutorials: PublicTutorialCard[],
  filters: TutorialListFilters,
): PublicTutorialCard[] {
  let result = tutorials;

  if (filters.q.trim()) {
    result = result.filter((tutorial) =>
      matchesSearchQuery(filters.q, [
        tutorial.title,
        tutorial.description,
        tutorial.category,
      ]),
    );
  }

  if (filters.category !== "all") {
    result = result.filter(
      (tutorial) => getTutorialCategoryKey(tutorial) === filters.category,
    );
  }

  if (filters.difficulty !== "all") {
    const difficulty = DIFFICULTY_FILTER_MAP[filters.difficulty];
    result = result.filter((tutorial) => tutorial.difficulty === difficulty);
  }

  return result;
}

export interface TutorialPageData {
  featured: PublicTutorialCard | null;
  gridTutorials: PublicTutorialCard[];
  categories: TutorialCategoryOption[];
  filters: TutorialListFilters;
  filtersActive: boolean;
  totalPublished: number;
}

export function buildTutorialPageData(
  tutorials: PublicTutorialCard[],
  params: Record<string, string | string[] | undefined>,
): TutorialPageData {
  const filters = parseTutorialFilters(params);
  const filtersActive = tutorialFiltersAreActive(filters);
  const featured = filtersActive ? null : selectFeaturedTutorial(tutorials);
  const catalogTutorials =
    featured && !filtersActive
      ? tutorials.filter((tutorial) => tutorial.slug !== featured.slug)
      : tutorials;

  return {
    featured,
    gridTutorials: filterTutorials(catalogTutorials, filters),
    categories: extractTutorialCategories(tutorials),
    filters,
    filtersActive,
    totalPublished: tutorials.length,
  };
}
