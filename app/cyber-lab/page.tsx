import type { Metadata } from "next";
import {
  CtfIcon,
  ForensicsIcon,
  LinuxIcon,
  NetworkIcon,
  SocIcon,
  WebIcon,
} from "@/components/icons";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FeaturedLab } from "@/components/cyber-lab/FeaturedLab";
import { LabCard } from "@/components/cyber-lab/LabCard";
import { LearningPaths } from "@/components/cyber-lab/LearningPaths";
import { PublishedLabCard } from "@/components/cyber-lab/PublishedLabCard";
import { buildCyberLabSections } from "@/lib/cyber-lab-content";
import {
  getFeaturedLab,
  getPublishedLabs,
} from "@/lib/supabase/public-labs";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cyber Lab",
  description: "Hands-on cybersecurity learning through guided technical labs.",
  path: "/cyber-lab",
});

export const revalidate = 60;

const iconMap = {
  network: NetworkIcon,
  forensics: ForensicsIcon,
  soc: SocIcon,
  web: WebIcon,
  linux: LinuxIcon,
  ctf: CtfIcon,
};

export default async function CyberLabPage() {
  const [labs, featuredLab] = await Promise.all([
    getPublishedLabs(),
    getFeaturedLab(),
  ]);

  const sections = buildCyberLabSections(labs);

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Cyber Lab" }]} />
      <PageHero
        label="Learn • Test • Defend"
        title="HCX Cyber Lab"
        description="Hands-on cybersecurity learning through guided technical labs."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-10 max-w-3xl text-sm leading-relaxed text-hcx-text-secondary">
          Practice only in systems and environments you own or are explicitly
          authorized to test.
        </p>

        <FeaturedLab lab={featuredLab} />

        {sections.length === 0 ? (
          <section className="mt-14 rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-hcx-text">
              Published labs coming soon
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-hcx-text-secondary">
              HimalCyberX is preparing hands-on cybersecurity labs. Check back
              soon for guided technical exercises.
            </p>
          </section>
        ) : (
          sections.map((section) => (
            <section
              key={section.category}
              className="mt-14"
              aria-labelledby={`lab-${section.category}`}
            >
              <h2
                id={`lab-${section.category}`}
                className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
              >
                {section.category}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {section.dbLabs.map((lab) => (
                  <PublishedLabCard key={lab.slug} lab={lab} />
                ))}
                {section.staticModules.map((module) => {
                  const Icon = iconMap[module.icon];
                  return (
                    <LabCard key={module.labId} module={module} icon={Icon} />
                  );
                })}
              </div>
            </section>
          ))
        )}

        <LearningPaths />
      </div>
    </PageShell>
  );
}
