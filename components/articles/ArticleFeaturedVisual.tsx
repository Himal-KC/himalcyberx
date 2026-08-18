"use client";

import { useState } from "react";
import type { ArticlePattern } from "@/lib/articles";
import { ArticlePlaceholder } from "@/components/ArticlePlaceholder";

interface ArticleFeaturedVisualProps {
  featured_image: string | null;
  pattern?: ArticlePattern | null;
  title: string;
  className?: string;
}

export function ArticleFeaturedVisual({
  featured_image,
  pattern,
  title,
  className = "h-56 sm:h-72",
}: ArticleFeaturedVisualProps) {
  const [imageError, setImageError] = useState(false);

  if (featured_image && !imageError) {
    return (
      // External admin-provided URLs; plain img avoids remote pattern config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={featured_image}
        alt={title}
        className={`w-full object-cover ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <ArticlePlaceholder
      variant={pattern ?? "featured"}
      className={className}
    />
  );
}
