import type { Metadata } from "next";
import { DashboardContentStatusOverview } from "@/components/admin/dashboard/DashboardContentStatusOverview";
import { DashboardQuickActions } from "@/components/admin/dashboard/DashboardQuickActions";
import { DashboardRecentContent } from "@/components/admin/dashboard/DashboardRecentContent";
import { DashboardRecentMessages } from "@/components/admin/dashboard/DashboardRecentMessages";
import { DashboardRecentSubscribers } from "@/components/admin/dashboard/DashboardRecentSubscribers";
import { DashboardScheduledContent } from "@/components/admin/dashboard/DashboardScheduledContent";
import { DashboardStatsGrid } from "@/components/admin/dashboard/DashboardStatsGrid";
import { getAdminDashboardData } from "@/lib/supabase/admin-queries";

export const metadata: Metadata = {
  title: "Admin Overview | HimalCyberX",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Overview
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
          HCX ADMIN DASHBOARD
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-hcx-text-secondary">
          Manage HimalCyberX content, learning resources and community activity.
        </p>
      </header>

      <DashboardStatsGrid stats={dashboard.stats} />

      <DashboardContentStatusOverview overview={dashboard.articleStatusOverview} />

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardScheduledContent items={dashboard.scheduledArticles} />
        <DashboardQuickActions />
      </div>

      <DashboardRecentContent items={dashboard.recentContent} />

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardRecentMessages messages={dashboard.recentMessages} />
        <DashboardRecentSubscribers subscribers={dashboard.recentSubscribers} />
      </div>
    </div>
  );
}
