import { cache } from "react";
import { DEFAULT_SITE_SETTINGS } from "@/lib/settings/constants";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { logQueryError } from "@/lib/supabase/errors";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/supabase/types";

export interface PublicSiteSettings {
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

function mapSiteSettings(row: SiteSettings | null): PublicSiteSettings {
  return {
    siteName: row?.site_name?.trim() || DEFAULT_SITE_SETTINGS.siteName,
    siteTagline: row?.site_tagline?.trim() || DEFAULT_SITE_SETTINGS.siteTagline,
    publicAuthorName:
      row?.public_author_name?.trim() || DEFAULT_SITE_SETTINGS.publicAuthorName,
    contactEmail: row?.contact_email?.trim() || DEFAULT_SITE_SETTINGS.contactEmail,
    footerDescription:
      row?.footer_description?.trim() || DEFAULT_SITE_SETTINGS.footerDescription,
    githubUrl: row?.github_url?.trim() || DEFAULT_SITE_SETTINGS.githubUrl,
    linkedinUrl: row?.linkedin_url?.trim() || DEFAULT_SITE_SETTINGS.linkedinUrl,
    xUrl: row?.x_url?.trim() || DEFAULT_SITE_SETTINGS.xUrl,
    seoTitle: row?.seo_title?.trim() || DEFAULT_SITE_SETTINGS.seoTitle,
    seoDescription:
      row?.seo_description?.trim() || DEFAULT_SITE_SETTINGS.seoDescription,
    seoKeywords: row?.seo_keywords?.trim() || DEFAULT_SITE_SETTINGS.seoKeywords,
    locationDisplay:
      row?.location_display?.trim() || DEFAULT_SITE_SETTINGS.locationDisplay,
  };
}

async function fetchPublicSiteSettingsRow(): Promise<SiteSettings | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      logQueryError("fetchPublicSiteSettingsRow", error);
      return null;
    }

    return data as SiteSettings | null;
  } catch {
    return null;
  }
}

async function fetchAdminSiteSettingsRow(): Promise<SiteSettings | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      logQueryError("fetchAdminSiteSettingsRow", error);
      return null;
    }

    return data as SiteSettings | null;
  } catch {
    return null;
  }
}

export const getSiteSettings = cache(async (): Promise<PublicSiteSettings> => {
  const row = await fetchPublicSiteSettingsRow();
  return mapSiteSettings(row);
});

export async function getAdminSiteSettings(): Promise<SiteSettings | null> {
  return fetchAdminSiteSettingsRow();
}
