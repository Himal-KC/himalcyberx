import type { ArticleLabel } from "@/lib/articles";

const labelStyles: Record<ArticleLabel, string> = {
  "HCX ANALYSIS": "border-hcx-green/30 bg-hcx-green/10 text-hcx-green",
  "THREAT INTELLIGENCE": "border-hcx-cyan/30 bg-hcx-cyan/10 text-hcx-cyan",
  "SECURITY RESEARCH": "border-hcx-cyan/30 bg-hcx-cyan/10 text-hcx-cyan",
  GUIDE: "border-hcx-green/30 bg-hcx-green/10 text-hcx-green",
  TUTORIAL: "border-hcx-orange/30 bg-hcx-orange/10 text-hcx-orange",
};

export function ContentLabelBadge({
  label,
  className = "",
}: {
  label: ArticleLabel;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${labelStyles[label]} ${className}`}
    >
      {label}
    </span>
  );
}
