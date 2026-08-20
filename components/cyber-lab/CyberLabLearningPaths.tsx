import Link from "next/link";
import type { CyberLabLearningPathLink } from "@/lib/cyber-lab-list";
import { linkFocus } from "@/components/cyber-lab/constants";
import { ArrowRightIcon } from "@/components/icons";

interface CyberLabLearningPathsProps {
  paths: CyberLabLearningPathLink[];
}

export function CyberLabLearningPaths({ paths }: CyberLabLearningPathsProps) {
  if (paths.length === 0) {
    return null;
  }

  return (
    <section
      className="py-10 md:py-12"
      aria-labelledby="cyber-lab-learning-paths-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="cyber-lab-learning-paths-heading"
          className="text-lg font-bold uppercase tracking-[0.06em] text-hcx-text md:text-xl"
        >
          Cybersecurity Learning Paths
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-hcx-text-secondary">
          Suggested study tracks mapped to published lab filters where available.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => (
            <article
              key={path.title}
              className="group flex h-full flex-col rounded-lg border border-hcx-border bg-hcx-card p-5 transition-colors hover:border-hcx-cyan/20 sm:p-6"
            >
              <h3 className="font-tech text-sm font-semibold uppercase tracking-[0.12em] text-hcx-cyan">
                {path.title}
              </h3>

              <ul className="mt-4 flex-1 space-y-2">
                {path.topics.map((topic) => (
                  <li
                    key={topic}
                    className="flex items-center gap-2 text-sm text-hcx-text-secondary"
                  >
                    <span
                      className="h-1 w-1 shrink-0 rounded-full bg-hcx-cyan/60"
                      aria-hidden="true"
                    />
                    {topic}
                  </li>
                ))}
              </ul>

              {path.href ? (
                <Link
                  href={path.href}
                  className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-hcx-text-secondary transition-colors group-hover:text-hcx-cyan ${linkFocus}`}
                >
                  Browse labs
                  <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
