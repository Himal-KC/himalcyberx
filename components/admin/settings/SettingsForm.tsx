"use client";

import { useActionState } from "react";
import { saveSiteSettings } from "@/lib/actions/settings";
import type { SiteSettings } from "@/lib/supabase/types";
import { getDefaultSiteSettingsFormInput } from "@/lib/settings/validation";
import { focusRing } from "@/lib/page-data";

const inputClass =
  "mt-2 w-full rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "block text-sm font-medium text-hcx-text";
const sectionLabelClass =
  "font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan";
const errorClass = "mt-1.5 text-sm text-hcx-red";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
      <h2 className={sectionLabelClass}>{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-hcx-text-secondary">{description}</p>
      )}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function fieldValue(value: string | null | undefined, fallback: string): string {
  return value?.trim() ? value : fallback;
}

interface SettingsFormProps {
  settings: SiteSettings | null;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const defaults = getDefaultSiteSettingsFormInput();
  const [state, formAction, isPending] = useActionState(saveSiteSettings, {});

  return (
    <form action={formAction} noValidate className="space-y-6">
      {state.success && state.message && (
        <div
          role="status"
          className="rounded-lg border border-hcx-green/25 bg-hcx-green/10 p-4 text-sm text-hcx-green"
        >
          {state.message}
        </div>
      )}

      {state.message && !state.success && !state.fieldErrors && (
        <div
          role="alert"
          className="rounded-lg border border-hcx-red/25 bg-hcx-red/10 p-4 text-sm text-hcx-red"
        >
          {state.message}
        </div>
      )}

      <SettingsSection
        title="General Settings"
        description="Core branding and public identity for HimalCyberX."
      >
        <div>
          <label htmlFor="site_name" className={labelClass}>
            Site Name
          </label>
          <input
            id="site_name"
            name="site_name"
            type="text"
            required
            defaultValue={fieldValue(settings?.site_name, defaults.siteName)}
            disabled={isPending}
            className={inputClass}
          />
          {state.fieldErrors?.site_name && (
            <p className={errorClass}>{state.fieldErrors.site_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="site_tagline" className={labelClass}>
            Site Tagline
          </label>
          <input
            id="site_tagline"
            name="site_tagline"
            type="text"
            required
            defaultValue={fieldValue(settings?.site_tagline, defaults.siteTagline)}
            disabled={isPending}
            className={inputClass}
          />
          {state.fieldErrors?.site_tagline && (
            <p className={errorClass}>{state.fieldErrors.site_tagline}</p>
          )}
        </div>

        <div>
          <label htmlFor="public_author_name" className={labelClass}>
            Public Author Name
          </label>
          <input
            id="public_author_name"
            name="public_author_name"
            type="text"
            required
            defaultValue={fieldValue(
              settings?.public_author_name,
              defaults.publicAuthorName,
            )}
            disabled={isPending}
            className={inputClass}
          />
          {state.fieldErrors?.public_author_name && (
            <p className={errorClass}>{state.fieldErrors.public_author_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="contact_email" className={labelClass}>
            Contact Email
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={fieldValue(settings?.contact_email, defaults.contactEmail)}
            disabled={isPending}
            placeholder="contact@himalcyberx.com"
            className={inputClass}
          />
          {state.fieldErrors?.contact_email && (
            <p className={errorClass}>{state.fieldErrors.contact_email}</p>
          )}
        </div>

        <div>
          <label htmlFor="footer_description" className={labelClass}>
            Footer Description
          </label>
          <textarea
            id="footer_description"
            name="footer_description"
            rows={3}
            defaultValue={fieldValue(
              settings?.footer_description,
              defaults.footerDescription,
            )}
            disabled={isPending}
            className={inputClass}
          />
          {state.fieldErrors?.footer_description && (
            <p className={errorClass}>{state.fieldErrors.footer_description}</p>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Social Links"
        description="Optional public profile links. Leave blank to hide."
      >
        <div>
          <label htmlFor="github_url" className={labelClass}>
            GitHub URL
          </label>
          <input
            id="github_url"
            name="github_url"
            type="url"
            defaultValue={fieldValue(settings?.github_url, defaults.githubUrl)}
            disabled={isPending}
            placeholder="https://github.com/your-org"
            className={inputClass}
          />
          {state.fieldErrors?.github_url && (
            <p className={errorClass}>{state.fieldErrors.github_url}</p>
          )}
        </div>

        <div>
          <label htmlFor="linkedin_url" className={labelClass}>
            LinkedIn URL
          </label>
          <input
            id="linkedin_url"
            name="linkedin_url"
            type="url"
            defaultValue={fieldValue(settings?.linkedin_url, defaults.linkedinUrl)}
            disabled={isPending}
            placeholder="https://linkedin.com/company/your-org"
            className={inputClass}
          />
          {state.fieldErrors?.linkedin_url && (
            <p className={errorClass}>{state.fieldErrors.linkedin_url}</p>
          )}
        </div>

        <div>
          <label htmlFor="x_url" className={labelClass}>
            X / Twitter URL
          </label>
          <input
            id="x_url"
            name="x_url"
            type="url"
            defaultValue={fieldValue(settings?.x_url, defaults.xUrl)}
            disabled={isPending}
            placeholder="https://x.com/your-handle"
            className={inputClass}
          />
          {state.fieldErrors?.x_url && (
            <p className={errorClass}>{state.fieldErrors.x_url}</p>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="SEO Settings"
        description="Default metadata used when pages do not define their own."
      >
        <div>
          <label htmlFor="seo_title" className={labelClass}>
            Default SEO Title
          </label>
          <input
            id="seo_title"
            name="seo_title"
            type="text"
            defaultValue={fieldValue(settings?.seo_title, defaults.seoTitle)}
            disabled={isPending}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="seo_description" className={labelClass}>
            Default Meta Description
          </label>
          <textarea
            id="seo_description"
            name="seo_description"
            rows={3}
            defaultValue={fieldValue(
              settings?.seo_description,
              defaults.seoDescription,
            )}
            disabled={isPending}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="seo_keywords" className={labelClass}>
            Default Keywords
          </label>
          <input
            id="seo_keywords"
            name="seo_keywords"
            type="text"
            defaultValue={fieldValue(settings?.seo_keywords, defaults.seoKeywords)}
            disabled={isPending}
            placeholder="cybersecurity, threat intelligence, cyber labs"
            className={inputClass}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Site Contact Settings"
        description="Public contact details shown on the contact page."
      >
        <div>
          <label htmlFor="location_display" className={labelClass}>
            Optional Location Display
          </label>
          <input
            id="location_display"
            name="location_display"
            type="text"
            defaultValue={fieldValue(
              settings?.location_display,
              defaults.locationDisplay,
            )}
            disabled={isPending}
            placeholder="e.g. Australia"
            className={inputClass}
          />
        </div>
        <p className="text-xs text-hcx-text-secondary">
          Public contact email is managed in General Settings above.
        </p>
      </SettingsSection>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className={`rounded-lg bg-hcx-cyan px-6 py-3 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
        >
          {isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
