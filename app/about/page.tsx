import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings/site-settings";

export const metadata: Metadata = buildPageMetadata({
  title: "About | Cybersecurity Research & Learning",
  description:
    "Learn about HimalCyberX, its cybersecurity research focus, editorial approach, source standards and commitment to practical, defensive security education.",
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
        description="HimalCyberX is an independent cybersecurity research and learning platform focused on threat intelligence, vulnerability research, digital forensics, cyber labs, tutorials, AI security and defensive security education."
        supportingText="We publish practical, evidence-based content to help readers understand real threats and apply responsible defensive security practices."
        compact
      />
      <AboutContent settings={settings} />
    </PageShell>
  );
}
