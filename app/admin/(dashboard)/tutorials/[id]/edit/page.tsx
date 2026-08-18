import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TutorialForm } from "@/components/admin/tutorials/TutorialForm";
import { updateTutorial } from "@/lib/actions/tutorials";
import { getAdminTutorialById } from "@/lib/supabase/admin-tutorials";
import { focusRing } from "@/lib/page-data";

export const metadata: Metadata = {
  title: "Edit Tutorial | HCX Admin",
  robots: { index: false, follow: false },
};

interface EditTutorialPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditTutorialPage({
  params,
}: EditTutorialPageProps) {
  const { id } = await params;
  const tutorial = await getAdminTutorialById(id);

  if (!tutorial) {
    notFound();
  }

  const updateTutorialAction = updateTutorial.bind(null, tutorial.id);

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/tutorials"
          className={`inline-flex items-center text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
        >
          ← Back to Tutorials
        </Link>

        <p className="mt-4 font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Learning
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
          EDIT TUTORIAL
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-hcx-text-secondary">
          Update tutorial content and publishing settings.
        </p>
      </div>

      <TutorialForm action={updateTutorialAction} tutorial={tutorial} />
    </div>
  );
}
