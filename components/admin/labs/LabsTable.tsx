import Link from "next/link";
import type { Lab } from "@/lib/supabase/types";
import { labPath } from "@/lib/supabase/public-labs";
import { DeleteLabButton } from "@/components/admin/labs/DeleteLabButton";
import { LabStatusBadge } from "@/components/admin/labs/LabStatusBadge";
import { focusRing } from "@/lib/page-data";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function LabRowActions({ lab }: { lab: Lab }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={labPath(lab.slug)}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-sm text-hcx-text-secondary transition-colors hover:text-hcx-cyan ${focusRing}`}
      >
        View
      </Link>
      <Link
        href={`/admin/labs/${lab.id}/edit`}
        className={`text-sm text-hcx-cyan hover:underline ${focusRing}`}
      >
        Edit
      </Link>
      <DeleteLabButton labId={lab.id} labTitle={lab.title} />
    </div>
  );
}

export function LabsTable({ labs }: { labs: Lab[] }) {
  if (labs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hcx-border bg-hcx-card/50 px-6 py-16 text-center">
        <p className="text-lg font-medium text-hcx-text">No labs yet.</p>
        <p className="mt-2 text-sm text-hcx-text-secondary">
          Create your first hands-on cybersecurity lab.
        </p>
        <Link
          href="/admin/labs/new"
          className={`mt-6 inline-flex rounded-lg bg-hcx-cyan px-4 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 ${focusRing}`}
        >
          Create Lab
        </Link>
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
                Lab Title
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Difficulty
              </th>
              <th className="px-4 py-3 font-medium text-hcx-text-secondary">
                Category
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
            {labs.map((lab) => (
              <tr key={lab.id} className="align-top">
                <td className="px-4 py-4">
                  <p className="font-medium text-hcx-text">{lab.title}</p>
                  <p className="mt-1 font-mono text-xs text-hcx-text-secondary">
                    /{lab.slug}
                  </p>
                </td>
                <td className="px-4 py-4 text-hcx-text-secondary">
                  {lab.difficulty}
                </td>
                <td className="px-4 py-4 text-hcx-text-secondary">
                  {lab.category || "—"}
                </td>
                <td className="px-4 py-4">
                  <LabStatusBadge status={lab.status} />
                </td>
                <td className="px-4 py-4 text-hcx-text-secondary">
                  {lab.estimated_time || "—"}
                </td>
                <td className="px-4 py-4 text-hcx-text-secondary">
                  {formatDate(lab.published_at)}
                </td>
                <td className="px-4 py-4">
                  <LabRowActions lab={lab} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {labs.map((lab) => (
          <article
            key={lab.id}
            className="rounded-xl border border-hcx-border bg-hcx-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-hcx-text">{lab.title}</p>
                <p className="mt-1 font-mono text-xs text-hcx-text-secondary">
                  /{lab.slug}
                </p>
              </div>
              <LabStatusBadge status={lab.status} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-hcx-text-secondary">Difficulty</dt>
                <dd className="mt-1 text-hcx-text">{lab.difficulty}</dd>
              </div>
              <div>
                <dt className="text-hcx-text-secondary">Category</dt>
                <dd className="mt-1 text-hcx-text">{lab.category || "—"}</dd>
              </div>
              <div>
                <dt className="text-hcx-text-secondary">Estimated Time</dt>
                <dd className="mt-1 text-hcx-text">
                  {lab.estimated_time || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-hcx-text-secondary">Published Date</dt>
                <dd className="mt-1 text-hcx-text">
                  {formatDate(lab.published_at)}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <LabRowActions lab={lab} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
