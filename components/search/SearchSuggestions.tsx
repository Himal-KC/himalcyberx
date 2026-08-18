import {
  LEARNING_SUGGESTIONS,
  POPULAR_TOPICS,
} from "@/lib/search";
import { focusRing } from "@/lib/page-data";

interface SearchSuggestionsProps {
  onSelect: (query: string) => void;
}

export function SearchSuggestions({ onSelect }: SearchSuggestionsProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-tech text-[10px] font-semibold uppercase tracking-[0.2em] text-hcx-text-secondary">
          Popular Topics
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {POPULAR_TOPICS.map((topic) => (
            <button
              key={topic.label}
              type="button"
              onClick={() => onSelect(topic.query)}
              className={`rounded-md border border-hcx-border bg-hcx-card px-3 py-1.5 text-sm text-hcx-text-secondary transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-tech text-[10px] font-semibold uppercase tracking-[0.2em] text-hcx-text-secondary">
          Learning
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEARNING_SUGGESTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelect(item.query)}
              className={`rounded-md border border-hcx-border bg-hcx-card px-3 py-1.5 text-sm text-hcx-text-secondary transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
