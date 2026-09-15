"use client";

import Link from "next/link";
import type { ResumableAgentRunSummary } from "@/lib/agent/resume/resume-core";
import { focusRing } from "@/lib/page-data";

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
  activeRunId = null,
}: {
  runs: ResumableAgentRunSummary[];
  activeRunId?: string | null;
}) {
  const otherRuns = activeRunId
    ? runs.filter((run) => run.agentRunId !== activeRunId)
    : runs;

  if (runs.length === 0) {
    return null;
  }

  if (activeRunId && otherRuns.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-hcx-text">
        {activeRunId ? "Switch to another run" : "Resume previous run"}
      </h2>
      <p className="mt-2 text-sm text-hcx-text-secondary">
        Continue with a persisted research run and generated draft without
        rerunning research or generation.
      </p>

      <ul className="mt-5 space-y-3">
        {(activeRunId ? otherRuns : runs).map((run) => (
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
              <Link
                href={`/admin/agent?run=${run.agentRunId}`}
                className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 ${focusRing}`}
              >
                Resume Run
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
