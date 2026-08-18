"use client";

import { useState, type ReactNode } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { focusRing } from "@/lib/page-data";

interface AdminShellProps {
  children: ReactNode;
  userEmail: string;
  newMessageCount?: number;
}

export function AdminShell({
  children,
  userEmail,
  newMessageCount = 0,
}: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-hcx-bg text-hcx-text">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-hcx-border bg-hcx-bg-secondary lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-hcx-border px-5 py-5">
              <p className="font-tech text-xs font-semibold uppercase tracking-[0.2em] text-hcx-cyan">
                HCX Admin
              </p>
              <p className="mt-1 text-xs text-hcx-text-secondary">
                Content management
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <AdminSidebar newMessageCount={newMessageCount} />
            </div>
          </div>
        </aside>

        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            aria-hidden="true"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-hcx-border bg-hcx-bg-secondary transition-transform duration-200 lg:hidden ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-hidden={!mobileNavOpen}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-hcx-border px-4 py-4">
              <p className="font-tech text-xs font-semibold uppercase tracking-[0.2em] text-hcx-cyan">
                HCX Admin
              </p>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className={`rounded-md p-2 text-hcx-text-secondary hover:text-hcx-text ${focusRing}`}
                aria-label="Close navigation menu"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <AdminSidebar
                onNavigate={() => setMobileNavOpen(false)}
                newMessageCount={newMessageCount}
              />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-hcx-border bg-hcx-bg/90 backdrop-blur-lg">
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className={`rounded-md p-2 text-hcx-text-secondary hover:text-hcx-text lg:hidden ${focusRing}`}
                  aria-label="Open navigation menu"
                  aria-expanded={mobileNavOpen}
                >
                  <MenuIcon className="h-5 w-5" />
                </button>
                <div>
                  <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
                    HCX Admin
                  </p>
                  <p className="truncate text-xs text-hcx-text-secondary sm:text-sm">
                    {userEmail}
                  </p>
                </div>
              </div>
              <AdminSignOutButton />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
