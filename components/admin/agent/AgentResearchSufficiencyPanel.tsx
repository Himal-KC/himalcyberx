"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  improveAgentResearch,
  type ImproveAgentResearchState,
} from "@/lib/actions/agent";
import { buildResearchCoverageLines } from "@/lib/agent/research/research-sufficiency-core";
import type { ResearchResult } from "@/lib/agent/types";
import { focusRing } from "@/lib/page-data";

const initialImproveState: ImproveAgentResearchState = {};

export function AgentResearchSufficiencyPanel({
  research,
  onResearchUpdated,
}: {
  research: ResearchResult;
  onResearchUpdated?: (research: ResearchResult) => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    improveAgentResearch,
    initialImproveState,
  );
  const assessment = research.researchSufficiency;
  const canImprove =
    assessment?.status === "needs_more_research" &&
    (research.researchImprovementCount ?? 0) < 3;

  useEffect(() => {
    if (!state.success || !state.research) {
      return;
    }

    onResearchUpdated?.(state.research);
    router.refresh();
  }, [state.success, state.research, onResearchUpdated, router]);

  if (!assessment || assessment.status === "sufficient") {
    return null;
  }

  const coverageLines = buildResearchCoverageLines(assessment);

  return (
    <div className="mt-4 rounded-lg border border-hcx-orange/30 bg-hcx-orange/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-hcx-orange">
        {assessment.status === "blocked"
          ? "Research Blocked"
          : "More Research Needed"}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
        The verified evidence does not yet provide enough topic-specific coverage
        to produce a well-grounded draft.
      </p>

      {coverageLines.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
            Research coverage
          </p>
          <ul className="mt-2 space-y-1 text-sm text-hcx-text-secondary">
            {coverageLines.map((line) => (
              <li key={line.label}>
                {line.ok ? "✓" : "✗"} {line.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.error ? (
        <p className="mt-3 text-sm text-hcx-red">{state.error}</p>
      ) : null}

      {canImprove ? (
        <form action={formAction} className="mt-4">
          <input type="hidden" name="agentRunId" value={research.agentRunId} />
          <button
            type="submit"
            disabled={isPending}
            className={`inline-flex items-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2 text-sm font-semibold text-hcx-cyan hover:bg-hcx-cyan/20 disabled:opacity-70 ${focusRing}`}
          >
            {isPending ? "Improving Research…" : "Improve Research"}
          </button>
          <p className="mt-2 text-xs text-hcx-text-secondary">
            Runs a bounded follow-up research pass targeting missing evidence areas.
            Uses the same rate limits as initial research.
          </p>
        </form>
      ) : null}
    </div>
  );
}

export function mergeResearchViewUpdate(
  current: ResearchResult,
  next: ResearchResult,
): ResearchResult {
  return next.agentRunId === current.agentRunId ? next : current;
}
