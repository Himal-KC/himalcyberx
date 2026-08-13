import {
  threatCategories,
  threatLandscapeSummary,
} from "@/lib/sample-data";
import { SectionHeading } from "@/components/SectionHeading";
import { DemoBadge } from "@/components/DemoBadge";
import {
  AptIcon,
  ArrowRightIcon,
  MalwareIntelIcon,
  PhishingIcon,
  RansomwareIcon,
} from "@/components/icons";

const accentStyles = {
  red: {
    dot: "bg-hcx-red",
    icon: "text-hcx-red border-hcx-red/20 bg-hcx-red/5",
    status: "text-hcx-red",
    border: "hover:border-hcx-red/25",
  },
  cyan: {
    dot: "bg-hcx-cyan",
    icon: "text-hcx-cyan border-hcx-cyan/20 bg-hcx-cyan/5",
    status: "text-hcx-cyan",
    border: "hover:border-hcx-cyan/25",
  },
  orange: {
    dot: "bg-hcx-orange",
    icon: "text-hcx-orange border-hcx-orange/20 bg-hcx-orange/5",
    status: "text-hcx-orange",
    border: "hover:border-hcx-orange/25",
  },
  green: {
    dot: "bg-hcx-green",
    icon: "text-hcx-green border-hcx-green/20 bg-hcx-green/5",
    status: "text-hcx-green",
    border: "hover:border-hcx-green/25",
  },
};

const iconMap = {
  ransomware: RansomwareIcon,
  malware: MalwareIntelIcon,
  phishing: PhishingIcon,
  apt: AptIcon,
};

const gridPattern = {
  backgroundImage: `
    linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)
  `,
  backgroundSize: "20px 20px",
};

const linkFocus =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcx-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-hcx-bg-secondary";

export function ThreatIntelligence() {
  return (
    <section
      id="threat-intelligence"
      className="border-b border-hcx-border bg-hcx-bg-secondary py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="HCX Intelligence"
          title="Threat Intelligence"
          description="Track emerging attack techniques, adversaries and security risks."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {threatCategories.map((threat) => {
            const style = accentStyles[threat.accent];
            const Icon = iconMap[threat.icon];

            return (
              <article
                key={threat.category}
                className={`group relative flex flex-col overflow-hidden rounded-lg border border-hcx-border bg-hcx-card transition-colors duration-300 ${style.border}`}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-60"
                  style={gridPattern}
                  aria-hidden="true"
                />

                <div className="relative flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${style.icon}`}
                    >
                      <Icon />
                    </div>
                    <DemoBadge>Demo Data</DemoBadge>
                  </div>

                  <p className="mt-4 font-tech text-[10px] font-semibold uppercase tracking-[0.18em] text-hcx-text-secondary">
                    {threat.category}
                  </p>

                  <h3 className="mt-2 text-base font-semibold leading-snug text-hcx-text">
                    {threat.title}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-relaxed text-hcx-text-secondary">
                    {threat.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2 border-t border-hcx-border pt-4">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                      aria-hidden="true"
                    />
                    <span
                      className={`font-tech text-[11px] font-semibold uppercase tracking-wider ${style.status}`}
                    >
                      {threat.status}
                    </span>
                  </div>

                  <a
                    href="#"
                    className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-hcx-text-secondary transition-colors group-hover:text-hcx-cyan ${linkFocus}`}
                  >
                    View Intelligence
                    <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-hcx-border bg-hcx-card/80 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-tech text-[10px] font-semibold uppercase tracking-[0.2em] text-hcx-text-secondary">
                Threat Landscape
              </p>
              <p className="mt-1 text-xs text-hcx-text-secondary/80">
                Demo Intelligence Overview — not live data
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-6">
              {threatLandscapeSummary.map((item) => {
                const style = accentStyles[item.accent];
                return (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary">
                        {item.label}
                      </p>
                      <p
                        className={`font-tech text-sm font-semibold ${style.status}`}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
