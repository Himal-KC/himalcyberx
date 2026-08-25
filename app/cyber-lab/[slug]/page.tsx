import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { DifficultyBadge } from "@/components/cyber-lab/DifficultyBadge";
import { RichContentRenderer } from "@/components/content/RichContentRenderer";
import { RelatedContentSection } from "@/components/related/RelatedContentSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildLabBreadcrumbStructuredData,
  buildLabStructuredData,
} from "@/lib/seo/lab-structured-data";
import { buildTechArticleMetadata, buildPageMetadata } from "@/lib/seo/metadata";
import { getLabBySlug, labPath } from "@/lib/supabase/public-labs";
import { getRelatedContent } from "@/lib/supabase/public-related-content";
import { focusRing } from "@/lib/page-data";

export const revalidate = 60;
export const dynamicParams = true;

interface LabPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: LabPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lab = await getLabBySlug(slug);

  if (!lab) {
    return buildPageMetadata({
      title: "Lab Not Found",
      description: "The requested cyber lab could not be found.",
      noIndex: true,
    });
  }

  return buildTechArticleMetadata({
    title: lab.title,
    description: lab.description,
    path: labPath(lab.slug),
    imageUrl: lab.featured_image,
    publishedTime: lab.published_at,
    modifiedTime: lab.updated_at,
  });
}

function LabSection({
  title,
  content,
}: {
  title: string;
  content: string | null;
}) {
  if (!content?.trim()) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
        {title}
      </h2>
      <div className="mt-4">
        <RichContentRenderer content={content} preserveLineBreaks />
      </div>
    </section>
  );
}

export default async function LabDetailPage({ params }: LabPageProps) {
  const { slug } = await params;
  const lab = await getLabBySlug(slug);

  if (!lab) {
    notFound();
  }

  const related = await getRelatedContent({
    type: "lab",
    slug: lab.slug,
    category: lab.category,
  });

  const difficultyLevel =
    lab.difficulty === "Beginner"
      ? "beginner"
      : lab.difficulty === "Intermediate"
        ? "intermediate"
        : "advanced";

  return (
    <>
      <JsonLd data={buildLabStructuredData(lab)} />
      <JsonLd data={buildLabBreadcrumbStructuredData(lab)} />
      <PageShell>
      <Breadcrumb
        items={[
          { label: "Cyber Lab", href: "/cyber-lab" },
          { label: lab.title },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <article className="mx-auto max-w-3xl">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/cyber-lab"
                className={`text-xs font-semibold uppercase tracking-wide text-hcx-cyan hover:underline ${focusRing}`}
              >
                {lab.category}
              </Link>
              {lab.featured && (
                <span className="rounded border border-hcx-cyan/30 bg-hcx-cyan/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-hcx-cyan">
                  Featured Lab
                </span>
              )}
            </div>

            <h1 className="mt-4 break-words text-3xl font-bold leading-tight text-hcx-text sm:text-4xl">
              {lab.title}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-hcx-text-secondary">
              {lab.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-hcx-border pb-6">
              <DifficultyBadge label={lab.difficulty} level={difficultyLevel} />
              {lab.estimated_time && (
                <>
                  <span aria-hidden="true" className="text-hcx-text-secondary">
                    •
                  </span>
                  <span className="text-sm text-hcx-text-secondary">
                    {lab.estimated_time}
                  </span>
                </>
              )}
              {lab.publishedAtFormatted && (
                <>
                  <span aria-hidden="true" className="text-hcx-text-secondary">
                    •
                  </span>
                  <time
                    dateTime={lab.published_at ?? undefined}
                    className="text-sm text-hcx-text-secondary"
                  >
                    {lab.publishedAtFormatted}
                  </time>
                </>
              )}
            </div>
          </header>

          <div className="mt-8 overflow-hidden rounded-xl border border-hcx-border">
            <ArticleFeaturedVisual
              featured_image={lab.featured_image}
              title={lab.title}
              pattern="circuit"
            />
          </div>

          <LabSection title="Lab Introduction" content={lab.introduction} />
          <LabSection
            title="Learning Objectives"
            content={lab.learning_objectives}
          />
          <LabSection
            title="Requirements / Tools"
            content={lab.requirements_tools}
          />
          <LabSection
            title="Step-by-Step Instructions"
            content={lab.instructions}
          />
          <LabSection title="Expected Result" content={lab.expected_result} />
          <LabSection title="Security Notes" content={lab.security_notes} />
        </article>

        {related.length > 0 ? (
          <div className="mx-auto mt-14 max-w-7xl">
            <RelatedContentSection items={related} />
          </div>
        ) : null}
      </div>
    </PageShell>
    </>
  );
}
