import Link from "next/link";
import type { Metadata } from "next";
import { TutorialsTable } from "@/components/admin/tutorials/TutorialsTable";
import { getAdminTutorials } from "@/lib/supabase/admin-tutorials";
import { focusRing } from "@/lib/page-data";

export const metadata: Metadata = {
  title: "Tutorials | HCX Admin",
  robots: { index: false, follow: false },
};

export default async function AdminTutorialsPage() {
  const tutorials = await getAdminTutorials();

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

      <TutorialsTable tutorials={tutorials} />
    </div>
  );
}
