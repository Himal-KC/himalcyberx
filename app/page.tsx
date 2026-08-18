import { Header } from "@/components/Header";
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

export const revalidate = 60;

export default async function Home() {
  const [homepageArticles, settings] = await Promise.all([
    getHomepageArticles(),
    getSiteSettings(),
  ]);

  return (
    <>
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
