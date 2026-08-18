"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { SubscribeButton } from "@/components/subscribe/SubscribeButton";
import { navLinks } from "@/lib/sample-data";
import { CloseIcon, HCXLogoIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { focusRing } from "@/lib/page-data";

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navLinkBase =
  "relative whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] font-semibold transition-colors xl:px-2.5 xl:text-sm";

const navLinkInactive = `${navLinkBase} text-hcx-text/80 hover:text-hcx-cyan`;

const navLinkActive = `${navLinkBase} text-hcx-cyan after:absolute after:bottom-0 after:left-2 after:right-2 after:h-px after:bg-hcx-cyan after:content-[''] xl:after:left-2.5 xl:after:right-2.5`;

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchClick = () => {
    setSearchOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-hcx-border/80 bg-hcx-bg/85 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className={`flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90 ${focusRing}`}
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
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={
                  isNavActive(pathname, link.href) ? navLinkActive : navLinkInactive
                }
                aria-current={isNavActive(pathname, link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleSearchClick}
              className={`rounded-md p-2 text-hcx-text-secondary transition-colors hover:bg-hcx-card/80 hover:text-hcx-cyan ${focusRing}`}
              aria-label="Search"
            >
              <SearchIcon />
            </button>

            <SubscribeButton
              className={`hidden rounded-md bg-hcx-cyan px-3.5 py-1.5 text-sm font-semibold text-hcx-bg transition-all hover:bg-hcx-cyan/90 hover:shadow-[0_0_16px_rgba(0,217,255,0.2)] sm:inline-flex ${focusRing}`}
            >
              Subscribe
            </SubscribeButton>

            <button
              type="button"
              className={`rounded-md p-2 text-hcx-text-secondary transition-colors hover:bg-hcx-card/80 hover:text-hcx-cyan lg:hidden ${focusRing}`}
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
              {navLinks.map((link) => {
                const active = isNavActive(pathname, link.href);
                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={`block rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-hcx-card ${focusRing} ${
                        active
                          ? "text-hcx-cyan"
                          : "text-hcx-text-secondary hover:text-hcx-cyan"
                      }`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/search"
                  className={`block rounded-md px-3 py-2.5 text-sm text-hcx-text-secondary transition-colors hover:bg-hcx-card hover:text-hcx-cyan ${focusRing}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Search
                </Link>
              </li>
              <li className="pt-2 sm:hidden">
                <SubscribeButton
                  className={`block w-full rounded-md bg-hcx-cyan px-4 py-2.5 text-center text-sm font-semibold text-hcx-bg ${focusRing}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Subscribe
                </SubscribeButton>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
