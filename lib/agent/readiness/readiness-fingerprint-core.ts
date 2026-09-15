import { createHash } from "node:crypto";
import type { ReviewDraftSnapshot } from "../review/types";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function buildDraftFingerprint(snapshot: ReviewDraftSnapshot): string {
  const payload = {
    contentId: snapshot.contentId,
    contentType: snapshot.contentType,
    title: snapshot.title,
    slug: snapshot.slug,
    draft: snapshot.draft,
    sourceMappings: snapshot.sourceMappings,
    internalLinks: snapshot.internalLinks,
    generationWarnings: snapshot.generationWarnings,
  };

  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export interface ReadinessFingerprintInput {
  snapshot: ReviewDraftSnapshot;
  seoFields: {
    seoTitle: string | null;
    seoDescription: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
  };
  featuredImage: string | null;
  featuredImageAlt: string | null;
  reviewFingerprint: string | null;
}

export function buildReadinessFingerprint(
  input: ReadinessFingerprintInput,
): string {
  const payload = {
    draftFingerprint: buildDraftFingerprint(input.snapshot),
    seoFields: input.seoFields,
    featuredImage: input.featuredImage,
    featuredImageAlt: input.featuredImageAlt,
    reviewFingerprint: input.reviewFingerprint,
  };

  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export function isPersistedReadinessStale(input: {
  persistedFingerprint: string | null | undefined;
  currentFingerprint: string;
}): boolean {
  if (!input.persistedFingerprint) {
    return false;
  }

  return input.persistedFingerprint !== input.currentFingerprint;
}
