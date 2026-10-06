"use client";

import { useState } from "react";
import { LinkedInIcon, XIcon } from "@/components/icons";
import { useConsent } from "@/components/consent/ConsentProvider";
import { trackArticleShareButtonAction } from "@/lib/analytics/track-article-share-event";
import { focusRing } from "@/lib/page-data";

interface ArticleShareProps {
  title: string;
  slug: string;
}

export function ArticleShare({ title, slug }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);
  const { analyticsGranted } = useConsent();

  async function copyLink() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/articles/${slug}`
        : `/articles/${slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackArticleShareButtonAction(analyticsGranted, "copy_link", slug);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleLinkedInShareClick() {
    trackArticleShareButtonAction(analyticsGranted, "linkedin", slug);
  }

  function handleXShareClick() {
    trackArticleShareButtonAction(analyticsGranted, "x", slug);
  }

  const shareUrl = encodeURIComponent(
    typeof window !== "undefined"
      ? `${window.location.origin}/articles/${slug}`
      : "",
  );
  const shareTitle = encodeURIComponent(title);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-hcx-text-secondary">
        Share Article
      </span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleLinkedInShareClick}
        className={`flex h-9 w-9 items-center justify-center rounded-md border border-hcx-border text-hcx-text-secondary transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
        aria-label="Share on LinkedIn"
      >
        <LinkedInIcon className="h-4 w-4" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleXShareClick}
        className={`flex h-9 w-9 items-center justify-center rounded-md border border-hcx-border text-hcx-text-secondary transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
        aria-label="Share on X"
      >
        <XIcon className="h-3.5 w-3.5" />
      </a>
      <button
        type="button"
        onClick={copyLink}
        className={`rounded-md border border-hcx-border px-3 py-1.5 text-xs font-semibold text-hcx-text-secondary transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
