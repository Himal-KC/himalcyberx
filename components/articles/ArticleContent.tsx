import Link from "next/link";
import { ContentLabelBadge } from "@/components/ContentLabelBadge";
import type { Article, ArticleSection } from "@/lib/articles";
import { articlePath, isDemoArticle } from "@/lib/articles";
import { focusRing } from "@/lib/page-data";

interface ArticleTableOfContentsProps {
  sections: ArticleSection[];
  variant?: "sidebar" | "inline";
}

export function ArticleTableOfContents({
  sections,
  variant = "sidebar",
}: ArticleTableOfContentsProps) {
  const wrapperClass =
    variant === "sidebar"
      ? ""
      : "lg:hidden mb-8 rounded-lg border border-hcx-border bg-hcx-card p-5";

  return (
    <nav aria-label="Table of contents" className={wrapperClass}>
      <p className="font-tech text-[10px] font-semibold uppercase tracking-[0.2em] text-hcx-text-secondary">
        Contents
      </p>
      <ol className="mt-4 space-y-2">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`flex gap-3 text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
            >
              <span className="font-tech text-xs text-hcx-cyan/70">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{section.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface ArticleBodyProps {
  article: Article;
}

export function ArticleBody({ article }: ArticleBodyProps) {
  return (
    <div className="prose-hcx space-y-10">
      {article.sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <h2 className="text-xl font-bold text-hcx-text sm:text-2xl">
            {section.title}
          </h2>
          <div className="mt-4 space-y-4">
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="text-base leading-relaxed text-hcx-text/90"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      ))}

      <section
        id="key-takeaways"
        className="scroll-mt-24 rounded-lg border border-hcx-cyan/20 bg-hcx-cyan/5 p-6 sm:p-8"
      >
        <h2 className="font-tech text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Key Takeaways
        </h2>
        <ul className="mt-4 space-y-3">
          {article.keyTakeaways.map((item) => (
            <li
              key={item}
              className="flex gap-3 text-base leading-relaxed text-hcx-text/90"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hcx-cyan" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section
        id="hcx-analysis"
        className="scroll-mt-24 rounded-lg border border-hcx-border bg-hcx-card p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-tech text-sm font-semibold uppercase tracking-[0.15em] text-hcx-green">
            HCX Analysis
          </h2>
          <span className="rounded border border-hcx-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary">
            {article.contentType === "real" ? "Editorial Analysis" : "Editorial / Educational"}
          </span>
        </div>
        <dl className="mt-6 space-y-5">
          <div>
            <dt className="text-sm font-semibold text-hcx-text">
              Why this matters
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-hcx-text-secondary">
              {article.hcxAnalysis.whyItMatters}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-hcx-text">
              What defenders should watch
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-hcx-text-secondary">
              {article.hcxAnalysis.whatToWatch}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-hcx-text">
              Defensive focus
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-hcx-text-secondary">
              {article.hcxAnalysis.defensiveFocus}
            </dd>
          </div>
        </dl>
      </section>

      {isDemoArticle(article) && article.technicalDetails && (
        <aside className="rounded-lg border border-hcx-orange/20 bg-hcx-bg-secondary/50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-tech text-sm font-semibold uppercase tracking-[0.15em] text-hcx-text">
              Technical Information
            </h2>
            <span className="font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-orange">
              Reference Data
            </span>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {Object.entries({
              "Threat Type": article.technicalDetails.threatType,
              "Affected Technology":
                article.technicalDetails.affectedTechnology,
              Severity: article.technicalDetails.severity,
              "Attack Vector": article.technicalDetails.attackVector,
              "Mitigation Status":
                article.technicalDetails.mitigationStatus,
            }).map(([label, value]) => (
              <div key={label}>
                <dt className="font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary">
                  {label}
                </dt>
                <dd className="mt-1 break-words text-sm text-hcx-text">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      )}

      {article.sources && article.sources.length > 0 && (
        <section
          id="sources"
          className="scroll-mt-24 rounded-lg border border-hcx-border bg-hcx-card p-6 sm:p-8"
        >
          <h2 className="font-tech text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Sources &amp; References
          </h2>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            This article is based on publicly available guidance and reference
            materials from the organizations listed below.
          </p>
          <ul className="mt-5 space-y-4">
            {article.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm font-medium text-hcx-cyan hover:underline ${focusRing}`}
                >
                  {source.title}
                </a>
                <p className="mt-0.5 text-xs text-hcx-text-secondary">
                  {source.publisher}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

interface RelatedArticlesProps {
  articles: Article[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  return (
    <section aria-labelledby="related-stories-heading" className="mt-14 border-t border-hcx-border pt-12">
      <h2
        id="related-stories-heading"
        className="text-sm font-semibold uppercase tracking-[0.15em] text-hcx-cyan"
      >
        Related Stories
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="group rounded-lg border border-hcx-border bg-hcx-card p-5 transition-colors hover:border-hcx-cyan/25"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-hcx-cyan">
                {article.category}
              </span>
              {article.label && <ContentLabelBadge label={article.label} />}
            </div>
            <h3 className="mt-2 text-base font-semibold leading-snug text-hcx-text transition-colors group-hover:text-hcx-cyan">
              <Link
                href={articlePath(article.slug)}
                className={focusRing}
              >
                {article.title}
              </Link>
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-hcx-text-secondary">
              {article.excerpt}
            </p>
            <p className="mt-3 text-xs text-hcx-text-secondary">
              {article.readTime}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
