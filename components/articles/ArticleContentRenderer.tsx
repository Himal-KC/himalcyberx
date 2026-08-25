import { RichContentRenderer } from "@/components/content/RichContentRenderer";

interface ArticleContentRendererProps {
  content: string;
}

export function ArticleContentRenderer({ content }: ArticleContentRendererProps) {
  return <RichContentRenderer content={content} />;
}
