import { learningPaths } from "@/lib/sample-data";
import { linkFocus } from "@/components/cyber-lab/constants";
import { ArrowRightIcon } from "@/components/icons";

export function LearningPaths() {
  return (
    <div className="mt-12 md:mt-14">
      <h3 className="text-xl font-bold uppercase tracking-[0.06em] text-hcx-text md:text-2xl">
        Cybersecurity Learning Paths
      </h3>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {learningPaths.map((path) => (
          <article
            key={path.title}
            className="group flex h-full flex-col rounded-lg border border-hcx-border bg-hcx-card p-5 transition-colors hover:border-hcx-cyan/20 sm:p-6"
          >
            <h4 className="font-tech text-sm font-semibold uppercase tracking-[0.12em] text-hcx-cyan">
              {path.title}
            </h4>

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

            <a
              href="#"
              className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-hcx-text-secondary transition-colors group-hover:text-hcx-cyan ${linkFocus}`}
            >
              Start Learning
              <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
