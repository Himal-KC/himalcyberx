export function PlainTextMessageContent({ content }: { content: string }) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph.slice(0, 80)}
          className="whitespace-pre-line text-sm leading-relaxed text-hcx-text/90"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
