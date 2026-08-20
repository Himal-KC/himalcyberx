import { matchesSearchQuery, readQueryString } from "@/lib/admin/list-query";
import type { PublicLabCard } from "@/lib/supabase/public-labs";
import type { LabDifficulty } from "@/lib/supabase/types";

export type CyberLabDifficultyFilter =
  | "all"
  | "beginner"
  | "intermediate"
  | "advanced";

export interface CyberLabListFilters {
  q: string;
  category: string;
  difficulty: CyberLabDifficultyFilter;
}

export interface CyberLabCategoryOption {
  value: string;
  label: string;
}

export interface CyberLabLearningPathLink {
  title: string;
  topics: readonly string[];
  href: string | null;
}

export const DEFAULT_CYBER_LAB_FILTERS: CyberLabListFilters = {
  q: "",
  category: "all",
  difficulty: "all",
};

const DIFFICULTY_FILTER_MAP: Record<
  Exclude<CyberLabDifficultyFilter, "all">,
  LabDifficulty
> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function slugifyLabCategory(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getLabCategoryKey(lab: PublicLabCard): string {
  return slugifyLabCategory(lab.category);
}

export function parseCyberLabFilters(
  params: Record<string, string | string[] | undefined>,
): CyberLabListFilters {
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

export function cyberLabFiltersAreActive(filters: CyberLabListFilters): boolean {
  return (
    Boolean(filters.q.trim()) ||
    filters.category !== "all" ||
    filters.difficulty !== "all"
  );
}

export function extractLabCategories(
  labs: PublicLabCard[],
): CyberLabCategoryOption[] {
  const categories = new Map<string, string>();

  for (const lab of labs) {
    const value = getLabCategoryKey(lab);
    categories.set(value, lab.category);
  }

  return Array.from(categories.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function selectFeaturedLab(labs: PublicLabCard[]): PublicLabCard | null {
  return labs.find((lab) => lab.featured) ?? null;
}

export function filterCyberLabs(
  labs: PublicLabCard[],
  filters: CyberLabListFilters,
): PublicLabCard[] {
  let result = labs;

  if (filters.q.trim()) {
    result = result.filter((lab) =>
      matchesSearchQuery(filters.q, [lab.title, lab.description, lab.category]),
    );
  }

  if (filters.category !== "all") {
    result = result.filter(
      (lab) => getLabCategoryKey(lab) === filters.category,
    );
  }

  if (filters.difficulty !== "all") {
    const difficulty = DIFFICULTY_FILTER_MAP[filters.difficulty];
    result = result.filter((lab) => lab.difficulty === difficulty);
  }

  return result;
}

export interface CyberLabPageData {
  featured: PublicLabCard | null;
  gridLabs: PublicLabCard[];
  categories: CyberLabCategoryOption[];
  filters: CyberLabListFilters;
  filtersActive: boolean;
  totalPublished: number;
}

export function buildCyberLabPageData(
  labs: PublicLabCard[],
  params: Record<string, string | string[] | undefined>,
): CyberLabPageData {
  const filters = parseCyberLabFilters(params);
  const filtersActive = cyberLabFiltersAreActive(filters);
  const featured = filtersActive ? null : selectFeaturedLab(labs);
  const catalogLabs =
    featured && !filtersActive
      ? labs.filter((lab) => lab.slug !== featured.slug)
      : labs;

  return {
    featured,
    gridLabs: filterCyberLabs(catalogLabs, filters),
    categories: extractLabCategories(labs),
    filters,
    filtersActive,
    totalPublished: labs.length,
  };
}

const LEARNING_PATH_DEFINITIONS = [
  {
    title: "Foundations",
    topics: [
      "Networking",
      "Linux",
      "Security Basics",
      "Digital Forensics Basics",
    ],
    buildHref: (labs: PublicLabCard[]) =>
      labs.some((lab) => lab.difficulty === "Beginner")
        ? "/cyber-lab?difficulty=beginner"
        : null,
  },
  {
    title: "Blue Team",
    topics: [
      "SOC Fundamentals",
      "Log Analysis",
      "Threat Detection",
      "Incident Response",
    ],
    buildHref: (labs: PublicLabCard[]) => {
      const match = labs.find(
        (lab) => getLabCategoryKey(lab) === "soc-and-incident-response",
      );
      return match
        ? `/cyber-lab?category=${encodeURIComponent(getLabCategoryKey(match))}`
        : null;
    },
  },
  {
    title: "Security Research",
    topics: [
      "Vulnerability Research",
      "Threat Intelligence",
      "Malware Analysis",
      "Digital Forensics",
    ],
    buildHref: (labs: PublicLabCard[]) => {
      const match = labs.find(
        (lab) => getLabCategoryKey(lab) === "digital-forensics",
      );
      return match
        ? `/cyber-lab?category=${encodeURIComponent(getLabCategoryKey(match))}`
        : null;
    },
  },
] as const;

export function getCyberLabLearningPaths(
  labs: PublicLabCard[],
): CyberLabLearningPathLink[] {
  if (labs.length === 0) {
    return [];
  }

  return LEARNING_PATH_DEFINITIONS.map((path) => ({
    title: path.title,
    topics: path.topics,
    href: path.buildHref(labs),
  }));
}
