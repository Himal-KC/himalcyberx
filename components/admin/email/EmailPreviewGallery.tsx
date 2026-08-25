"use client";

import { useState } from "react";
import type { EmailPreviewItem } from "@/lib/email/preview-fixtures";
import { focusRing } from "@/lib/page-data";

interface EmailPreviewGalleryProps {
  items: EmailPreviewItem[];
}

export function EmailPreviewGallery({ items }: EmailPreviewGalleryProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  if (!activeItem) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveId(item.id)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${focusRing} ${
              activeItem.id === item.id
                ? "border-hcx-cyan/40 bg-hcx-cyan/10 text-hcx-cyan"
                : "border-hcx-border bg-hcx-card text-hcx-text-secondary hover:border-hcx-cyan/25 hover:text-hcx-cyan"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-hcx-border bg-hcx-card p-4 sm:p-6">
        <p className="text-sm text-hcx-text-secondary">
          Subject:{" "}
          <span className="font-medium text-hcx-text">{activeItem.subject}</span>
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border border-hcx-border bg-[#070b14]">
          <iframe
            title={`${activeItem.label} email preview`}
            srcDoc={activeItem.html}
            className="h-[820px] w-full border-0 bg-white"
            sandbox=""
          />
        </div>
      </div>
    </div>
  );
}
