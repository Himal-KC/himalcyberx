import { isValidEmail } from "@/lib/form-validation";
import { DEFAULT_SITE_SETTINGS } from "@/lib/settings/constants";

const URL_PATTERN = /^https?:\/\/.+/i;

export interface SiteSettingsFormInput {
  siteName: string;
  siteTagline: string;
  publicAuthorName: string;
  contactEmail: string;
  footerDescription: string;
  githubUrl: string;
  linkedinUrl: string;
  xUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  locationDisplay: string;
}

export function parseSiteSettingsFormData(
  formData: FormData,
): SiteSettingsFormInput {
  return {
    siteName: String(formData.get("site_name") ?? "").trim(),
    siteTagline: String(formData.get("site_tagline") ?? "").trim(),
    publicAuthorName: String(formData.get("public_author_name") ?? "").trim(),
    contactEmail: String(formData.get("contact_email") ?? "").trim(),
    footerDescription: String(formData.get("footer_description") ?? "").trim(),
    githubUrl: String(formData.get("github_url") ?? "").trim(),
    linkedinUrl: String(formData.get("linkedin_url") ?? "").trim(),
    xUrl: String(formData.get("x_url") ?? "").trim(),
    seoTitle: String(formData.get("seo_title") ?? "").trim(),
    seoDescription: String(formData.get("seo_description") ?? "").trim(),
    seoKeywords: String(formData.get("seo_keywords") ?? "").trim(),
    locationDisplay: String(formData.get("location_display") ?? "").trim(),
  };
}

function isValidOptionalUrl(value: string): boolean {
  return !value || URL_PATTERN.test(value);
}

function isValidOptionalEmail(value: string): boolean {
  return !value || isValidEmail(value);
}

export function validateSiteSettingsInput(
  input: SiteSettingsFormInput,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (!input.siteName) {
    fieldErrors.site_name = "Site name is required.";
  }

  if (!input.siteTagline) {
    fieldErrors.site_tagline = "Site tagline is required.";
  }

  if (!input.publicAuthorName) {
    fieldErrors.public_author_name = "Public author name is required.";
  }

  if (!isValidOptionalEmail(input.contactEmail)) {
    fieldErrors.contact_email = "Please enter a valid email address.";
  }

  if (!isValidOptionalUrl(input.githubUrl)) {
    fieldErrors.github_url = "GitHub URL must be a valid http or https URL.";
  }

  if (!isValidOptionalUrl(input.linkedinUrl)) {
    fieldErrors.linkedin_url = "LinkedIn URL must be a valid http or https URL.";
  }

  if (!isValidOptionalUrl(input.xUrl)) {
    fieldErrors.x_url = "X / Twitter URL must be a valid http or https URL.";
  }

  return fieldErrors;
}

export function toSiteSettingsPayload(input: SiteSettingsFormInput) {
  return {
    site_name: input.siteName,
    site_tagline: input.siteTagline,
    public_author_name: input.publicAuthorName,
    contact_email: input.contactEmail || null,
    footer_description: input.footerDescription || null,
    github_url: input.githubUrl || null,
    linkedin_url: input.linkedinUrl || null,
    x_url: input.xUrl || null,
    seo_title: input.seoTitle || null,
    seo_description: input.seoDescription || null,
    seo_keywords: input.seoKeywords || null,
    location_display: input.locationDisplay || null,
    updated_at: new Date().toISOString(),
  };
}

export function getDefaultSiteSettingsFormInput(): SiteSettingsFormInput {
  return {
    siteName: DEFAULT_SITE_SETTINGS.siteName,
    siteTagline: DEFAULT_SITE_SETTINGS.siteTagline,
    publicAuthorName: DEFAULT_SITE_SETTINGS.publicAuthorName,
    contactEmail: DEFAULT_SITE_SETTINGS.contactEmail,
    footerDescription: DEFAULT_SITE_SETTINGS.footerDescription,
    githubUrl: DEFAULT_SITE_SETTINGS.githubUrl,
    linkedinUrl: DEFAULT_SITE_SETTINGS.linkedinUrl,
    xUrl: DEFAULT_SITE_SETTINGS.xUrl,
    seoTitle: DEFAULT_SITE_SETTINGS.seoTitle,
    seoDescription: DEFAULT_SITE_SETTINGS.seoDescription,
    seoKeywords: DEFAULT_SITE_SETTINGS.seoKeywords,
    locationDisplay: DEFAULT_SITE_SETTINGS.locationDisplay,
  };
}
