import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ContactForm } from "@/components/forms/ContactForm";
import { ContactInfoPanel } from "@/components/forms/ContactInfoPanel";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return buildPageMetadata({
    title: "Contact",
    description: `Contact ${settings.siteName} with questions, research suggestions, collaboration ideas or website feedback.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <PageShell showNewsletter={false}>
      <Breadcrumb items={[{ label: "Contact" }]} />
      <PageHero
        label="Get in Touch"
        title={`Contact ${settings.siteName}`}
        description="Questions, research suggestions, collaboration ideas or website feedback are welcome."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
          <div className="lg:col-span-2">
            <ContactInfoPanel settings={settings} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
