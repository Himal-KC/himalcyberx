import Link from "next/link";
import type { Metadata } from "next";
import { LabForm } from "@/components/admin/labs/LabForm";
import { createLab } from "@/lib/actions/labs";
import { focusRing } from "@/lib/page-data";

export const metadata: Metadata = {
  title: "New Lab | HCX Admin",
  robots: { index: false, follow: false },
};

export default function AdminNewLabPage() {
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
          NEW LAB
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-hcx-text-secondary">
          Create a hands-on cybersecurity lab for HimalCyberX learners.
        </p>
      </div>

      <LabForm action={createLab} />
    </div>
  );
}
