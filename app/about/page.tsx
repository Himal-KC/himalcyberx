import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings/site-settings";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description:
    "Learn about HimalCyberX, an independent cybersecurity platform focused on threat intelligence, security research, digital forensics and practical cyber education.",
  path: "/about",
});

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <PageShell showNewsletter={false}>
      <Breadcrumb items={[{ label: "About" }]} />
      <PageHero
        label="Platform"
        title={`ABOUT ${settings.siteName.toUpperCase()}`}
        description="Independent cybersecurity research, threat intelligence and practical security education."
      />
      <AboutContent settings={settings} />
    </PageShell>
  );
}
