import type { ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface AdminPlaceholderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function AdminPlaceholder({
  title,
  description,
  children,
}: AdminPlaceholderProps) {
  return (
    <div>
      <AdminPageHeader title={title} description={description} />
      <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/50 p-8 text-sm text-hcx-text-secondary">
        {children ?? "This section will be available in a future update."}
      </div>
    </div>
  );
}
