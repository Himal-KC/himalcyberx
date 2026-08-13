"use client";

export function Newsletter() {
  return (
    <section
      id="newsletter"
      className="border-b border-hcx-border py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-hcx-border bg-hcx-card">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0,217,255,0.06), transparent)",
            }}
          />

          <div className="relative grid gap-8 p-8 md:grid-cols-2 md:items-center md:p-12 lg:p-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hcx-cyan">
                Newsletter
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-hcx-text md:text-4xl">
                Stay Ahead of the Threat
              </h2>
              <p className="mt-4 text-hcx-text-secondary leading-relaxed">
                Weekly cybersecurity intelligence, research and practical
                security guides.
              </p>
            </div>

            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Newsletter signup"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="you@company.com"
                className="flex-1 rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-hcx-cyan px-6 py-3 text-sm font-semibold text-hcx-bg transition-all hover:bg-hcx-cyan/90 hover:shadow-[0_0_24px_rgba(0,217,255,0.25)]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
