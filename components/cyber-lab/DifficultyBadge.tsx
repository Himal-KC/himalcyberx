type DifficultyLevel =
  | "beginner-intermediate"
  | "beginner-advanced"
  | "intermediate"
  | "various";

const levelStyles: Record<
  DifficultyLevel,
  { text: string; dots: string[] }
> = {
  "beginner-intermediate": {
    text: "text-hcx-text-secondary",
    dots: ["bg-hcx-green", "bg-hcx-orange"],
  },
  "beginner-advanced": {
    text: "text-hcx-text-secondary",
    dots: ["bg-hcx-green", "bg-hcx-red"],
  },
  intermediate: {
    text: "text-hcx-orange",
    dots: ["bg-hcx-orange"],
  },
  various: {
    text: "text-hcx-cyan",
    dots: ["bg-hcx-cyan"],
  },
};

interface DifficultyBadgeProps {
  label: string;
  level: DifficultyLevel;
}

export function DifficultyBadge({ label, level }: DifficultyBadgeProps) {
  const style = levelStyles[level];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" aria-hidden="true">
        {style.dots.map((dot, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        ))}
      </div>
      <span className={`font-tech text-[11px] font-medium uppercase tracking-wider ${style.text}`}>
        {label}
      </span>
    </div>
  );
}
