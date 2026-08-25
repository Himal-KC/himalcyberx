import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ContactForm } from "@/components/forms/ContactForm";
import { ContactInfoPanel } from "@/components/forms/ContactInfoPanel";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { focusRing } from "@/lib/page-data";
import { getSiteSettings } from "@/lib/settings/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return buildPageMetadata({
    title: "Contact",
    description: `Contact ${settings.siteName} with general enquiries, factual corrections, research suggestions, website feedback or responsible security concerns.`,
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
        description="Use this form for general enquiries, factual corrections, research suggestions, website feedback or responsible security concerns."
        supportingText="Please include enough context for us to review your message. Do not submit passwords, private keys or other highly sensitive information."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-hcx-text-secondary">
          {settings.siteName} welcomes messages about published content,
          editorial corrections, collaboration ideas and responsible security
          matters. For privacy-related requests, see the{" "}
          <Link href="/privacy" className={`text-hcx-cyan hover:underline ${focusRing}`}>
            Privacy Policy
          </Link>
          .
        </p>
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
