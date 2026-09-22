import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { LearnerDashboardView } from "@/components/dashboard/LearnerDashboardView";
import { LEARNER_DASHBOARD_PATH } from "@/lib/auth/constants";
import { buildAuthPageMetadata } from "@/components/auth/AuthPageLayout";
import { requireLearnerSession } from "@/lib/auth/session";
import { loadLearnerDashboard } from "@/lib/dashboard/load-learner-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildAuthPageMetadata(
  "Dashboard",
  "Your HimalCyberX learner dashboard for saved content and learning progress.",
  LEARNER_DASHBOARD_PATH,
);

export default async function DashboardPage() {
  await requireLearnerSession(LEARNER_DASHBOARD_PATH);
  const data = await loadLearnerDashboard();

  if (!data) {
    return (
      <PageShell showNewsletter={false}>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-sm text-hcx-red">
            Your dashboard is unavailable right now. Please try again shortly.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell showNewsletter={false}>
      <LearnerDashboardView data={data} />
    </PageShell>
  );
}
