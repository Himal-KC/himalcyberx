import {
  matchesSearchQuery,
  readQueryString,
  sortByContentDate,
  type ContentSortOption,
} from "@/lib/admin/list-query";
import type {
  Tutorial,
  TutorialDifficulty,
  TutorialStatus,
} from "@/lib/supabase/types";

export type TutorialStatusFilter = "all" | TutorialStatus;
export type TutorialDifficultyFilter = "all" | TutorialDifficulty;

export interface TutorialListFilters {
  q: string;
  status: TutorialStatusFilter;
  category: string;
  difficulty: TutorialDifficultyFilter;
  sort: ContentSortOption;
}

export const DEFAULT_TUTORIAL_LIST_FILTERS: TutorialListFilters = {
  q: "",
  status: "all",
  category: "all",
  difficulty: "all",
  sort: "newest",
};

const TUTORIAL_FILTER_KEYS = [
  "q",
  "status",
  "category",
  "difficulty",
  "sort",
] as const;

export function parseTutorialListFilters(
  params: Record<string, string | string[] | undefined>,
): TutorialListFilters {
  const status = readQueryString(params.status);
  const category = readQueryString(params.category);
  const difficulty = readQueryString(params.difficulty);
  const sort = readQueryString(params.sort);

  return {
    q: readQueryString(params.q),
    status: status === "draft" || status === "published" ? status : "all",
    category: category || "all",
    difficulty:
      difficulty === "Beginner" ||
      difficulty === "Intermediate" ||
      difficulty === "Advanced"
        ? difficulty
        : "all",
    sort:
      sort === "oldest" || sort === "updated" ? sort : "newest",
  };
}

export function tutorialListFiltersAreActive(
  filters: TutorialListFilters,
): boolean {
  return (
    Boolean(filters.q.trim()) ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    filters.difficulty !== "all" ||
    filters.sort !== "newest"
  );
}

export function filterTutorials(
  tutorials: Tutorial[],
  filters: TutorialListFilters,
): Tutorial[] {
  return tutorials.filter((tutorial) => {
    if (!matchesSearchQuery(filters.q, [tutorial.title, tutorial.slug])) {
      return false;
    }

    if (filters.status !== "all" && tutorial.status !== filters.status) {
      return false;
    }

    if (filters.category !== "all" && tutorial.category !== filters.category) {
      return false;
    }

    if (
      filters.difficulty !== "all" &&
      tutorial.difficulty !== filters.difficulty
    ) {
      return false;
    }

    return true;
  });
}

export function applyTutorialListFilters(
  tutorials: Tutorial[],
  filters: TutorialListFilters,
): Tutorial[] {
  return sortByContentDate(filterTutorials(tutorials, filters), filters.sort);
}

export function buildTutorialListSearchParams(
  filters: TutorialListFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q.trim()) {
    params.set("q", filters.q.trim());
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.category !== "all") {
    params.set("category", filters.category);
  }

  if (filters.difficulty !== "all") {
    params.set("difficulty", filters.difficulty);
  }

  if (filters.sort !== "newest") {
    params.set("sort", filters.sort);
  }

  return params;
}

export function getTutorialCategoryOptions(
  tutorials: Tutorial[],
): string[] {
  return Array.from(
    new Set(tutorials.map((tutorial) => tutorial.category).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

export { TUTORIAL_FILTER_KEYS };
