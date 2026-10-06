import type { ReactNode } from "react";

interface AnalyticsSectionPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AnalyticsSectionPanel({
  title,
  description,
  children,
}: AnalyticsSectionPanelProps) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-5 sm:p-6">
      <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-hcx-text-secondary">
          {description}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

interface AnalyticsPendingSectionPanelProps {
  title: string;
  description?: string;
  pendingMessage: string;
}

export function AnalyticsPendingSectionPanel({
  title,
  description,
  pendingMessage,
}: AnalyticsPendingSectionPanelProps) {
  return (
    <AnalyticsSectionPanel title={title} description={description}>
      <div
        className="flex min-h-[8rem] items-center justify-center rounded-lg border border-dashed border-hcx-border bg-hcx-bg-secondary/30 px-4 py-6 text-center text-sm text-hcx-text-secondary sm:min-h-[10rem]"
        role="status"
      >
        {pendingMessage}
      </div>
    </AnalyticsSectionPanel>
  );
}
