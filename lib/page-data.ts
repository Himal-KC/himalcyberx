import { articleToCard, getArticleBySlug, getPublicArticles } from "@/lib/articles";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcx-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-hcx-bg";

export const iconButtonClass = `inline-flex h-11 w-11 items-center justify-center rounded-md ${focusRing}`;

export const newsCategories = [
  "All",
  "Threat Intelligence",
  "Security Fundamentals",
  "Vulnerabilities",
] as const;

export type NewsCategory = (typeof newsCategories)[number];

const publicSlugs = [
  "ransomware-groups-target-identity-remote-access",
  "understanding-multi-factor-authentication",
  "how-the-cve-program-works",
] as const;

export const newsArticles = publicSlugs.map((slug, index) => {
  const article = getArticleBySlug(slug)!;
  const card = articleToCard(article);
  return {
    id: `news-${String(index + 1).padStart(3, "0")}`,
    slug: article.slug,
    category: article.category,
    headline: article.title,
    description: article.excerpt,
    author: article.author,
    date: card.date,
    readTime: article.readTime,
    featured: slug === "ransomware-groups-target-identity-remote-access",
    pattern: article.pattern,
    label: article.label,
    dateIso: article.publishedAtIso,
  };
});

export const threatResearch = getPublicArticles()
  .filter((article) => article.categoryHref === "/threats")
  .map((article) => ({
    slug: article.slug,
    title: article.title,
    category: article.category,
    date: articleToCard(article).date,
    dateIso: article.publishedAtIso,
    readTime: article.readTime,
    label: article.label,
  }));

export const forensicsGuides = [
  {
    title: "Disk & File System Forensics",
    description:
      "Learn how investigators examine storage media, partition structures and file system artifacts during authorized examinations.",
  },
  {
    title: "File Carving",
    description:
      "Understand how forensic analysts recover deleted or fragmented files from unallocated disk space using signature analysis.",
  },
  {
    title: "Windows Forensics",
    description:
      "Explore registry analysis, event logs, prefetch data and user activity artifacts on Windows endpoints.",
  },
  {
    title: "Memory Forensics",
    description:
      "Study volatile memory acquisition and analysis techniques for detecting in-memory threats and active processes.",
  },
] as const;

export const forensicsTools = [
  {
    name: "Autopsy",
    description:
      "Open-source digital forensics platform for disk image analysis, timeline generation and artifact review.",
  },
  {
    name: "FTK Imager",
    description:
      "Forensic imaging utility for creating verified copies of storage media in controlled investigative workflows.",
  },
  {
    name: "HxD",
    description:
      "Hex editor used to inspect raw binary data, file headers and low-level structures during forensic review.",
  },
  {
    name: "Volatility",
    description:
      "Memory forensics framework for analyzing RAM dumps and extracting process, network and malware artifacts.",
  },
  {
    name: "Wireshark",
    description:
      "Network protocol analyzer for reviewing packet captures and identifying suspicious communication patterns.",
  },
] as const;

export const featuredForensicsGuide = {
  title: "Introduction to Digital Evidence Handling",
  description:
    "A foundational guide to evidence integrity, chain of custody and safe forensic examination practices in authorized environments.",
  difficulty: "Beginner",
  readTime: "15 min read",
};

export const tutorialCategories = [
  "Networking",
  "Linux",
  "Security Fundamentals",
  "SOC",
  "Digital Forensics",
  "Web Security",
] as const;

export const tutorials = [
  {
    id: "tut-001",
    category: "Networking",
    title: "Understanding TCP/IP for Security Analysts",
    description:
      "Learn how IP addressing, ports and protocol behavior support network monitoring and incident investigation.",
    difficulty: "Beginner",
    estimatedTime: "25 min",
  },
  {
    id: "tut-002",
    category: "Linux",
    title: "Linux Permissions and File Security Basics",
    description:
      "Explore users, groups, permissions and common hardening practices for Linux systems in defensive operations.",
    difficulty: "Beginner",
    estimatedTime: "20 min",
  },
  {
    id: "tut-003",
    category: "Security Fundamentals",
    title: "Introduction to the CIA Triad and Defense in Depth",
    description:
      "Build a practical understanding of confidentiality, integrity, availability and layered security architecture.",
    difficulty: "Beginner",
    estimatedTime: "18 min",
  },
  {
    id: "tut-004",
    category: "SOC",
    title: "SOC Alert Triage Workflow for New Analysts",
    description:
      "Walk through a structured approach to reviewing alerts, gathering context and escalating incidents appropriately.",
    difficulty: "Intermediate",
    estimatedTime: "30 min",
  },
  {
    id: "tut-005",
    category: "Digital Forensics",
    title: "Creating and Verifying Forensic Disk Images",
    description:
      "Learn safe imaging procedures, hash verification and documentation standards for digital evidence.",
    difficulty: "Intermediate",
    estimatedTime: "35 min",
  },
  {
    id: "tut-006",
    category: "Web Security",
    title: "OWASP Top 10 Overview for Defenders",
    description:
      "Review common web application risks and the defensive controls used to reduce exposure in production systems.",
    difficulty: "Intermediate",
    estimatedTime: "28 min",
  },
] as const;

export const aiSecuritySections = {
  llm: [
    {
      title: "Prompt Injection Risks in Enterprise LLM Deployments",
      description:
        "Understanding how untrusted inputs can influence model behavior in business applications.",
    },
    {
      title: "Data Leakage and Privacy Controls for Internal AI Tools",
      description:
        "Guidance on access boundaries, logging and sensitive data handling in LLM workflows.",
    },
  ],
  threats: [
    {
      title: "How Adversaries May Use Generative AI in Social Engineering",
      description:
        "Educational overview of AI-assisted phishing content and impersonation techniques discussed in security research.",
    },
    {
      title: "Automated Reconnaissance and AI-Assisted Planning",
      description:
        "Foundational concepts on how machine learning tools may accelerate information gathering in unauthorized scenarios.",
    },
  ],
  defensive: [
    {
      title: "Building an AI-Augmented SOC Workflow",
      description:
        "Practical architecture patterns for alert enrichment, summarization and analyst-assisted triage.",
    },
    {
      title: "Using Machine Learning for Anomaly Detection",
      description:
        "Foundational concepts for applying behavioral models to network and endpoint telemetry.",
    },
  ],
  deepfakes: [
    {
      title: "Deepfake Awareness for Security Awareness Programs",
      description:
        "Educational overview of synthetic media risks and verification practices for organizations.",
    },
  ],
  governance: [
    {
      title: "AI Governance Frameworks for Security Teams",
      description:
        "Policy, risk assessment and oversight models for responsible AI adoption in security operations.",
    },
  ],
} as const;
