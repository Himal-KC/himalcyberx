import { Header } from "@/components/Header";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SecurityUpdateBar } from "@/components/SecurityUpdateBar";
import { Hero } from "@/components/Hero";
import { ExploreTopicsSection } from "@/components/homepage/ExploreTopicsSection";
import { FeaturedContentSection } from "@/components/homepage/FeaturedContentSection";
import { LatestArticlesSection } from "@/components/homepage/LatestArticlesSection";
import { LatestCyberLabsSection } from "@/components/homepage/LatestCyberLabsSection";
import { LatestTutorialsSection } from "@/components/homepage/LatestTutorialsSection";
import { ThreatIntelligence } from "@/components/ThreatIntelligence";
import { VulnerabilityWatch } from "@/components/VulnerabilityWatch";
import { CyberLab } from "@/components/CyberLab";
import { AISecurity } from "@/components/AISecurity";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";
import { getHomepageArticles } from "@/lib/supabase/public-articles";
import { getHomepageDiscoveryData } from "@/lib/supabase/public-homepage";
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
  const [homepageArticles, discovery, settings] = await Promise.all([
    getHomepageArticles(),
    getHomepageDiscoveryData(),
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
        <FeaturedContentSection items={discovery.featuredContent} />
        <LatestArticlesSection articles={discovery.latestArticles} />
        <LatestCyberLabsSection labs={discovery.latestLabs} />
        <LatestTutorialsSection tutorials={discovery.latestTutorials} />
        <ExploreTopicsSection />
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
