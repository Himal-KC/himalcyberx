import type { TutorialStatus } from "@/lib/supabase/types";

const styles: Record<TutorialStatus, string> = {
  draft: "border-hcx-border bg-hcx-bg-secondary text-hcx-text-secondary",
  published: "border-hcx-green/25 bg-hcx-green/10 text-hcx-green",
};

const labels: Record<TutorialStatus, string> = {
  draft: "Draft",
  published: "Published",
};

export function TutorialStatusBadge({ status }: { status: TutorialStatus }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
