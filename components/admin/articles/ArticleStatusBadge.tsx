import type { ArticleStatus } from "@/lib/supabase/types";
import { isArticleScheduled } from "@/lib/articles/publishing";

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

interface ArticleStatusBadgeProps {
  status: ArticleStatus;
  publishedAt?: string | null;
}

export function ArticleStatusBadge({
  status,
  publishedAt = null,
}: ArticleStatusBadgeProps) {
  const scheduled = isArticleScheduled({ status, published_at: publishedAt });

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        scheduled
          ? "border-hcx-cyan/30 bg-hcx-cyan/10 text-hcx-cyan"
          : statusStyles[status]
      }`}
    >
      {scheduled ? "Scheduled" : statusLabels[status]}
    </span>
  );
}
