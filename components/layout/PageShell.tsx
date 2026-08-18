import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Newsletter } from "@/components/Newsletter";
import { getSiteSettings } from "@/lib/settings/site-settings";

interface PageShellProps {
  children: ReactNode;
  showNewsletter?: boolean;
}

export async function PageShell({
  children,
  showNewsletter = true,
}: PageShellProps) {
  const settings = await getSiteSettings();

  return (
    <>
      <Header />
      <main>{children}</main>
      {showNewsletter && <Newsletter />}
      <Footer settings={settings} />
    </>
  );
}
