export function calculateReadTime(
  content: string | null | undefined,
  storedReadTime?: string | null,
): string {
  if (storedReadTime?.trim()) {
    return storedReadTime.includes("read")
      ? storedReadTime.trim()
      : `${storedReadTime.trim()} read`;
  }

  const words = (content ?? "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
