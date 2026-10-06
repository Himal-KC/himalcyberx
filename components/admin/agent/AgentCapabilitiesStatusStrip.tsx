import {
  formatAgentCapabilityStateLabel,
  type AgentCapabilitiesOverallStatus,
  type AgentCapabilitiesStatusSnapshot,
  type AgentCapabilityState,
} from "@/lib/agent/capabilities/capabilities-core";

function overallBadgeClassName(
  overall: AgentCapabilitiesOverallStatus,
): string {
  switch (overall) {
    case "READY":
      return "border-hcx-green/40 bg-hcx-green/10 text-hcx-green";
    case "LIMITED":
      return "border-hcx-orange/40 bg-hcx-orange/10 text-hcx-orange";
    case "NOT READY":
      return "border-red-500/40 bg-red-500/10 text-red-400";
  }
}

function itemStateClassName(state: AgentCapabilityState): string {
  switch (state) {
    case "ready":
      return "border-hcx-green/30 bg-hcx-green/5 text-hcx-green";
    case "optional":
      return "border-hcx-cyan/30 bg-hcx-cyan/5 text-hcx-cyan";
    case "not_configured":
      return "border-hcx-orange/30 bg-hcx-orange/5 text-hcx-orange";
    case "unavailable":
      return "border-red-500/30 bg-red-500/5 text-red-400";
  }
}

export function AgentCapabilitiesStatusStrip({
  snapshot,
}: {
  snapshot: AgentCapabilitiesStatusSnapshot;
}) {
  return (
    <section
      className="mb-6 rounded-xl border border-hcx-border bg-hcx-card p-4 sm:p-5"
      aria-label="HCX Agent Status"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            HCX Agent Status
          </h2>
          <p className="mt-1 text-xs text-hcx-text-secondary">
            Read-only configuration and schema readiness for this environment.
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${overallBadgeClassName(snapshot.overall)}`}
        >
          {snapshot.overall}
        </span>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {snapshot.items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-hcx-border/80 bg-hcx-bg-secondary/20 px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-hcx-text">{item.label}</p>
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${itemStateClassName(item.state)}`}
              >
                {formatAgentCapabilityStateLabel(item.state)}
              </span>
            </div>
            {item.detail ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-hcx-text-secondary">
                {item.detail}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
