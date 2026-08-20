"use client";

import { useState, useTransition } from "react";
import { exportSubscribersCsv } from "@/lib/actions/subscribers";
import type { SubscriberListFilters } from "@/lib/admin/subscriber-list";
import { focusRing } from "@/lib/page-data";

interface ExportSubscribersButtonProps {
  filters: SubscriberListFilters;
  disabled?: boolean;
}

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportSubscribersButton({
  filters,
  disabled = false,
}: ExportSubscribersButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportSubscribersCsv(filters);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (!result.csv || !result.filename) {
        setError("Unable to export subscribers. Please try again.");
        return;
      }

      downloadCsv(result.csv, result.filename);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled || isPending}
        className={`inline-flex items-center rounded-lg border border-hcx-border bg-hcx-card px-4 py-2.5 text-sm font-medium text-hcx-text transition-colors hover:border-hcx-cyan/40 hover:text-hcx-cyan disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
      >
        {isPending ? "Exporting…" : "Export CSV"}
      </button>
      {error ? (
        <p className="text-sm text-hcx-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
