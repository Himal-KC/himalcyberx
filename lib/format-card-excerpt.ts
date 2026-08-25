export function formatCardExcerpt(text: string): string {
  const parts = text.split(",");

  while (parts.length > 0 && parts[parts.length - 1].trim() === "") {
    parts.pop();
  }

  return parts.join(",").trimEnd();
}
