import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LabForm } from "@/components/admin/labs/LabForm";
import { updateLab } from "@/lib/actions/labs";
import { getAdminLabById } from "@/lib/supabase/admin-labs";
import { focusRing } from "@/lib/page-data";

export const metadata: Metadata = {
  title: "Edit Lab | HCX Admin",
  robots: { index: false, follow: false },
};

interface EditLabPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditLabPage({ params }: EditLabPageProps) {
  const { id } = await params;
  const lab = await getAdminLabById(id);

  if (!lab) {
    notFound();
  }

  const updateLabAction = updateLab.bind(null, lab.id);

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/labs"
          className={`inline-flex items-center text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
        >
          ← Back to Cyber Labs
        </Link>

        <p className="mt-4 font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Learning
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
          EDIT LAB
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-hcx-text-secondary">
          Update lab content and publishing settings.
        </p>
      </div>

      <LabForm action={updateLabAction} lab={lab} />
    </div>
  );
}
