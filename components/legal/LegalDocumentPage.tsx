import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageHero } from "@/components/layout/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { focusRing } from "@/lib/page-data";

export interface LegalSection {
  title: string;
  paragraphs: string[];
  list?: string[];
}

interface LegalDocumentPageProps {
  breadcrumbLabel: string;
  heroLabel: string;
  heroTitle: string;
  heroDescription: string;
  lastUpdated: string;
  lastUpdatedIso: string;
  introduction: string;
  sections: LegalSection[];
  contactHeading?: string;
  contactText: string;
  siteName: string;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
      {children}
    </h2>
  );
}

export function LegalDocumentPage({
  breadcrumbLabel,
  heroLabel,
  heroTitle,
  heroDescription,
  lastUpdated,
  lastUpdatedIso,
  introduction,
  sections,
  contactHeading = "Contact",
  contactText,
  siteName,
}: LegalDocumentPageProps) {
  return (
    <PageShell showNewsletter={false}>
      <Breadcrumb items={[{ label: breadcrumbLabel }]} />
      <PageHero
        label={heroLabel}
        title={heroTitle}
        description={heroDescription}
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm text-hcx-text-secondary">
          Last updated:{" "}
          <time dateTime={lastUpdatedIso}>{lastUpdated}</time>
        </p>

        <p className="mt-6 text-base leading-relaxed text-hcx-text-secondary">
          {introduction}
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <SectionHeading>{section.title}</SectionHeading>
              <div className="mt-4 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-relaxed text-hcx-text-secondary"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.list && section.list.length > 0 && (
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-hcx-text-secondary">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-xl border border-hcx-border bg-hcx-card p-6">
          <SectionHeading>{contactHeading}</SectionHeading>
          <p className="mt-4 text-sm leading-relaxed text-hcx-text-secondary">
            {contactText}{" "}
            <Link
              href="/contact"
              className={`text-hcx-cyan hover:underline ${focusRing}`}
            >
              Contact {siteName}
            </Link>
            .
          </p>
        </section>
      </div>
    </PageShell>
  );
}
