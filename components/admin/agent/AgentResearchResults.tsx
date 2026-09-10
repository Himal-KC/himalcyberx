"use client";

import Link from "next/link";
import type { ResearchResult, VerifiedClaimType } from "@/lib/agent/types";
import type { AgentContentType } from "@/lib/supabase/types";
import { focusRing } from "@/lib/page-data";

function qualityBadgeClass(quality: ResearchResult["researchQuality"]): string {
  switch (quality) {
    case "passed":
      return "border-hcx-green/40 bg-hcx-green/10 text-hcx-green";
    case "needs_review":
      return "border-hcx-orange/40 bg-hcx-orange/10 text-hcx-orange";
    default:
      return "border-hcx-red/40 bg-hcx-red/10 text-hcx-red";
  }
}

function confidenceBadgeClass(
  confidence: ResearchResult["researchConfidence"],
): string {
  switch (confidence) {
    case "high":
      return "border-hcx-green/40 bg-hcx-green/10 text-hcx-green";
    case "medium":
      return "border-hcx-cyan/40 bg-hcx-cyan/10 text-hcx-cyan";
    default:
      return "border-hcx-orange/40 bg-hcx-orange/10 text-hcx-orange";
  }
}

function claimTypeLabel(type: VerifiedClaimType): string {
  switch (type) {
    case "cve_id":
      return "CVE ID";
    case "affected_product":
      return "Affected product";
    case "affected_versions":
      return "Affected versions";
    case "cvss":
      return "CVSS";
    case "exploitation_status":
      return "Exploitation status";
    case "disclosure_date":
      return "Disclosure date";
    case "mitigation":
      return "Mitigation";
    case "patch_information":
      return "Patch information";
    case "threat_actor_attribution":
      return "Threat actor";
    case "techniques":
      return "Techniques";
    case "indicators":
      return "Indicators";
    case "guidance":
      return "Official guidance";
    default:
      return "Verified fact";
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

function buildAdminHref(contentType: AgentContentType, id: string): string {
  switch (contentType) {
    case "article":
      return `/admin/articles/${id}/edit`;
    case "tutorial":
      return `/admin/tutorials/${id}/edit`;
    case "lab":
      return `/admin/labs/${id}/edit`;
  }
}

export function AgentResearchResults({ research }: { research: ResearchResult }) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-hcx-text">Research Brief</h2>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${qualityBadgeClass(research.researchQuality)}`}
        >
          {research.researchQuality.replace("_", " ")}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${confidenceBadgeClass(research.researchConfidence)}`}
        >
          {research.researchConfidence} confidence
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
            Content Type
          </p>
          <p className="mt-1 text-sm text-hcx-text">
            {contentTypeLabel(research.contentType)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
            Topic
          </p>
          <p className="mt-1 text-sm text-hcx-text">{research.topic}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
            Primary Keyword
          </p>
          <p className="mt-1 text-sm text-hcx-text">{research.primaryKeyword}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
            Secondary Keywords
          </p>
          <p className="mt-1 text-sm text-hcx-text">
            {research.secondaryKeywords.length > 0
              ? research.secondaryKeywords.join(", ")
              : "None"}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-hcx-border bg-hcx-bg/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
          Recommended Angle
        </p>
        <p className="mt-2 text-sm leading-relaxed text-hcx-text">
          {research.recommendedAngle}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-hcx-border bg-hcx-bg/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-hcx-text-secondary">
          Research Summary
        </p>
        <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
          {research.summary}
        </p>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-hcx-text">Key Findings</h3>
        {research.keyFindings.length === 0 ? (
          <p className="mt-2 text-sm text-hcx-text-secondary">
            No key findings were recorded.
          </p>
        ) : (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-hcx-text-secondary">
            {research.keyFindings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-hcx-text">Verified Claims</h3>
          {research.verifiedClaims.length === 0 ? (
            <p className="mt-2 text-sm text-hcx-text-secondary">
              No verified claims were recorded.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {research.verifiedClaims.map((claim) => (
                <li
                  key={claim.id}
                  className="rounded-lg border border-hcx-border bg-hcx-bg/40 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-hcx-cyan">
                      {claimTypeLabel(claim.type)}
                    </p>
                    <span className="rounded-full border border-hcx-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-hcx-text-secondary">
                      {claim.confidence}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-hcx-text">
                    {claim.statement}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {claim.sources.map((source) => (
                      <li key={`${claim.id}-${source.url}`}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs text-hcx-cyan hover:underline ${focusRing}`}
                        >
                          {source.publisher ?? source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-hcx-text">
            Needs Review / Uncertain Claims
          </h3>
          {research.uncertainClaims.length === 0 ? (
            <p className="mt-2 text-sm text-hcx-text-secondary">
              No uncertain claims were recorded.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {research.uncertainClaims.map((claim) => (
                <li
                  key={claim.id}
                  className="rounded-lg border border-hcx-orange/30 bg-hcx-orange/5 p-4"
                >
                  <p className="font-medium text-hcx-text">{claim.label}</p>
                  <p className="mt-2 text-sm text-hcx-text-secondary">
                    {claim.reason}
                  </p>
                  {claim.partialValue ? (
                    <p className="mt-2 text-sm text-hcx-orange">
                      {claim.partialValue}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {research.discoveryContexts.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-hcx-text">
            Discovery Context
          </h3>
          <p className="mt-1 text-sm text-hcx-text-secondary">
            Search excerpts used to identify sources. These are not verified
            claims.
          </p>
          <ul className="mt-3 space-y-3">
            {research.discoveryContexts.map((context) => (
              <li
                key={context.url}
                className="rounded-lg border border-hcx-border/70 bg-hcx-bg/20 p-4"
              >
                <p className="font-medium text-hcx-text">{context.title}</p>
                <p className="mt-1 text-xs text-hcx-text-secondary">
                  {context.publisher ?? "Unknown publisher"}
                </p>
                {context.excerpt ? (
                  <p className="mt-2 text-sm italic text-hcx-text-secondary">
                    {context.excerpt}
                  </p>
                ) : null}
                <a
                  href={context.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-2 inline-flex text-sm text-hcx-cyan hover:underline ${focusRing}`}
                >
                  {context.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-hcx-text">Sources</h3>
        {research.sources.length === 0 ? (
          <p className="mt-2 text-sm text-hcx-text-secondary">
            No sources were saved.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {research.sources.map((source) => (
              <li
                key={source.url}
                className="rounded-lg border border-hcx-border bg-hcx-bg/40 p-4"
              >
                <p className="font-medium text-hcx-text">{source.title}</p>
                <p className="mt-1 text-sm text-hcx-text-secondary">
                  {source.publisher ?? "Unknown publisher"}
                  {source.sourceType ? ` · ${source.sourceType}` : ""}
                </p>
                {source.supportsClaims && source.supportsClaims.length > 0 ? (
                  <p className="mt-2 text-xs text-hcx-text-secondary">
                    Supports {source.supportsClaims.length} verified claim
                    {source.supportsClaims.length === 1 ? "" : "s"}
                  </p>
                ) : null}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-2 inline-flex text-sm text-hcx-cyan hover:underline ${focusRing}`}
                >
                  {source.url}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-hcx-text">Related HCX Content</h3>
        {research.relatedHCXContent.length === 0 ? (
          <p className="mt-2 text-sm text-hcx-text-secondary">
            No related HimalCyberX content was identified.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {research.relatedHCXContent.map((item) => (
              <li
                key={`${item.contentType}-${item.id}`}
                className="rounded-lg border border-hcx-border bg-hcx-bg/40 p-4"
              >
                <p className="font-medium text-hcx-text">{item.title}</p>
                <p className="mt-1 text-sm text-hcx-text-secondary">
                  {item.similarityScore}% match · {item.reason}
                </p>
                <Link
                  href={buildAdminHref(item.contentType, item.id)}
                  className={`mt-2 inline-flex text-sm text-hcx-cyan hover:underline ${focusRing}`}
                >
                  Open in admin
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 border-t border-hcx-border pt-6">
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center rounded-lg border border-hcx-border px-5 py-2.5 text-sm font-semibold text-hcx-text-secondary opacity-70"
        >
          Generate Content
        </button>
        <p className="mt-2 text-sm text-hcx-text-secondary">
          Content generation coming in Phase 4.
        </p>
      </div>
    </section>
  );
}
