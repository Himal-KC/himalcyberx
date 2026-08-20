interface PageHeroProps {
  title: string;
  description: string;
  label?: string;
  supportingText?: string;
  compact?: boolean;
}

export function PageHero({
  title,
  description,
  label,
  supportingText,
  compact = false,
}: PageHeroProps) {
  return (
    <section className="border-b border-hcx-border bg-hcx-bg-secondary/40">
      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
          compact ? "py-8 sm:py-9 lg:py-10" : "py-10 sm:py-12"
        }`}
      >
        {label && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hcx-cyan">
            {label}
          </p>
        )}
        <h1
          className={`text-3xl font-bold uppercase tracking-[0.06em] text-hcx-text sm:text-4xl ${label ? "mt-3" : ""}`}
        >
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-hcx-text-secondary sm:text-lg">
          {description}
        </p>
        {supportingText ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-hcx-text-secondary/75">
            {supportingText}
          </p>
        ) : null}
      </div>
    </section>
  );
}
