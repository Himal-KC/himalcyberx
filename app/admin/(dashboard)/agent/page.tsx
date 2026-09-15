import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AgentTopicAnalyzer } from "@/components/admin/agent/AgentTopicAnalyzer";
import {
  buildAgentRunResumeHref,
  parseAgentRunPageQuery,
} from "@/lib/agent/resume/resume-core";
import { resolveAgentPageHydration } from "@/lib/agent/resume/resume-run";
import { getAuthenticatedServerClient } from "@/lib/supabase/admin-session";

export const metadata: Metadata = {
  title: "HCX Agent | HCX Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string; new?: string }>;
}) {
  const params = await searchParams;
  const query = parseAgentRunPageQuery(params);
  const auth = await getAuthenticatedServerClient("adminAgentPage");

  const resolved = auth.ok
    ? await resolveAgentPageHydration(auth.supabase, {
        requestedRunId: query.requestedRunId,
        startNew: query.startNew,
      })
    : {
        hydration: null,
        resumableRuns: [],
        hydrationError: null,
        activeRunId: null,
      };

  if (
    auth.ok &&
    resolved.hydration &&
    !query.requestedRunId &&
    !query.startNew
  ) {
    redirect(buildAgentRunResumeHref(resolved.hydration.agentRunId));
  }

  return (
    <div>
      <div className="mb-8">
        <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Content Automation
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-hcx-text">
            HCX Content Agent
          </h1>
          <span className="inline-flex items-center rounded-full border border-hcx-cyan/30 bg-hcx-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-hcx-cyan">
            Phase 5 — Fact-check Review
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-hcx-text-secondary">
          Research, create, verify and prepare high-quality cybersecurity
          content for HimalCyberX. Choose a content type and analyze how your
          topic fits the existing site before generation begins.
        </p>
      </div>

      <AgentTopicAnalyzer
        key={resolved.activeRunId ?? (query.startNew ? "new-agent-run" : "no-active-run")}
        resumableRuns={resolved.resumableRuns}
        initialHydration={resolved.hydration}
        hydrationError={resolved.hydrationError}
        activeRunId={resolved.activeRunId}
        startNew={query.startNew}
      />
    </div>
  );
}
