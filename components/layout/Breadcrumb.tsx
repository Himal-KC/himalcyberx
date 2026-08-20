import Link from "next/link";
import { focusRing } from "@/lib/page-data";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-hcx-border/60 bg-hcx-bg">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <ol className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-hcx-text-secondary">
          <li>
            <Link
              href="/"
              className={`transition-colors hover:text-hcx-cyan ${focusRing}`}
            >
              Home
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className="text-hcx-border">
                /
              </span>
              {item.href && index < items.length - 1 ? (
                <Link
                  href={item.href}
                  className={`break-words transition-colors hover:text-hcx-cyan ${focusRing}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="break-words text-hcx-text" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
