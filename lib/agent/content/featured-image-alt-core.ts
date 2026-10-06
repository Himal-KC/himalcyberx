export type FeaturedImageAltQualityCode =
  | "ALT_TEXT_MISSING"
  | "ALT_TEXT_PREFIX_IMAGE_OF"
  | "ALT_TEXT_FILENAME"
  | "ALT_TEXT_RAW_SLUG"
  | "ALT_TEXT_TRUNCATED"
  | "ALT_TEXT_TOO_SHORT"
  | "ALT_TEXT_TOO_LONG"
  | "ALT_TEXT_KEYWORD_STUFFING"
  | "ALT_TEXT_DUPLICATES_TITLE";

export interface FeaturedImageAltQualityInput {
  altText: string | null;
  title: string;
  slug: string;
  hasFeaturedImage: boolean;
}

export function evaluateFeaturedImageAltQuality(
  input: FeaturedImageAltQualityInput,
): FeaturedImageAltQualityCode[] {
  if (!input.hasFeaturedImage) {
    return [];
  }

  const alt = input.altText?.trim() ?? "";
  const codes: FeaturedImageAltQualityCode[] = [];

  if (!alt) {
    codes.push("ALT_TEXT_MISSING");
    return codes;
  }

  if (/^image of/i.test(alt)) {
    codes.push("ALT_TEXT_PREFIX_IMAGE_OF");
  }

  if (/\.webp$|\.jpg$|\.png$/i.test(alt) || alt.includes("/storage/")) {
    codes.push("ALT_TEXT_FILENAME");
  }

  const normalizedSlug = input.slug.replace(/-/g, " ").toLowerCase();
  if (normalizedSlug.length >= 8 && alt.toLowerCase().includes(normalizedSlug)) {
    codes.push("ALT_TEXT_RAW_SLUG");
  }

  const normalizedTitle = input.title.replace(/\s+/g, " ").trim().toLowerCase();
  if (
    normalizedTitle.length >= 12 &&
    (alt.toLowerCase() === normalizedTitle ||
      alt.toLowerCase().startsWith(`${normalizedTitle}:`) ||
      alt.toLowerCase().startsWith(`${normalizedTitle} -`) ||
      (alt.toLowerCase().match(new RegExp(escapeRegExp(normalizedTitle), "g")) ??
        []
      ).length > 1)
  ) {
    codes.push("ALT_TEXT_DUPLICATES_TITLE");
  }

  if (alt.endsWith("…") || alt.endsWith("...")) {
    codes.push("ALT_TEXT_TRUNCATED");
  }

  if (alt.length < 40) {
    codes.push("ALT_TEXT_TOO_SHORT");
  }

  if (alt.length > 180) {
    codes.push("ALT_TEXT_TOO_LONG");
  }

  const words = alt.toLowerCase().split(/\s+/);
  const repeated = words.find(
    (word, index) => word.length > 4 && words.indexOf(word) !== index,
  );
  if (repeated) {
    codes.push("ALT_TEXT_KEYWORD_STUFFING");
  }

  return codes;
}

export function featuredImageAltPassesPhase7Quality(
  input: FeaturedImageAltQualityInput,
): boolean {
  return evaluateFeaturedImageAltQuality(input).length === 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function trimAltToLength(value: string, min: number, max: number): string {
  const next = value.replace(/\s+/g, " ").trim();
  if (next.length <= max) {
    return next;
  }

  const slice = next.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace >= min) {
    return slice.slice(0, lastSpace).trim();
  }

  return slice.trim();
}

export interface FeaturedImageAltRepairBrief {
  visualConcept: string;
  environment: string;
  mood: string;
  importantElements?: string[];
}

export function buildVisualArtworkAltFromBrief(
  brief: FeaturedImageAltRepairBrief,
): string {
  const concept = brief.visualConcept.replace(/\s+/g, " ").trim();
  const environment = brief.environment.replace(/\s+/g, " ").trim();
  const mood = brief.mood.replace(/\s+/g, " ").trim();
  const focal = (brief.importantElements ?? [])
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" and ");

  let alt = focal
    ? `Editorial hero artwork showing ${concept} in ${environment}, featuring ${focal}. ${mood}.`
    : `Editorial hero artwork showing ${concept} in ${environment}. ${mood}.`;

  alt = trimAltToLength(alt, 80, 160);

  if (alt.length < 80) {
    alt = trimAltToLength(
      `${alt} Realistic enterprise security visuals without readable text.`,
      80,
      160,
    );
  }

  return alt;
}

export function buildDeterministicFeaturedImageAlt(input: {
  title: string;
  slug: string;
  visualConcept?: string | null;
  topic?: string | null;
  altRepairBrief?: FeaturedImageAltRepairBrief | null;
}): string {
  if (input.altRepairBrief) {
    return buildVisualArtworkAltFromBrief(input.altRepairBrief);
  }

  const concept =
    input.visualConcept?.replace(/\s+/g, " ").trim() ||
    input.topic?.replace(/\s+/g, " ").trim() ||
    "a cybersecurity threat visualization";

  let alt = `Wide editorial hero artwork depicting ${concept}, with realistic enterprise security visuals.`;

  alt = trimAltToLength(alt, 80, 160);

  if (alt.length < 80) {
    alt = trimAltToLength(
      `${alt} The scene avoids readable text and decorative stock cliches.`,
      80,
      160,
    );
  }

  return alt;
}

export function repairFeaturedImageAltText(input: {
  title: string;
  slug: string;
  currentAlt: string | null;
  visualConcept?: string | null;
  topic?: string | null;
  altRepairBrief?: FeaturedImageAltRepairBrief | null;
  hasFeaturedImage: boolean;
}): string | null {
  if (!input.hasFeaturedImage) {
    return input.currentAlt?.trim() || null;
  }

  const qualityInput = {
    altText: input.currentAlt,
    title: input.title,
    slug: input.slug,
    hasFeaturedImage: true as const,
  };

  if (featuredImageAltPassesPhase7Quality(qualityInput)) {
    return input.currentAlt?.trim() || null;
  }

  const candidate = buildDeterministicFeaturedImageAlt(input);
  if (
    featuredImageAltPassesPhase7Quality({
      altText: candidate,
      title: input.title,
      slug: input.slug,
      hasFeaturedImage: true,
    })
  ) {
    return candidate;
  }

  const fallback = trimAltToLength(
    "Wide editorial cybersecurity hero artwork with layered enterprise technology and threat-defense context.",
    80,
    160,
  );

  return fallback;
}
