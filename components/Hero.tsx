import { intelligenceCoverage } from "@/lib/sample-data";
import { ArrowRightIcon } from "@/components/icons";

const accentDot = {
  red: "bg-hcx-red",
  cyan: "bg-hcx-cyan",
  orange: "bg-hcx-orange",
  green: "bg-hcx-green",
} as const;

function HeroVisual() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      <div
        className="relative overflow-hidden rounded-2xl border border-hcx-border bg-hcx-card/60 shadow-[0_0_48px_rgba(0,217,255,0.05)]"
        aria-hidden="true"
      >
        <div className="relative aspect-[4/3] sm:aspect-[5/4]">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,217,255,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,217,255,0.06) 1px, transparent 1px)
              `,
              backgroundSize: "28px 28px",
            }}
          />

          <div className="absolute left-4 top-4 z-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-hcx-text-secondary">
              HCX Threat Research
            </p>
          </div>

          <div className="absolute right-4 top-4 z-10 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-hcx-green">
              Visual Intelligence
            </p>
            <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-hcx-text-secondary/70">
              Research visualization
            </p>
          </div>

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 400 320"
            fill="none"
          >
            <circle
              cx="200"
              cy="160"
              r="110"
              stroke="rgba(0,217,255,0.12)"
              strokeWidth="1"
            />
            <circle
              cx="200"
              cy="160"
              r="75"
              stroke="rgba(0,217,255,0.08)"
              strokeWidth="1"
            />
            <circle
              cx="200"
              cy="160"
              r="40"
              stroke="rgba(0,217,255,0.15)"
              strokeWidth="1"
            />

            <line
              x1="200"
              y1="50"
              x2="200"
              y2="270"
              stroke="rgba(0,217,255,0.06)"
            />
            <line
              x1="90"
              y1="160"
              x2="310"
              y2="160"
              stroke="rgba(0,217,255,0.06)"
            />
            <line
              x1="122"
              y1="82"
              x2="278"
              y2="238"
              stroke="rgba(0,217,255,0.04)"
            />
            <line
              x1="278"
              y1="82"
              x2="122"
              y2="238"
              stroke="rgba(0,217,255,0.04)"
            />

            <g className="animate-radar-sweep" style={{ transformOrigin: "200px 160px" }}>
              <path
                d="M200 160 L200 50 A110 110 0 0 1 277.8 97.2 Z"
                fill="rgba(0,217,255,0.06)"
              />
              <line
                x1="200"
                y1="160"
                x2="200"
                y2="50"
                stroke="rgba(0,217,255,0.35)"
                strokeWidth="1"
              />
            </g>

            <circle cx="200" cy="160" r="5" fill="#00D9FF" opacity="0.9" />
            <circle cx="200" cy="50" r="3.5" fill="#00E89D" opacity="0.85" />
            <circle cx="310" cy="160" r="3.5" fill="#00D9FF" opacity="0.75" />
            <circle cx="200" cy="270" r="3.5" fill="#00E89D" opacity="0.65" />
            <circle cx="90" cy="160" r="3.5" fill="#00D9FF" opacity="0.7" />
            <circle cx="122" cy="82" r="2.5" fill="#94A3B8" opacity="0.55" />
            <circle cx="278" cy="82" r="2.5" fill="#94A3B8" opacity="0.5" />
            <circle cx="278" cy="238" r="2.5" fill="#94A3B8" opacity="0.5" />
            <circle cx="122" cy="238" r="2.5" fill="#94A3B8" opacity="0.45" />
            <circle cx="248" cy="98" r="2" fill="#FF3B5C" opacity="0.7" />
            <circle cx="155" cy="215" r="2" fill="#FFB020" opacity="0.65" />
            <circle cx="265" cy="195" r="2" fill="#00E89D" opacity="0.55" />

            <line
              x1="200"
              y1="160"
              x2="200"
              y2="50"
              stroke="rgba(0,217,255,0.25)"
              strokeWidth="0.75"
            />
            <line
              x1="200"
              y1="160"
              x2="310"
              y2="160"
              stroke="rgba(0,217,255,0.2)"
              strokeWidth="0.75"
            />
            <line
              x1="200"
              y1="160"
              x2="248"
              y2="98"
              stroke="rgba(255,59,92,0.25)"
              strokeWidth="0.75"
            />
            <line
              x1="200"
              y1="160"
              x2="155"
              y2="215"
              stroke="rgba(255,176,32,0.2)"
              strokeWidth="0.75"
            />
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-hcx-border bg-hcx-bg/70 p-3 backdrop-blur-sm sm:grid-cols-4 sm:gap-3 sm:p-4">
          {intelligenceCoverage.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-hcx-border bg-hcx-card/80 px-2 py-2.5 text-center sm:px-3"
            >
              <span
                className={`mx-auto mb-2 block h-1.5 w-1.5 rounded-full ${accentDot[item.accent]}`}
                aria-hidden="true"
              />
              <p className="text-[9px] font-semibold uppercase tracking-wider text-hcx-text-secondary sm:text-[10px]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-hcx-border">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 30% 0%, rgba(0,217,255,0.07), transparent)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pt-10 pb-6 sm:px-6 sm:pt-12 sm:pb-8 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8 lg:pt-14 lg:pb-10">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-hcx-text-secondary sm:text-xs">
            Cybersecurity • Intelligence • Research
          </p>

          <h1 className="mt-4 text-3xl font-bold leading-[1.12] tracking-tight text-hcx-text sm:mt-5 sm:text-4xl lg:text-[2.75rem]">
            <span className="block">DECODE THE DIGITAL</span>
            <span className="block text-hcx-cyan">THREAT LANDSCAPE.</span>
          </h1>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-hcx-text-secondary sm:mt-5 sm:text-lg">
            Independent cybersecurity news, threat intelligence, security
            research and practical cyber labs.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-stretch">
            <a
              href="#latest-news"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-all hover:bg-hcx-cyan/90 hover:shadow-[0_0_20px_rgba(0,217,255,0.25)] sm:px-6 sm:py-3"
            >
              Explore Latest Stories
              <ArrowRightIcon className="shrink-0 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#cyber-lab"
              className="inline-flex items-center justify-center rounded-lg border border-hcx-border bg-hcx-card/50 px-5 py-2.5 text-sm font-semibold text-hcx-text transition-all hover:border-hcx-cyan/30 hover:bg-hcx-card sm:px-6 sm:py-3"
            >
              Explore Cyber Lab
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hcx-border/60 pt-5 text-[11px] font-medium uppercase tracking-wider text-hcx-text-secondary sm:text-xs">
            <span>HCX Threat Research</span>
            <span className="hidden text-hcx-border sm:inline" aria-hidden="true">
              |
            </span>
            <span>Visual Intelligence</span>
            <span className="hidden text-hcx-border sm:inline" aria-hidden="true">
              |
            </span>
            <span>Research visualization</span>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
