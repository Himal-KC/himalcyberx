import Link from "next/link";
import type { Metadata } from "next";
import { LabsTable } from "@/components/admin/labs/LabsTable";
import { getAdminLabs } from "@/lib/supabase/admin-labs";
import { focusRing } from "@/lib/page-data";

export const metadata: Metadata = {
  title: "Cyber Labs | HCX Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLabsPage() {
  const labs = await getAdminLabs();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Learning
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
            CYBER LABS
          </h1>
        </div>
        <Link
          href="/admin/labs/new"
          className={`inline-flex items-center rounded-lg bg-hcx-cyan px-4 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 ${focusRing}`}
        >
          + New Lab
        </Link>
      </div>

      <LabsTable labs={labs} />
    </div>
  );
}
