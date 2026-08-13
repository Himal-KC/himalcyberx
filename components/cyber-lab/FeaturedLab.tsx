import { featuredLab } from "@/lib/sample-data";
import { gridPattern, buttonFocus } from "@/components/cyber-lab/constants";
import { ArrowRightIcon } from "@/components/icons";

export function FeaturedLab() {
  return (
    <div className="mt-12 md:mt-14">
      <p className="font-tech text-[10px] font-semibold uppercase tracking-[0.2em] text-hcx-cyan">
        Featured Lab
      </p>

      <div className="relative mt-4 overflow-hidden rounded-lg border border-hcx-cyan/20 bg-hcx-card">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={gridPattern}
          aria-hidden="true"
        />

        <div className="relative grid gap-6 p-6 md:grid-cols-5 md:gap-8 md:p-8">
          <div className="md:col-span-3">
            <h3 className="text-xl font-bold leading-snug text-hcx-text md:text-2xl">
              {featuredLab.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-hcx-text-secondary md:text-base">
              {featuredLab.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded border border-hcx-green/25 bg-hcx-green/10 px-2.5 py-1 font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-green">
                Educational Lab
              </span>
              <span className="rounded border border-hcx-border bg-hcx-bg/60 px-2.5 py-1 font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary">
                Authorized Environments Only
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 md:col-span-2">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary">
                  Difficulty
                </dt>
                <dd className="mt-1 font-medium text-hcx-green">
                  {featuredLab.difficulty}
                </dd>
              </div>
              <div>
                <dt className="font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary">
                  Estimated Time
                </dt>
                <dd className="mt-1 text-hcx-text">
                  {featuredLab.estimatedTime}
                </dd>
              </div>
              <div>
                <dt className="font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary">
                  Tools
                </dt>
                <dd className="mt-1 font-tech text-hcx-cyan">
                  {featuredLab.tools.join(", ")}
                </dd>
              </div>
              <div>
                <dt className="font-tech text-[10px] font-semibold uppercase tracking-wider text-hcx-text-secondary">
                  Environment
                </dt>
                <dd className="mt-1 text-hcx-text">
                  {featuredLab.environment}
                </dd>
              </div>
            </dl>

            <a
              href="#"
              className={`inline-flex items-center justify-center gap-2 rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-colors hover:bg-hcx-cyan/90 ${buttonFocus}`}
            >
              Start Lab
              <ArrowRightIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
