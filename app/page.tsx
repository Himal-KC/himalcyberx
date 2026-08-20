import { Header } from "@/components/Header";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { SecurityUpdateBar } from "@/components/SecurityUpdateBar";
import { Hero } from "@/components/Hero";
import { ExploreTopicsSection } from "@/components/homepage/ExploreTopicsSection";
import { FeaturedContentSection } from "@/components/homepage/FeaturedContentSection";
import { LatestArticlesSection } from "@/components/homepage/LatestArticlesSection";
import { LearnAndPracticeSection } from "@/components/homepage/LearnAndPracticeSection";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";
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
  const [discovery, settings] = await Promise.all([
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
        <LearnAndPracticeSection
          labs={discovery.latestLabs}
          tutorials={discovery.latestTutorials}
        />
        <ExploreTopicsSection />
        <Newsletter />
      </main>
      <Footer settings={settings} />
    </>
  );
}
