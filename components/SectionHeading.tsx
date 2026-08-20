interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  compact?: boolean;
}

export function SectionHeading({
  label,
  title,
  description,
  align = "left",
  compact = false,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  const spacingClass = compact ? "mb-6 md:mb-8" : "mb-10 md:mb-12";

  return (
    <div className={`${spacingClass} max-w-2xl ${alignClass}`}>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hcx-cyan mb-3">
          {label}
        </p>
      )}
      <h2 className="text-2xl font-bold uppercase tracking-[0.08em] text-hcx-text md:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base text-hcx-text-secondary leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
