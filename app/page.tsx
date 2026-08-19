import { Header } from "@/components/Header";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SecurityUpdateBar } from "@/components/SecurityUpdateBar";
import { Hero } from "@/components/Hero";
import { TrendingStories } from "@/components/TrendingStories";
import { LatestNews } from "@/components/LatestNews";
import { ThreatIntelligence } from "@/components/ThreatIntelligence";
import { VulnerabilityWatch } from "@/components/VulnerabilityWatch";
import { CyberLab } from "@/components/CyberLab";
import { AISecurity } from "@/components/AISecurity";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";
import { getHomepageArticles } from "@/lib/supabase/public-articles";
import { getSiteSettings } from "@/lib/settings/site-settings";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildOrganizationStructuredData,
  buildWebSiteStructuredData,
} from "@/lib/seo/site-structured-data";

export const metadata: Metadata = buildPageMetadata({
  title: "Cybersecurity Research, Threat Intelligence & Cyber Labs",
  description:
    "Independent cybersecurity news, threat intelligence, security research and practical cyber labs from HimalCyberX.",
  path: "/",
});

export const revalidate = 60;

export default async function Home() {
  const [homepageArticles, settings] = await Promise.all([
    getHomepageArticles(),
    getSiteSettings(),
  ]);

  return (
    <>
      <JsonLd data={buildOrganizationStructuredData()} />
      <JsonLd data={buildWebSiteStructuredData()} />
      <Header />
      <SecurityUpdateBar />
      <main>
        <Hero />
        <TrendingStories stories={homepageArticles.trending} />
        <LatestNews
          featured={homepageArticles.featured}
          latest={homepageArticles.latest}
        />
        <ThreatIntelligence articles={homepageArticles.threatArticles} />
        <VulnerabilityWatch />
        <CyberLab />
        <AISecurity />
        <Newsletter />
      </main>
      <Footer settings={settings} />
    </>
  );
}
