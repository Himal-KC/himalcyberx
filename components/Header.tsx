"use client";

import { useState } from "react";
import { navLinks } from "@/lib/sample-data";
import { CloseIcon, HCXLogoIcon, MenuIcon, SearchIcon } from "@/components/icons";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-hcx-border/80 bg-hcx-bg/85 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="#"
          className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
          aria-label="HimalCyberX home"
        >
          <HCXLogoIcon className="shrink-0 text-hcx-cyan" />
          <span className="text-[15px] font-bold tracking-tight sm:text-base">
            <span className="text-hcx-text">Himal</span>
            <span className="text-hcx-cyan">Cyber</span>
            <span className="text-hcx-cyan font-extrabold tracking-wide drop-shadow-[0_0_8px_rgba(0,217,255,0.35)]">
              X
            </span>
          </span>
        </a>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] font-semibold text-hcx-text/80 transition-colors hover:text-hcx-cyan xl:px-2.5 xl:text-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="rounded-md p-2 text-hcx-text-secondary transition-colors hover:bg-hcx-card/80 hover:text-hcx-cyan"
            aria-label="Search"
          >
            <SearchIcon />
          </button>

          <a
            href="#newsletter"
            className="hidden rounded-md bg-hcx-cyan px-3.5 py-1.5 text-sm font-semibold text-hcx-bg transition-all hover:bg-hcx-cyan/90 hover:shadow-[0_0_16px_rgba(0,217,255,0.2)] sm:inline-flex"
          >
            Subscribe
          </a>

          <button
            type="button"
            className="rounded-md p-2 text-hcx-text-secondary transition-colors hover:bg-hcx-card/80 hover:text-hcx-cyan lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="border-t border-hcx-border/80 bg-hcx-bg-secondary/95 px-4 py-3 backdrop-blur-lg lg:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="block rounded-md px-3 py-2.5 text-sm text-hcx-text-secondary transition-colors hover:bg-hcx-card hover:text-hcx-cyan"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2 sm:hidden">
              <a
                href="#newsletter"
                className="block rounded-md bg-hcx-cyan px-4 py-2.5 text-center text-sm font-semibold text-hcx-bg"
                onClick={() => setMobileOpen(false)}
              >
                Subscribe
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
