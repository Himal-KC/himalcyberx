interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  label,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`mb-10 md:mb-12 max-w-2xl ${alignClass}`}>
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
