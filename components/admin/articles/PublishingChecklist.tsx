"use client";

import {
  buildPublishChecklist,
  type PublishChecklistInput,
} from "@/lib/articles/publish-checklist";

interface PublishingChecklistProps {
  values: PublishChecklistInput;
}

export function PublishingChecklist({ values }: PublishingChecklistProps) {
  const items = buildPublishChecklist(values);
  const incompleteCount = items.filter((item) => !item.complete).length;

  return (
    <div className="rounded-lg border border-hcx-border bg-hcx-bg/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-hcx-text">Pre-publish checklist</p>
        <span className="text-xs text-hcx-text-secondary">
          {items.length - incompleteCount}/{items.length} ready
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm">
            <span
              aria-hidden="true"
              className={
                item.complete ? "text-hcx-green" : "text-hcx-orange"
              }
            >
              {item.complete ? "✓" : "!"}
            </span>
            <span className="text-hcx-text-secondary">
              <span className={item.complete ? "text-hcx-text" : undefined}>
                {item.label}
              </span>
              {item.detail ? (
                <span className="mt-0.5 block text-xs text-hcx-text-secondary">
                  {item.detail}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {incompleteCount > 0 ? (
        <p className="mt-3 text-xs text-hcx-text-secondary">
          Drafts can be saved anytime. Publishing will warn if items are missing.
        </p>
      ) : null}
    </div>
  );
}
