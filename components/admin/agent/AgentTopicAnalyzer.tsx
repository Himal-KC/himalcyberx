"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { AgentActiveRunWorkflow } from "@/components/admin/agent/AgentActiveRunWorkflow";
import { AgentResearchResults } from "@/components/admin/agent/AgentResearchResults";
import { AgentResumeRuns } from "@/components/admin/agent/AgentResumeRuns";
import {
  analyzeAgentTopic,
  researchAgentTopic,
  type AgentTopicAnalysisMatch,
  type AnalyzeAgentTopicState,
} from "@/lib/actions/agent";
import type {
  AgentRunPageHydration,
  ResumableAgentRunSummary,
} from "@/lib/agent/resume/resume-core";
import type { AgentContentType } from "@/lib/supabase/types";
import { focusRing } from "@/lib/page-data";

const contentTypeOptions: Array<{
  value: AgentContentType;
  label: string;
  description: string;
}> = [
  {
    value: "article",
    label: "Article",
    description: "Long-form threat intelligence and security research.",
  },
  {
    value: "tutorial",
    label: "Tutorial",
    description: "Step-by-step defensive and technical walkthroughs.",
  },
  {
    value: "lab",
    label: "Cyber Lab",
    description: "Hands-on guided lab exercises and practical scenarios.",
  },
];

const researchStageMessages = [
  "Creating research run…",
  "Finding authoritative sources…",
  "Verifying cybersecurity evidence…",
  "Building HCX research brief…",
];

const inputClass =
  "mt-2 w-full rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "block text-sm font-medium text-hcx-text";

function riskBadgeClass(risk: AnalyzeAgentTopicState["duplicateRisk"]): string {
  switch (risk) {
    case "high":
      return "border-hcx-red/40 bg-hcx-red/10 text-hcx-red";
    case "medium":
      return "border-hcx-orange/40 bg-hcx-orange/10 text-hcx-orange";
    default:
      return "border-hcx-green/40 bg-hcx-green/10 text-hcx-green";
  }
}

function contentTypeBadgeClass(contentType: AgentContentType): string {
  switch (contentType) {
    case "article":
      return "border-hcx-cyan/30 bg-hcx-cyan/10 text-hcx-cyan";
    case "tutorial":
      return "border-hcx-green/30 bg-hcx-green/10 text-hcx-green";
    case "lab":
      return "border-hcx-orange/30 bg-hcx-orange/10 text-hcx-orange";
  }
}

function contentTypeLabel(contentType: AgentContentType): string {
  switch (contentType) {
    case "article":
      return "Article";
    case "tutorial":
      return "Tutorial";
    case "lab":
      return "Cyber Lab";
  }
}

