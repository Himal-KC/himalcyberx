const inputClass =
  "mt-2 w-full rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "block text-sm font-medium text-hcx-text";

interface ArticleSeoFieldsProps {
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  onOgTitleChange: (value: string) => void;
  onOgDescriptionChange: (value: string) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
}

export function ArticleSeoFields({
  seoTitle,
  seoDescription,
  ogTitle,
  ogDescription,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onOgTitleChange,
  onOgDescriptionChange,
  disabled = false,
  fieldErrors,
}: ArticleSeoFieldsProps) {
  return (
    <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
      <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
        SEO
      </h2>
      <p className="mt-2 text-sm text-hcx-text-secondary">
        Leave blank to fall back to the article title and excerpt.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="seo_title" className={labelClass}>
            SEO Title
          </label>
          <input
            id="seo_title"
            name="seo_title"
            type="text"
            value={seoTitle}
            onChange={(event) => onSeoTitleChange(event.target.value)}
            disabled={disabled}
            placeholder="Optional custom meta title"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="seo_description" className={labelClass}>
            SEO Description
          </label>
          <textarea
            id="seo_description"
            name="seo_description"
            rows={3}
            value={seoDescription}
            onChange={(event) => onSeoDescriptionChange(event.target.value)}
            disabled={disabled}
            placeholder="Optional custom meta description"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="og_title" className={labelClass}>
            Social / OG Title
          </label>
          <input
            id="og_title"
            name="og_title"
            type="text"
            value={ogTitle}
            onChange={(event) => onOgTitleChange(event.target.value)}
            disabled={disabled}
            placeholder="Optional Open Graph title"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="og_description" className={labelClass}>
            Social / OG Description
          </label>
          <textarea
            id="og_description"
            name="og_description"
            rows={3}
            value={ogDescription}
            onChange={(event) => onOgDescriptionChange(event.target.value)}
            disabled={disabled}
            placeholder="Optional Open Graph description"
            className={inputClass}
          />
        </div>
      </div>

      {fieldErrors?.seo_title ? (
        <p className="mt-2 text-sm text-hcx-red">{fieldErrors.seo_title}</p>
      ) : null}
      {fieldErrors?.seo_description ? (
        <p className="mt-2 text-sm text-hcx-red">{fieldErrors.seo_description}</p>
      ) : null}
    </section>
  );
}
