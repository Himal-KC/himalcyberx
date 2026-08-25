interface PlainTextContentProps {
  content: string;
  preserveLineBreaks?: boolean;
}

export function PlainTextContent({
  content,
  preserveLineBreaks = false,
}: PlainTextContentProps) {
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
          className={`text-base leading-relaxed text-hcx-text/90 ${
            preserveLineBreaks ? "whitespace-pre-line" : ""
          }`}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
