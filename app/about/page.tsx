import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings/site-settings";

export const metadata: Metadata = buildPageMetadata({
  title: "About HimalCyberX | Cybersecurity Research & Learning",
  description:
    "Learn about HimalCyberX, an independent platform for cybersecurity research, threat intelligence, digital forensics, hands-on labs and practical security education.",
  path: "/about",
});

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "About" }]} />
      <PageHero
        label="About HimalCyberX"
        title="Cybersecurity Research, Learning & Practical Security"
        description="HimalCyberX is an independent cybersecurity platform focused on practical security education, threat research and hands-on technical learning."
        supportingText="Built to make cybersecurity knowledge clear, practical and accessible."
        compact
      />
      <AboutContent settings={settings} />
    </PageShell>
  );
}
