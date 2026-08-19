import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ArticleFeaturedVisual } from "@/components/articles/ArticleFeaturedVisual";
import { DifficultyBadge } from "@/components/cyber-lab/DifficultyBadge";
import { PlainTextTutorialContent } from "@/components/tutorials/PlainTextTutorialContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildTechArticleMetadata, buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildTutorialBreadcrumbStructuredData,
  buildTutorialStructuredData,
} from "@/lib/seo/tutorial-structured-data";
import { getTutorialBySlug, tutorialPath } from "@/lib/supabase/public-tutorials";
import { focusRing } from "@/lib/page-data";

export const revalidate = 60;
export const dynamicParams = true;

interface TutorialPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TutorialPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = await getTutorialBySlug(slug);

  if (!tutorial) {
    return buildPageMetadata({
      title: "Tutorial Not Found",
      description: "The requested tutorial could not be found.",
      noIndex: true,
    });
  }

  return buildTechArticleMetadata({
    title: tutorial.title,
    description: tutorial.description,
    path: tutorialPath(tutorial.slug),
    imageUrl: tutorial.featured_image,
    publishedTime: tutorial.published_at,
    modifiedTime: tutorial.updated_at,
  });
}

function TutorialSection({
  title,
  content,
  variant = "default",
}: {
  title: string;
  content: string | null;
  variant?: "default" | "highlight" | "security";
}) {
  if (!content?.trim()) {
    return null;
  }

  const variantClasses = {
    default: "border-hcx-border",
    highlight: "border-hcx-cyan/25 bg-hcx-cyan/5",
    security: "border-hcx-orange/25 bg-hcx-orange/5",
  };

  return (
    <section
      className={`mt-10 rounded-xl border p-6 sm:p-8 ${variantClasses[variant]}`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
        {title}
      </h2>
      <div className="mt-4">
        <PlainTextTutorialContent content={content} />
      </div>
    </section>
  );
}

export default async function TutorialDetailPage({ params }: TutorialPageProps) {
  const { slug } = await params;
  const tutorial = await getTutorialBySlug(slug);

  if (!tutorial) {
    notFound();
  }

  const difficultyLevel =
    tutorial.difficulty === "Beginner"
      ? "beginner"
      : tutorial.difficulty === "Intermediate"
        ? "intermediate"
        : "advanced";

  return (
    <>
      <JsonLd data={buildTutorialStructuredData(tutorial)} />
      <JsonLd data={buildTutorialBreadcrumbStructuredData(tutorial)} />
      <PageShell>
      <Breadcrumb
        items={[
          { label: "Tutorials", href: "/tutorials" },
          { label: tutorial.title },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <article className="mx-auto max-w-3xl">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/tutorials"
                className={`text-xs font-semibold uppercase tracking-wide text-hcx-cyan hover:underline ${focusRing}`}
              >
                {tutorial.category}
              </Link>
              <span className="rounded border border-hcx-border bg-hcx-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary">
                Learning Guide
              </span>
              {tutorial.featured && (
                <span className="rounded border border-hcx-green/30 bg-hcx-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-hcx-green">
                  Featured Tutorial
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold leading-tight text-hcx-text sm:text-4xl">
              {tutorial.title}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-hcx-text-secondary">
              {tutorial.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-hcx-border pb-6">
              <DifficultyBadge
                label={tutorial.difficulty}
                level={difficultyLevel}
              />
              {tutorial.estimated_time && (
                <>
                  <span aria-hidden="true" className="text-hcx-text-secondary">
                    •
                  </span>
                  <span className="text-sm text-hcx-text-secondary">
                    {tutorial.estimated_time}
                  </span>
                </>
              )}
              {tutorial.publishedAtFormatted && (
                <>
                  <span aria-hidden="true" className="text-hcx-text-secondary">
                    •
                  </span>
                  <time
                    dateTime={tutorial.published_at ?? undefined}
                    className="text-sm text-hcx-text-secondary"
                  >
                    {tutorial.publishedAtFormatted}
                  </time>
                </>
              )}
            </div>
          </header>

          <div className="mt-8 overflow-hidden rounded-xl border border-hcx-border">
            <ArticleFeaturedVisual
              featured_image={tutorial.featured_image}
              title={tutorial.title}
              pattern="grid"
            />
          </div>

          <TutorialSection
            title="Introduction"
            content={tutorial.introduction}
            variant="highlight"
          />
          <TutorialSection
            title="Requirements"
            content={tutorial.requirements}
          />
          <TutorialSection
            title="Step-by-Step Instructions"
            content={tutorial.instructions}
          />
          <TutorialSection
            title="Key Takeaways"
            content={tutorial.key_takeaways}
            variant="highlight"
          />
          <TutorialSection
            title="Security Notes"
            content={tutorial.security_notes}
            variant="security"
          />
        </article>
      </div>
    </PageShell>
    </>
  );
}
