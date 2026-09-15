"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  evaluateAgentReadiness,
  type EvaluateAgentReadinessState,
} from "@/lib/actions/agent";
import type { GenerateDraftResult } from "@/lib/agent/generation/types";
import type { RunReadinessResult } from "@/lib/agent/readiness/types";
import { focusRing } from "@/lib/page-data";

const initialState: EvaluateAgentReadinessState = {};

function statusBadgeClass(status: RunReadinessResult["status"]): string {
  switch (status) {
    case "READY_TO_PUBLISH":
      return "border-hcx-green/40 bg-hcx-green/10 text-hcx-green";
    case "NEEDS_REVIEW":
      return "border-hcx-orange/40 bg-hcx-orange/10 text-hcx-orange";
    default:
      return "border-hcx-red/40 bg-hcx-red/10 text-hcx-red";
  }
}

function statusLabel(status: RunReadinessResult["status"]): string {
  switch (status) {
    case "READY_TO_PUBLISH":
      return "READY TO PUBLISH";
    case "NEEDS_REVIEW":
      return "NEEDS REVIEW";
    default:
      return "BLOCKED";
  }
}

function checkLabel(status: "pass" | "warning" | "fail"): string {
  switch (status) {
    case "pass":
      return "Pass";
    case "warning":
      return "Needs attention";
    default:
      return "Failed";
  }
}

export function AgentReadinessPanel({
  agentRunId,
  draft,
  initialReadiness = null,
}: {
  agentRunId: string;
  draft: GenerateDraftResult;
  initialReadiness?: RunReadinessResult | null;
}) {
  const [state, formAction, isPending] = useActionState(
    evaluateAgentReadiness,
    initialReadiness ? { success: true, readiness: initialReadiness } : initialState,
  );

  const readiness = state.readiness ?? initialReadiness;

  return (
    <div className="mt-8 rounded-xl border border-hcx-border bg-hcx-bg/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Phase 7 — Final Readiness
          </p>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            Deterministic publication readiness check. Nothing is published
            automatically.
          </p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="agentRunId" value={agentRunId} />
          <button
            type="submit"
            disabled={isPending}
            className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-70 ${focusRing}`}
          >
            {isPending ? "Checking readiness..." : "Run Final Readiness Check"}
          </button>
        </form>
      </div>

      {state.error ? (
        <div className="mt-4 rounded-lg border border-hcx-red/30 bg-hcx-red/5 p-4 text-sm text-hcx-red">
          {state.error}
        </div>
      ) : null}

      {readiness ? (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClass(readiness.status)}`}
            >
              {statusLabel(readiness.status)}
            </span>
            <span className="inline-flex items-center rounded-full border border-hcx-border px-3 py-1 text-xs font-semibold text-hcx-text">
              Readiness score: {readiness.readinessScore}
            </span>
            {readiness.stale ? (
              <span className="inline-flex items-center rounded-full border border-hcx-orange/40 bg-hcx-orange/10 px-3 py-1 text-xs font-semibold text-hcx-orange">
                Stale — rerun required
              </span>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Phase 5" value={`${readiness.phase5Status ?? "none"} · ${readiness.phase5QualityScore ?? "—"}`} />
            <SummaryCard label="Featured image" value={checkLabel(readiness.checks.image)} />
            <SummaryCard label="SEO" value={checkLabel(readiness.checks.seo)} />
            <SummaryCard label="Sources" value={checkLabel(readiness.checks.source)} />
            <SummaryCard label="Internal links" value={checkLabel(readiness.checks.internalLinks)} />
            <SummaryCard label="CMS completeness" value={checkLabel(readiness.checks.cms)} />
            <SummaryCard label="Structure" value={checkLabel(readiness.checks.structure)} />
            <SummaryCard label="Alt text" value={checkLabel(readiness.checks.altText)} />
          </div>

          {readiness.blockingIssues.length > 0 ? (
            <IssueGroup
              title="Blocking issues"
              issues={readiness.blockingIssues}
              tone="blocking"
            />
          ) : null}

          {readiness.warningIssues.length > 0 ? (
            <IssueGroup
              title="Needs attention"
              issues={readiness.warningIssues}
              tone="warning"
            />
          ) : null}

          {readiness.passedChecks.length > 0 ? (
            <div className="rounded-lg border border-hcx-border p-4">
              <h3 className="text-sm font-semibold text-hcx-text">Passed checks</h3>
              <ul className="mt-3 space-y-2 text-sm text-hcx-text-secondary">
                {readiness.passedChecks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href={readiness.editUrl ?? draft.editUrl}
              className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 ${focusRing}`}
            >
              Open Draft
            </Link>
            {(readiness.previewUrl ?? draft.previewUrl) ? (
              <Link
                href={readiness.previewUrl ?? draft.previewUrl ?? "#"}
                className={`inline-flex items-center rounded-lg border border-hcx-border px-4 py-2 text-sm font-semibold text-hcx-text hover:bg-hcx-bg/60 ${focusRing}`}
              >
                Preview Draft
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hcx-border p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-hcx-text">{value}</p>
    </div>
  );
}

function IssueGroup({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: RunReadinessResult["issues"];
  tone: "blocking" | "warning";
}) {
  return (
    <div className="rounded-lg border border-hcx-border p-4">
      <h3 className="text-sm font-semibold text-hcx-text">{title}</h3>
      <ul className="mt-3 space-y-3">
        {issues.map((issue) => (
          <li
            key={issue.code}
            className={`rounded-lg border p-3 text-sm ${
              tone === "blocking"
                ? "border-hcx-red/30 bg-hcx-red/5 text-hcx-red"
                : "border-hcx-orange/30 bg-hcx-orange/5 text-hcx-orange"
            }`}
          >
            <p className="font-semibold">{issue.message}</p>
            <p className="mt-1 text-hcx-text-secondary">{issue.recommendedAction}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