function MatchList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: AgentTopicAnalysisMatch[];
  emptyMessage: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-hcx-text">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-hcx-text-secondary">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li
              key={`${item.contentType}-${item.id}`}
              className="rounded-lg border border-hcx-border bg-hcx-bg/40 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${contentTypeBadgeClass(item.contentType)}`}
                >
                  {contentTypeLabel(item.contentType)}
                </span>
                {item.status ? (
                  <span className="rounded-full border border-hcx-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hcx-text-secondary">
                    {item.status}
                  </span>
                ) : null}
                <span className="text-xs font-semibold text-hcx-cyan">
                  {item.similarityScore}% match
                </span>
              </div>
              <p className="mt-2 font-medium text-hcx-text">{item.title}</p>
              <p className="mt-1 text-sm text-hcx-text-secondary">{item.reason}</p>
              <Link
                href={item.adminHref}
                className={`mt-3 inline-flex text-sm text-hcx-cyan hover:underline ${focusRing}`}
              >
                Open in admin
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AgentTopicAnalyzer({
  resumableRuns = [],
  initialHydration = null,
  hydrationError = null,
  activeRunId = null,
  startNew = false,
}: {
  resumableRuns?: ResumableAgentRunSummary[];
  initialHydration?: AgentRunPageHydration | null;
  hydrationError?: string | null;
  activeRunId?: string | null;
  startNew?: boolean;
}) {
  const router = useRouter();
  const [analysisState, analyzeAction, isAnalyzing] = useActionState(
    analyzeAgentTopic,
    {},
  );
  const [researchState, researchAction, isResearching] = useActionState(
    researchAgentTopic,
    {},
  );
  const [contentType, setContentType] = useState<AgentContentType>("article");
  const [topic, setTopic] = useState("");
  const [researchStageIndex, setResearchStageIndex] = useState(0);

  useEffect(() => {
    if (!isResearching) {
      return;
    }

    const interval = window.setInterval(() => {
      setResearchStageIndex((current) =>
        Math.min(current + 1, researchStageMessages.length - 1),
      );
    }, 2500);

    return () => window.clearInterval(interval);
  }, [isResearching]);

  useEffect(() => {
    if (!researchState.success || !researchState.research?.agentRunId) {
      return;
    }

    router.replace(`/admin/agent?run=${researchState.research.agentRunId}`, {
      scroll: false,
    });
  }, [researchState.success, researchState.research?.agentRunId, router]);

  const showNewTopicFlow = startNew || !initialHydration;

  const analyzedContentType = analysisState.contentType ?? contentType;
  const analyzedLabel =
    contentTypeOptions.find((option) => option.value === analyzedContentType)
      ?.label ?? "Article";

  const canContinueResearch =
    analysisState.success === true && analysisState.safeToContinue !== false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {initialHydration || resumableRuns.length > 0 ? (
          <Link
            href="/admin/agent?new=1"
            className={`inline-flex items-center rounded-lg border border-hcx-border px-4 py-2 text-sm font-semibold text-hcx-text hover:bg-hcx-bg/60 ${focusRing}`}
          >
            New Agent Run
          </Link>
        ) : null}
        {activeRunId ? (
          <p className="text-xs text-hcx-text-secondary">
            Active run restored from persisted state.
          </p>
        ) : null}
      </div>

      {hydrationError ? (
        <div className="rounded-lg border border-hcx-orange/30 bg-hcx-orange/5 p-4 text-sm text-hcx-orange">
          {hydrationError}
        </div>
      ) : null}

      {initialHydration && !startNew ? (
        <AgentActiveRunWorkflow hydration={initialHydration} />
      ) : null}

      <AgentResumeRuns
        runs={resumableRuns}
        activeRunId={activeRunId}
      />

      {showNewTopicFlow ? (
        <>
      <form action={analyzeAction} className="space-y-6">
        <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-hcx-text">
            What do you want to create?
          </h2>
          <p className="mt-2 text-sm text-hcx-text-secondary">
            Choose one content type, then analyze how this topic fits existing
            HimalCyberX content.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {contentTypeOptions.map((option) => {
              const selected = contentType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setContentType(option.value)}
                  className={`rounded-xl border p-5 text-left transition-colors ${focusRing} ${
                    selected
                      ? "border-hcx-cyan/40 bg-hcx-cyan/10"
                      : "border-hcx-border bg-hcx-bg/40 hover:border-hcx-cyan/25"
                  }`}
                >
                  <p className="font-semibold text-hcx-text">{option.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <input type="hidden" name="contentType" value={contentType} />

          <div className="mt-6">
            <label htmlFor="agent-topic" className={labelClass}>
              Topic
            </label>
            <textarea
              id="agent-topic"
              name="topic"
              rows={4}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. CVE-2026-33824 Windows IKE remote code execution vulnerability"
              className={inputClass}
              disabled={isAnalyzing || isResearching}
            />
          </div>

          {analysisState.error ? (
            <p className="mt-4 text-sm text-hcx-red">{analysisState.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isAnalyzing || isResearching || topic.trim().length < 8}
            className={`mt-6 inline-flex items-center rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
          >
            {isAnalyzing ? "Analyzing HimalCyberX content..." : "Analyze Topic"}
          </button>
        </section>
      </form>

      {analysisState.success ? (
        <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-hcx-text">Analysis Results</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
                Content Type
              </p>
              <p className="mt-1 text-sm text-hcx-text">{analyzedLabel}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
                Topic
              </p>
              <p className="mt-1 text-sm text-hcx-text">{analysisState.topic}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
                Duplicate Risk
              </p>
              <span
                className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${riskBadgeClass(analysisState.duplicateRisk)}`}
              >
                {analysisState.duplicateRisk ?? "low"}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
                Recommended Category
              </p>
              <p className="mt-1 text-sm text-hcx-text">
                {analysisState.recommendedCategory?.name?.trim()
                  ? analysisState.recommendedCategory.name
                  : "No strong category match"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-hcx-border bg-hcx-bg/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
              Content Gap
            </p>
            <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
              {analysisState.contentGapSummary}
            </p>
          </div>

          {analysisState.duplicateRisk === "high" ? (
            <p className="mt-4 text-sm text-hcx-orange">
              High overlap detected. Review existing content before continuing.
            </p>
          ) : null}

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <MatchList
              title="Similar Existing Content"
              items={analysisState.similarContent ?? []}
              emptyMessage="No strong duplicate matches found."
            />
            <MatchList
              title="Related HCX Content"
              items={analysisState.relatedContent ?? []}
              emptyMessage="No related content matches found."
            />
          </div>

          <div className="mt-8 border-t border-hcx-border pt-6">
            <form
              action={researchAction}
              onSubmit={() => setResearchStageIndex(0)}
            >
              <input
                type="hidden"
                name="contentType"
                value={analysisState.contentType ?? contentType}
              />
              <input
                type="hidden"
                name="topic"
                value={analysisState.topic ?? topic}
              />
              <button
                type="submit"
                disabled={!canContinueResearch || isResearching || isAnalyzing}
                className={`inline-flex items-center rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
              >
                {isResearching ? researchStageMessages[researchStageIndex] : "Continue to Research"}
              </button>
            </form>
            {researchState.error ? (
              <p className="mt-3 text-sm text-hcx-red">{researchState.error}</p>
            ) : null}
            {analysisState.safeToContinue === false ? (
              <p className="mt-2 text-sm text-hcx-orange">
                Review similar content before moving to research.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {researchState.success && researchState.research ? (
        <AgentResearchResults research={researchState.research} />
      ) : null}
        </>
      ) : null}
    </div>
  );
}
