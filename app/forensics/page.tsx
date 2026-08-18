import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import {
  featuredForensicsGuide,
  forensicsGuides,
  forensicsTools,
} from "@/lib/page-data";
import { focusRing } from "@/lib/page-data";
import { ArrowRightIcon } from "@/components/icons";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Digital Forensics",
  description:
    "Practical digital forensic investigations, tools and evidence analysis.",
  path: "/forensics",
});

export default function ForensicsPage() {
  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Forensics" }]} />
      <PageHero
        label="HCX Forensics"
        title="Digital Forensics"
        description="Practical digital forensic investigations, tools and evidence analysis."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section aria-labelledby="featured-forensics">
          <div className="flex flex-wrap items-center gap-3">
            <h2
              id="featured-forensics"
              className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
            >
              Featured Forensics Guide
            </h2>
            <span className="rounded border border-hcx-green/25 bg-hcx-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-hcx-green">
              Educational Guide
            </span>
          </div>
          <article className="mt-5 rounded-xl border border-hcx-cyan/20 bg-hcx-card p-6 md:p-8">
            <h3 className="text-2xl font-bold text-hcx-text">
              {featuredForensicsGuide.title}
            </h3>
            <p className="mt-3 max-w-2xl text-hcx-text-secondary leading-relaxed">
              {featuredForensicsGuide.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-hcx-text-secondary">
              <span>
                Difficulty:{" "}
                <span className="text-hcx-green">
                  {featuredForensicsGuide.difficulty}
                </span>
              </span>
              <span aria-hidden="true">•</span>
              <span>{featuredForensicsGuide.readTime}</span>
            </div>
            <a
              href="#"
              className={`mt-6 inline-flex items-center gap-2 rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 ${focusRing}`}
            >
              Read Guide
              <ArrowRightIcon />
            </a>
          </article>
        </section>

        <section className="mt-14" aria-labelledby="forensics-topics">
          <h2
            id="forensics-topics"
            className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
          >
            Forensics Topics
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {forensicsGuides.map((guide) => (
              <article
                key={guide.title}
                className="rounded-lg border border-hcx-border bg-hcx-card p-5 transition-colors hover:border-hcx-cyan/25 sm:p-6"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-hcx-green">
                  Forensics Lab
                </span>
                <h3 className="mt-2 text-lg font-semibold text-hcx-text">
                  {guide.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
                  {guide.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="forensics-tools">
          <h2
            id="forensics-tools"
            className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
          >
            Forensics Tools
          </h2>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            Tool names are referenced for educational purposes. HimalCyberX is
            not affiliated with these products.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forensicsTools.map((tool) => (
              <article
                key={tool.name}
                className="rounded-lg border border-hcx-border bg-hcx-card p-5"
              >
                <h3 className="font-tech text-base font-semibold text-hcx-cyan">
                  {tool.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
                  {tool.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
