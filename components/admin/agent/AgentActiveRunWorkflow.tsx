"use client";

import Link from "next/link";
import { AgentResearchResults } from "@/components/admin/agent/AgentResearchResults";
import { AgentReviewPanel } from "@/components/admin/agent/AgentReviewPanel";
import type { AgentRunPageHydration } from "@/lib/agent/resume/resume-core";
import { focusRing } from "@/lib/page-data";

function contentTypeLabel(
  contentType: AgentRunPageHydration["resumed"]["contentType"],
): string {
  switch (contentType) {
    case "article":
      return "Article";
    case "tutorial":
      return "Tutorial";
    case "lab":
      return "Cyber Lab";
  }
}

export function AgentActiveRunWorkflow({
  hydration,
}: {
  hydration: AgentRunPageHydration;
}) {
  const resumed = hydration.resumed;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
              Active Agent Run
            </p>
            <h2 className="mt-2 text-lg font-semibold text-hcx-text">
              {resumed.draft.title}
            </h2>
            <p className="mt-2 text-sm text-hcx-text-secondary">
              {resumed.topic}
            </p>
          </div>
          <span className="rounded-full border border-hcx-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
            {contentTypeLabel(resumed.contentType)}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
              Run status
            </p>
            <p className="mt-1 text-sm text-hcx-text">
              {resumed.status} · {resumed.stage}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
              Run ID
            </p>
            <p className="mt-1 break-all font-mono text-xs text-hcx-text-secondary">
              {resumed.agentRunId}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
              Draft
            </p>
            <p className="mt-1 text-sm text-hcx-text">
              Persisted workflow restored from Supabase
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={resumed.draft.editUrl}
            className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 ${focusRing}`}
          >
            Edit Draft
          </Link>
          {resumed.draft.previewUrl ? (
            <Link
              href={resumed.draft.previewUrl}
              className={`inline-flex items-center rounded-lg border border-hcx-border px-4 py-2 text-sm font-semibold text-hcx-text hover:bg-hcx-bg/60 ${focusRing}`}
            >
              Preview Draft
            </Link>
          ) : null}
        </div>
      </div>

      {hydration.contentAwareness ? (
        <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-hcx-text">
            Topic Analysis (Restored)
          </h2>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            {hydration.contentAwareness.contentGapSummary ??
              "Persisted topic analysis restored from this run."}
          </p>
        </section>
      ) : null}

      <AgentResearchResults
        research={hydration.research}
        showGenerateDraft={false}
      />

      <AgentReviewPanel
        agentRunId={resumed.agentRunId}
        draft={resumed.draft}
        initialReview={resumed.latestReview}
        initialFeaturedImage={resumed.featuredImage}
        initialReadiness={resumed.latestReadiness}
        initialPublish={resumed.latestPublish}
      />
    </section>
  );
}
