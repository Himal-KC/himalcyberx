"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems, isAdminNavActive } from "@/lib/admin-nav";
import { focusRing } from "@/lib/page-data";

interface AdminSidebarProps {
  onNavigate?: () => void;
  newMessageCount?: number;
}

export function AdminSidebar({
  onNavigate,
  newMessageCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="space-y-1">
      {adminNavItems.map((item) => {
        const active = isAdminNavActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${focusRing} ${
              active
                ? "bg-hcx-cyan/10 text-hcx-cyan"
                : "text-hcx-text-secondary hover:bg-hcx-bg hover:text-hcx-text"
            }`}
          >
            <span>{item.label}</span>
            {item.href === "/admin/messages" && newMessageCount > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-hcx-cyan px-1.5 py-0.5 text-[10px] font-bold text-hcx-bg">
                {newMessageCount > 99 ? "99+" : newMessageCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
