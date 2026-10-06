import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { getAdminAnalyticsDashboard } from "@/lib/analytics/ga4-dashboard.server";

export const metadata: Metadata = {
  title: "Analytics | HimalCyberX Admin",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const result = await getAdminAnalyticsDashboard();
  return <AnalyticsDashboard result={result} />;
}
