import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings/SettingsForm";
import { getAdminSiteSettings } from "@/lib/settings/site-settings";

export const metadata: Metadata = {
  title: "Settings | HCX Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const settings = await getAdminSiteSettings();

  return (
    <div>
      <div className="mb-8">
        <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Configuration
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-hcx-text">
          SETTINGS
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-hcx-text-secondary">
          Manage HimalCyberX global website configuration.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
