import type { GroupedSearchResults, SearchContentType } from "@/lib/search";
import { getGroupedSectionTitle } from "@/lib/search";
import { SearchResultCard } from "@/components/search/SearchResultCard";

interface SearchResultsListProps {
  results: GroupedSearchResults;
  compact?: boolean;
  showSectionHeadings?: boolean;
}

const SECTION_ORDER: SearchContentType[] = ["article", "lab", "tutorial"];

function getSectionItems(
  results: GroupedSearchResults,
  type: SearchContentType,
) {
  switch (type) {
    case "article":
      return results.articles;
    case "lab":
      return results.labs;
    case "tutorial":
      return results.tutorials;
  }
}

export function SearchResultsList({
  results,
  compact = false,
  showSectionHeadings = true,
}: SearchResultsListProps) {
  const sections = SECTION_ORDER.map((type) => ({
    type,
    items: getSectionItems(results, type),
  })).filter((section) => section.items.length > 0);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-10"}>
      {sections.map((section) => (
        <section key={section.type}>
          {showSectionHeadings && (
            <h3 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
              {getGroupedSectionTitle(section.type)}
            </h3>
          )}
          <div
            className={
              compact
                ? "mt-2 space-y-2"
                : "mt-4 grid gap-4 sm:grid-cols-2"
            }
          >
            {section.items.map((item) => (
              <SearchResultCard
                key={`${section.type}-${item.id}`}
                item={item}
                compact={compact}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
