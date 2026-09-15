"use client";

import Link from "next/link";
import { AgentApplyCategoryPanel } from "@/components/admin/agent/AgentApplyCategoryPanel";
import { AgentResearchResults } from "@/components/admin/agent/AgentResearchResults";
import { AgentReviewPanel } from "@/components/admin/agent/AgentReviewPanel";
import type { AgentRunPageHydration } from "@/lib/agent/resume/resume-core";
import type { StatusPresentationTone } from "@/lib/agent/status/presentation";
import { contentTypeAdminLabel } from "@/lib/agent/status/presentation";
import { focusRing } from "@/lib/page-data";

function summaryToneClass(tone: StatusPresentationTone): string {
  switch (tone) {
    case "success":
      return "text-hcx-green";
    case "warning":
      return "text-hcx-orange";
    case "danger":
      return "text-hcx-red";
    case "info":
      return "text-hcx-cyan";
    default:
      return "text-hcx-text";
  }
}

export function AgentActiveRunWorkflow({
  hydration,
}: {
  hydration: AgentRunPageHydration;
}) {
  const resumed = hydration.resumed;
  const presentation = hydration.presentation;

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
            {contentTypeAdminLabel(resumed.contentType)}
          </span>
        </div>

        <div className="mt-4 rounded-lg border border-hcx-border bg-hcx-bg/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
            Run summary
          </p>
          <dl className="mt-3 space-y-2">
            {presentation.summaryLines.map((line) => (
              <div
                key={line.domain}
                className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
                  {line.label}
                </dt>
                <dd className={`text-sm font-medium ${summaryToneClass(line.tone)}`}>
                  {line.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

      {resumed.contentType === "article" ? (
        <AgentApplyCategoryPanel
          agentRunId={resumed.agentRunId}
          applicableCategory={hydration.applicableArticleCategory}
          currentCategoryId={hydration.linkedArticleCategoryId}
        />
      ) : null}

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
