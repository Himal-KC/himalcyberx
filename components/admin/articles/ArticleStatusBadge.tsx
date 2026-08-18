import type { ArticleStatus } from "@/lib/supabase/types";

const statusStyles: Record<ArticleStatus, string> = {
  published: "border-hcx-green/30 bg-hcx-green/10 text-hcx-green",
  draft: "border-hcx-orange/30 bg-hcx-orange/10 text-hcx-orange",
  archived: "border-hcx-border bg-hcx-bg/60 text-hcx-text-secondary",
};

const statusLabels: Record<ArticleStatus, string> = {
  published: "Published",
  draft: "Draft",
  archived: "Archived",
};

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
