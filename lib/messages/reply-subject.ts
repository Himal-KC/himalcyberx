export function buildReplySubject(originalSubject: string): string {
  const trimmed = originalSubject.trim();
  if (!trimmed) {
    return "Re: Your message to HimalCyberX";
  }

  if (/^re:/i.test(trimmed)) {
    return trimmed;
  }

  return `Re: ${trimmed}`;
}
