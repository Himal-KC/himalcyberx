"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AgentReviewPanel } from "@/components/admin/agent/AgentReviewPanel";
import {
  resumeAgentRun,
  type ResumeAgentRunState,
} from "@/lib/actions/agent";
import type { ResumableAgentRunSummary } from "@/lib/agent/resume/resume-core";
import { focusRing } from "@/lib/page-data";

const initialState: ResumeAgentRunState = {};

function contentTypeLabel(contentType: ResumableAgentRunSummary["contentType"]): string {
  switch (contentType) {
    case "article":
      return "Article";
    case "tutorial":
      return "Tutorial";
    case "lab":
      return "Cyber Lab";
  }
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AgentResumeRuns({
  runs,
}: {
  runs: ResumableAgentRunSummary[];
}) {
  const [state, formAction, isPending] = useActionState(
    resumeAgentRun,
    initialState,
  );

  if (runs.length === 0 && !state.resumed) {
    return null;
  }

  if (state.success && state.resumed) {
    const resumed = state.resumed;

    return (
      <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
              Resumed Agent Run
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
              Existing generated draft restored
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

        <AgentReviewPanel
          agentRunId={resumed.agentRunId}
          draft={resumed.draft}
          initialReview={resumed.latestReview}
          initialFeaturedImage={resumed.featuredImage}
        />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-hcx-text">Resume previous run</h2>
      <p className="mt-2 text-sm text-hcx-text-secondary">
        Continue with a persisted research run and generated draft without
        rerunning research or generation.
      </p>

      {state.error ? (
        <p className="mt-4 text-sm text-hcx-red">{state.error}</p>
      ) : null}

      <ul className="mt-5 space-y-3">
        {runs.map((run) => (
          <li
            key={run.agentRunId}
            className="rounded-lg border border-hcx-border bg-hcx-bg/40 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-hcx-cyan/30 bg-hcx-cyan/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hcx-cyan">
                    {contentTypeLabel(run.contentType)}
                  </span>
                  <span className="rounded-full border border-hcx-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hcx-text-secondary">
                    {run.status} · {run.stage}
                  </span>
                </div>
                <p className="mt-2 font-medium text-hcx-text">{run.topic}</p>
                {run.draftTitle ? (
                  <p className="mt-1 text-sm text-hcx-text-secondary">
                    Draft: {run.draftTitle}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-hcx-text-secondary">
                  Updated {formatTimestamp(run.updatedAt)}
                </p>
              </div>
              <form action={formAction}>
                <input type="hidden" name="agentRunId" value={run.agentRunId} />
                <button
                  type="submit"
                  disabled={isPending}
                  className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-70 ${focusRing}`}
                >
                  {isPending ? "Resuming..." : "Resume Run"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
