import { Header } from "@/components/Header";
import { BreakingNewsBar } from "@/components/BreakingNewsBar";
import { Hero } from "@/components/Hero";
import { TrendingStories } from "@/components/TrendingStories";
import { LatestNews } from "@/components/LatestNews";
import { ThreatIntelligence } from "@/components/ThreatIntelligence";
import { VulnerabilityWatch } from "@/components/VulnerabilityWatch";
import { CyberLab } from "@/components/CyberLab";
import { AISecurity } from "@/components/AISecurity";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <BreakingNewsBar />
      <main>
        <Hero />
        <TrendingStories />
        <LatestNews />
        <ThreatIntelligence />
        <VulnerabilityWatch />
        <CyberLab />
        <AISecurity />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
