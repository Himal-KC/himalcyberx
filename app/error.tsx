"use client";

import Link from "next/link";
import { useEffect } from "react";
import { focusRing } from "@/lib/page-data";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error.digest ?? "unknown");
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-hcx-bg text-hcx-text antialiased">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
          <p className="font-tech text-sm font-semibold uppercase tracking-[0.2em] text-hcx-cyan">
            Error
          </p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Something went wrong
          </h1>
          <p className="mt-4 text-hcx-text-secondary leading-relaxed">
            An unexpected error occurred. Please try again or return to the
            homepage.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className={`rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 ${focusRing}`}
            >
              Try Again
            </button>
            <Link
              href="/"
              className={`rounded-lg border border-hcx-border bg-hcx-card px-5 py-2.5 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
            >
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
