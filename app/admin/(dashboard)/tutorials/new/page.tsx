import Link from "next/link";
import type { Metadata } from "next";
import { TutorialForm } from "@/components/admin/tutorials/TutorialForm";
import { createTutorial } from "@/lib/actions/tutorials";
import { focusRing } from "@/lib/page-data";

export const metadata: Metadata = {
  title: "New Tutorial | HCX Admin",
  robots: { index: false, follow: false },
};

export default function AdminNewTutorialPage() {
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
          NEW TUTORIAL
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-hcx-text-secondary">
          Create a practical cybersecurity learning guide for HimalCyberX.
        </p>
      </div>

      <TutorialForm action={createTutorial} />
    </div>
  );
}
