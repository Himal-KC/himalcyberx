import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { VulnerabilityDatabase } from "@/components/pages/VulnerabilityDatabase";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Vulnerability Watch",
  description:
    "Analysis of publicly disclosed security vulnerabilities and defensive guidance.",
  path: "/vulnerabilities",
});

export default function VulnerabilitiesPage() {
  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Vulnerabilities" }]} />
      <PageHero
        label="HCX Vulnerability Watch"
        title="HCX Vulnerability Watch"
        description="Analysis of publicly disclosed security vulnerabilities and defensive guidance."
      />
      <div className="border-b border-hcx-border">
        <VulnerabilityDatabase />
      </div>
    </PageShell>
  );
}
