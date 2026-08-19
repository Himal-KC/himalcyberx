import Link from "next/link";
import type { Tutorial } from "@/lib/supabase/types";
import { tutorialPath } from "@/lib/supabase/public-tutorials";
import { DeleteTutorialButton } from "@/components/admin/tutorials/DeleteTutorialButton";
import { TutorialStatusBadge } from "@/components/admin/tutorials/TutorialStatusBadge";
import { focusRing } from "@/lib/page-data";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TutorialRowActions({ tutorial }: { tutorial: Tutorial }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={tutorialPath(tutorial.slug)}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
      >
        View
      </Link>
      <Link
        href={`/admin/tutorials/${tutorial.id}/edit`}
        className={`text-sm text-hcx-cyan hover:underline ${focusRing}`}
      >
        Edit
      </Link>
      <DeleteTutorialButton
        tutorialId={tutorial.id}
        tutorialTitle={tutorial.title}
      />
    </div>
  );
}

export function TutorialsTable({
  tutorials,
  totalCount,
  hasActiveFilters,
}: {
  tutorials: Tutorial[];
  totalCount: number;
  hasActiveFilters: boolean;
}) {
  if (totalCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/50 px-6 py-16 text-center">
        <p className="text-lg font-medium text-hcx-text">No tutorials yet.</p>
        <p className="mt-2 text-sm text-hcx-text-secondary">
          Create your first HimalCyberX tutorial.
        </p>
        <Link
          href="/admin/tutorials/new"
          className={`mt-6 inline-flex rounded-lg bg-hcx-cyan px-4 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 ${focusRing}`}
        >
          Create Tutorial
        </Link>
      </div>
    );
  }

  if (tutorials.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/50 px-6 py-16 text-center">
        <p className="text-lg font-medium text-hcx-text">
          No matching tutorials found.
        </p>
        {hasActiveFilters ? (
          <p className="mt-2 text-sm text-hcx-text-secondary">
            Try adjusting your search or filters.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-hcx-border md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-hcx-border bg-hcx-bg-secondary/60">
            <tr>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Title
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Category
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Difficulty
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Estimated Time
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Published Date
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hcx-border bg-hcx-card">
            {tutorials.map((tutorial) => (
              <tr key={tutorial.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-medium text-hcx-text">{tutorial.title}</p>
                  <p className="mt-1 font-mono text-xs text-hcx-text-secondary">
                    /{tutorial.slug}
                  </p>
                </td>
                <td className="px-4 py-4 text-hcx-text-secondary">
                  {tutorial.category || "—"}
                </td>
                <td className="px-4 py-4 text-hcx-text-secondary">
                  {tutorial.difficulty}
                </td>
                <td className="px-4 py-4">
                  <TutorialStatusBadge status={tutorial.status} />
                </td>
                <td className="px-4 py-4 text-hcx-text-secondary">
                  {tutorial.estimated_time || "—"}
                </td>
                <td className="px-4 py-4 text-hcx-text-secondary">
                  {formatDate(tutorial.published_at)}
                </td>
                <td className="px-4 py-4">
                  <TutorialRowActions tutorial={tutorial} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {tutorials.map((tutorial) => (
          <article
            key={tutorial.id}
            className="rounded-xl border border-hcx-border bg-hcx-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-hcx-text">{tutorial.title}</p>
                <p className="mt-1 font-mono text-xs text-hcx-text-secondary">
                  /{tutorial.slug}
                </p>
              </div>
              <TutorialStatusBadge status={tutorial.status} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-hcx-text-secondary">Category</dt>
                <dd className="mt-1 text-hcx-text">{tutorial.category || "—"}</dd>
              </div>
              <div>
                <dt className="text-hcx-text-secondary">Difficulty</dt>
                <dd className="mt-1 text-hcx-text">{tutorial.difficulty}</dd>
              </div>
              <div>
                <dt className="text-hcx-text-secondary">Estimated Time</dt>
                <dd className="mt-1 text-hcx-text">
                  {tutorial.estimated_time || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-hcx-text-secondary">Published Date</dt>
                <dd className="mt-1 text-hcx-text">
                  {formatDate(tutorial.published_at)}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <TutorialRowActions tutorial={tutorial} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
