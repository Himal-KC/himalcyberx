import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TutorialsListFilters } from "@/components/admin/tutorials/TutorialsListFilters";
import { TutorialsTable } from "@/components/admin/tutorials/TutorialsTable";
import {
  applyTutorialListFilters,
  getTutorialCategoryOptions,
  parseTutorialListFilters,
  tutorialListFiltersAreActive,
} from "@/lib/admin/tutorial-list";
import { getAdminTutorials } from "@/lib/supabase/admin-tutorials";
import { focusRing } from "@/lib/page-data";

export const metadata: Metadata = {
  title: "Tutorials | HCX Admin",
  robots: { index: false, follow: false },
};

interface AdminTutorialsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminTutorialsPage({
  searchParams,
}: AdminTutorialsPageProps) {
  const params = await searchParams;
  const filters = parseTutorialListFilters(params);
  const tutorials = await getAdminTutorials();
  const filteredTutorials = applyTutorialListFilters(tutorials, filters);
  const categories = getTutorialCategoryOptions(tutorials);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Learning
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
            TUTORIALS
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-hcx-text-secondary">
            Create and manage practical cybersecurity tutorials.
          </p>
        </div>
        <Link
          href="/admin/tutorials/new"
          className={`inline-flex items-center rounded-lg bg-hcx-cyan px-4 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 ${focusRing}`}
        >
          + New Tutorial
        </Link>
      </div>

      <div className="mb-6">
        <Suspense fallback={null}>
          <TutorialsListFilters filters={filters} categories={categories} />
        </Suspense>
      </div>

      <TutorialsTable
        tutorials={filteredTutorials}
        totalCount={tutorials.length}
        hasActiveFilters={tutorialListFiltersAreActive(filters)}
      />
    </div>
  );
}
