import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { focusRing } from "@/lib/page-data";

export const metadata: Metadata = buildPageMetadata({
  title: "Page Not Found",
  description: "The requested HimalCyberX page could not be found.",
  noIndex: true,
});

export default function NotFound() {
  return (
    <PageShell showNewsletter={false}>
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <p className="font-tech text-sm font-semibold uppercase tracking-[0.2em] text-hcx-cyan">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold text-hcx-text sm:text-4xl">
          Page Not Found
        </h1>
        <p className="mt-4 text-hcx-text-secondary leading-relaxed">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className={`rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 ${focusRing}`}
          >
            Return Home
          </Link>
          <Link
            href="/news"
            className={`rounded-lg border border-hcx-border bg-hcx-card px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
          >
            Browse News
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
