function normalizeSourceText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type HtmlBlockType = "prose" | "list_item" | "heading";

export interface ExtractedHtmlBlock {
  text: string;
  blockType: HtmlBlockType;
  headingContext: string | null;
}

function stripInnerHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

function removeBoilerplateRegions(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ");
}

function pushBlock(
  blocks: ExtractedHtmlBlock[],
  seen: Set<string>,
  text: string,
  blockType: HtmlBlockType,
  headingContext: string | null,
): void {
  const normalized = normalizeSourceText(text);
  if (!normalized || normalized.length < 8) {
    return;
  }

  const key = `${blockType}:${normalized.toLowerCase()}`;
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  blocks.push({
    text: normalized,
    blockType,
    headingContext,
  });
}

export function extractHtmlBlocks(html: string): ExtractedHtmlBlock[] {
  const cleaned = removeBoilerplateRegions(html);
  const blocks: ExtractedHtmlBlock[] = [];
  const seen = new Set<string>();
  let lastHeading: string | null = null;

  const blockPattern = /<(h[1-6]|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null = blockPattern.exec(cleaned);

  while (match) {
    const tag = match[1].toLowerCase();
    const text = stripInnerHtmlTags(match[2]);

    if (tag.startsWith("h")) {
      const heading = normalizeSourceText(text);
      if (heading) {
        lastHeading = heading;
        pushBlock(blocks, seen, heading, "heading", null);
      }
    } else if (tag === "li") {
      pushBlock(blocks, seen, text, "list_item", lastHeading);
    } else {
      pushBlock(blocks, seen, text, "prose", lastHeading);
    }

    match = blockPattern.exec(cleaned);
  }

  if (blocks.length === 0) {
    const fallback = normalizeSourceText(stripInnerHtmlTags(cleaned));
    if (fallback) {
      blocks.push({
        text: fallback,
        blockType: "prose",
        headingContext: null,
      });
    }
  }

  return blocks;
}

export function blocksToPageText(blocks: ExtractedHtmlBlock[]): string {
  return blocks.map((block) => block.text).join("\n");
}
