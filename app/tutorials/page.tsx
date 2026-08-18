import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PublishedTutorialCard } from "@/components/tutorials/PublishedTutorialCard";
import { StaticTutorialCard } from "@/components/tutorials/StaticTutorialCard";
import { buildTutorialSections } from "@/lib/tutorials-content";
import { getPublishedTutorials } from "@/lib/supabase/public-tutorials";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Tutorials",
  description:
    "Practical step-by-step cybersecurity learning for defenders and security students.",
  path: "/tutorials",
});

export const revalidate = 60;

export default async function TutorialsPage() {
  const tutorials = await getPublishedTutorials();
  const sections = buildTutorialSections(tutorials);

  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Tutorials" }]} />
      <PageHero
        label="HCX Learning"
        title="Cybersecurity Tutorials"
        description="Practical step-by-step cybersecurity learning for defenders and security students."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-10 max-w-3xl text-sm leading-relaxed text-hcx-text-secondary">
          Follow structured learning guides to build practical defensive skills.
          Each tutorial walks through concepts, setup, and hands-on steps you can
          practice in authorized environments.
        </p>

        {sections.length === 0 ? (
          <section className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/40 px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-hcx-text">
              Tutorials coming soon
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-hcx-text-secondary">
              HimalCyberX is preparing practical cybersecurity tutorials. Check back
              soon for step-by-step learning guides.
            </p>
          </section>
        ) : (
          sections.map((section) => (
            <section
              key={section.category}
              className="mb-14 last:mb-0"
              aria-labelledby={`tut-${section.category}`}
            >
              <h2
                id={`tut-${section.category}`}
                className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
              >
                {section.category}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {section.dbTutorials.map((tutorial) => (
                  <PublishedTutorialCard
                    key={tutorial.slug}
                    tutorial={tutorial}
                  />
                ))}
                {section.staticTutorials.map((tutorial) => (
                  <StaticTutorialCard key={tutorial.id} tutorial={tutorial} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </PageShell>
  );
}
