import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { SavedContentSection } from "@/components/dashboard/SavedContentSection";
import { buildAuthPageMetadata } from "@/components/auth/AuthPageLayout";
import {
  LEARNER_DASHBOARD_PATH,
  LEARNER_DASHBOARD_SAVED_PATH,
} from "@/lib/auth/constants";
import { requireLearnerSession } from "@/lib/auth/session";
import { loadLearnerSavedContent } from "@/lib/dashboard/load-learner-dashboard";
import { focusRing } from "@/lib/page-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildAuthPageMetadata(
  "Saved Content",
  "All content you have saved on HimalCyberX.",
  LEARNER_DASHBOARD_SAVED_PATH,
);

export default async function DashboardSavedPage() {
  await requireLearnerSession(LEARNER_DASHBOARD_SAVED_PATH);
  const items = await loadLearnerSavedContent();

  return (
    <PageShell showNewsletter={false}>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div>
          <Link
            href={LEARNER_DASHBOARD_PATH}
            className={`text-sm font-semibold text-hcx-cyan hover:underline ${focusRing}`}
          >
            ← Back to Dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-hcx-text sm:text-3xl">
            Saved Content
          </h1>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            Articles, tutorials, and labs you have bookmarked.
          </p>
        </div>
        <SavedContentSection items={items} showViewAll={false} />
      </div>
    </PageShell>
  );
}
