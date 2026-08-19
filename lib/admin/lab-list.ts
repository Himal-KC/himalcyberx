import {
  matchesSearchQuery,
  readQueryString,
  sortByContentDate,
  type ContentSortOption,
} from "@/lib/admin/list-query";
import type { Lab, LabDifficulty, LabStatus } from "@/lib/supabase/types";

export type LabStatusFilter = "all" | LabStatus;
export type LabDifficultyFilter = "all" | LabDifficulty;

export interface LabListFilters {
  q: string;
  status: LabStatusFilter;
  category: string;
  difficulty: LabDifficultyFilter;
  sort: ContentSortOption;
}

export const DEFAULT_LAB_LIST_FILTERS: LabListFilters = {
  q: "",
  status: "all",
  category: "all",
  difficulty: "all",
  sort: "newest",
};

const LAB_FILTER_KEYS = ["q", "status", "category", "difficulty", "sort"] as const;

export function parseLabListFilters(
  params: Record<string, string | string[] | undefined>,
): LabListFilters {
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

export function labListFiltersAreActive(filters: LabListFilters): boolean {
  return (
    Boolean(filters.q.trim()) ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    filters.difficulty !== "all" ||
    filters.sort !== "newest"
  );
}

export function filterLabs(labs: Lab[], filters: LabListFilters): Lab[] {
  return labs.filter((lab) => {
    if (!matchesSearchQuery(filters.q, [lab.title, lab.slug])) {
      return false;
    }

    if (filters.status !== "all" && lab.status !== filters.status) {
      return false;
    }

    if (filters.category !== "all" && lab.category !== filters.category) {
      return false;
    }

    if (filters.difficulty !== "all" && lab.difficulty !== filters.difficulty) {
      return false;
    }

    return true;
  });
}

export function applyLabListFilters(
  labs: Lab[],
  filters: LabListFilters,
): Lab[] {
  return sortByContentDate(filterLabs(labs, filters), filters.sort);
}

export function buildLabListSearchParams(
  filters: LabListFilters,
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

export function getLabCategoryOptions(labs: Lab[]): string[] {
  return Array.from(new Set(labs.map((lab) => lab.category).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b),
  );
}

export { LAB_FILTER_KEYS };
