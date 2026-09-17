import type { ReactNode } from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const AUTH_ROBOTS = { index: false, follow: false } as const;

export function buildAuthPageMetadata(title: string, description: string, path: string): Metadata {
  return {
    ...buildPageMetadata({ title, description, path }),
    robots: AUTH_ROBOTS,
  };
}

interface AuthPageLayoutProps {
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthPageLayout({
  label,
  title,
  description,
  children,
}: AuthPageLayoutProps) {
  return (
    <PageShell showNewsletter={false}>
      <PageHero label={label} title={title} description={description} compact />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </div>
    </PageShell>
  );
}
