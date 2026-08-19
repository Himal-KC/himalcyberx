"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { ArticleActionState } from "@/lib/actions/articles";
import { ArticleContentEditor } from "@/components/admin/articles/ArticleContentEditor";
import { ArticleSeoFields } from "@/components/admin/articles/ArticleSeoFields";
import { FeaturedImageUploader } from "@/components/admin/articles/FeaturedImageUploader";
import { PublishingChecklist } from "@/components/admin/articles/PublishingChecklist";
import { DEFAULT_ARTICLE_AUTHOR } from "@/lib/articles/author";
import { getArticleContentTextLength } from "@/lib/articles/content";
import {
  formatPublishWarningMessage,
  getPublishWarnings,
  hasPublishWarnings,
} from "@/lib/articles/publish-checklist";
import { slugifyTitle } from "@/lib/articles/validation";
import type { Category } from "@/lib/supabase/types";
import { focusRing } from "@/lib/page-data";

const inputClass =
  "mt-2 w-full rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "block text-sm font-medium text-hcx-text";

const sectionLabelClass =
  "font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan";

const errorClass = "mt-1.5 text-sm text-hcx-red";

interface NewArticleFormProps {
  action: (
    prevState: ArticleActionState,
    formData: FormData,
  ) => Promise<ArticleActionState>;
  categories: Category[];
}

function FormButtons({ isPending }: { isPending: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="submit"
        name="intent"
        value="draft"
        disabled={isPending}
        className={`w-full rounded-lg border border-hcx-border px-4 py-2.5 text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
      >
        {isPending ? "Saving…" : "Save as Draft"}
      </button>
      <button
        type="submit"
        name="intent"
        value="publish"
        disabled={isPending}
        className={`w-full rounded-lg bg-hcx-cyan px-4 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
      >
        {isPending ? "Publishing…" : "Publish Article"}
      </button>
      <Link
        href="/admin/articles"
        className={`w-full rounded-lg border border-hcx-border px-4 py-2.5 text-center text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg-secondary ${focusRing}`}
      >
        Cancel
      </Link>
    </div>
  );
}

export function NewArticleForm({ action, categories }: NewArticleFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [allowSubmit, setAllowSubmit] = useState(false);

  const categoriesAvailable = categories.length > 0;

  const checklistInput = useMemo(
    () => ({
      title,
      excerpt,
      content,
      categoryId,
      featuredImage,
      featuredImageAlt,
      seoTitle,
      seoDescription,
      ogTitle,
      ogDescription,
      categoriesAvailable,
    }),
    [
      title,
      excerpt,
      content,
      categoryId,
      featuredImage,
      featuredImageAlt,
      seoTitle,
      seoDescription,
      ogTitle,
      ogDescription,
      categoriesAvailable,
    ],
  );

  function handleTitleChange(nextTitle: string) {
    setTitle(nextTitle);
    if (!slugEdited) {
      setSlug(slugifyTitle(nextTitle));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const intent = submitter?.value;

    if (allowSubmit) {
      setAllowSubmit(false);
      return;
    }

    if (intent === "publish" && hasPublishWarnings(checklistInput)) {
      event.preventDefault();
      const confirmed = window.confirm(
        formatPublishWarningMessage(getPublishWarnings(checklistInput)),
      );

      if (confirmed && submitter) {
        setAllowSubmit(true);
        event.currentTarget.requestSubmit(submitter);
      }
    }
  }

  return (
    <form action={formAction} noValidate onSubmit={handleSubmit}>
      <input
        type="hidden"
        name="categories_available"
        value={categoriesAvailable ? "true" : "false"}
      />

      {state.message && !state.fieldErrors && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-hcx-red/25 bg-hcx-red/10 p-4 text-sm text-hcx-red"
        >
          {state.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
            <h2 className={sectionLabelClass}>Main Content</h2>

            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="title" className={labelClass}>
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  minLength={8}
                  value={title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  disabled={isPending}
                  placeholder="Enter article title"
                  aria-invalid={Boolean(state.fieldErrors?.title)}
                  className={inputClass}
                />
                {state.fieldErrors?.title && (
                  <p className={errorClass}>{state.fieldErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="slug" className={labelClass}>
                  Slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setSlug(event.target.value.toLowerCase());
                  }}
                  disabled={isPending}
                  placeholder="article-url-slug"
                  aria-invalid={Boolean(state.fieldErrors?.slug)}
                  className={`${inputClass} font-mono`}
                />
                <p className="mt-1.5 text-xs text-hcx-text-secondary">
                  Auto-generated from the title until you edit it manually. URL
                  path: /articles/{slug || "article-url-slug"}
                </p>
                {state.fieldErrors?.slug && (
                  <p className={errorClass}>{state.fieldErrors.slug}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="excerpt" className={labelClass}>
                    Excerpt
                  </label>
                  <span className="text-xs text-hcx-text-secondary">
                    {excerpt.length.toLocaleString()} characters
                  </span>
                </div>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  required
                  minLength={20}
                  rows={4}
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  disabled={isPending}
                  placeholder="Write a short summary of the article..."
                  aria-invalid={Boolean(state.fieldErrors?.excerpt)}
                  className={inputClass}
                />
                {state.fieldErrors?.excerpt && (
                  <p className={errorClass}>{state.fieldErrors.excerpt}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="content" className={labelClass}>
                    Article Content
                  </label>
                  <span className="text-xs text-hcx-text-secondary">
                    {getArticleContentTextLength(content).toLocaleString()} characters
                  </span>
                </div>
                <input type="hidden" name="content" value={content} />
                <ArticleContentEditor
                  value={content}
                  onChange={setContent}
                  disabled={isPending}
                  invalid={Boolean(state.fieldErrors?.content)}
                  minHeightClass="min-h-[28rem]"
                />
                {state.fieldErrors?.content && (
                  <p className={errorClass}>{state.fieldErrors.content}</p>
                )}
              </div>
            </div>
          </section>

          <ArticleSeoFields
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            ogTitle={ogTitle}
            ogDescription={ogDescription}
            onSeoTitleChange={setSeoTitle}
            onSeoDescriptionChange={setSeoDescription}
            onOgTitleChange={setOgTitle}
            onOgDescriptionChange={setOgDescription}
            disabled={isPending}
            fieldErrors={state.fieldErrors}
          />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <div className="rounded-xl border border-hcx-border bg-hcx-card p-6">
            <h2 className={sectionLabelClass}>Publishing</h2>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="author" className={labelClass}>
                  Author
                </label>
                <input
                  id="author"
                  name="author"
                  type="text"
                  required
                  defaultValue={DEFAULT_ARTICLE_AUTHOR}
                  disabled={isPending}
                  placeholder="HimalCyberX Research"
                  aria-invalid={Boolean(state.fieldErrors?.author)}
                  className={inputClass}
                />
                {state.fieldErrors?.author && (
                  <p className={errorClass}>{state.fieldErrors.author}</p>
                )}
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="draft"
                  disabled={isPending}
                  aria-invalid={Boolean(state.fieldErrors?.status)}
                  className={inputClass}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                {state.fieldErrors?.status && (
                  <p className={errorClass}>{state.fieldErrors.status}</p>
                )}
              </div>

              <div>
                <label htmlFor="published_at" className={labelClass}>
                  Publish Date & Time
                </label>
                <input
                  id="published_at"
                  name="published_at"
                  type="datetime-local"
                  disabled={isPending}
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-hcx-text-secondary">
                  Optional. Leave empty to publish immediately. Choose a future
                  date to schedule publication.
                </p>
              </div>

              <div>
                <label htmlFor="category_id" className={labelClass}>
                  Category
                </label>
                {categoriesAvailable ? (
                  <select
                    id="category_id"
                    name="category_id"
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    disabled={isPending}
                    aria-invalid={Boolean(state.fieldErrors?.category_id)}
                    className={inputClass}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 rounded-lg border border-dashed border-hcx-border bg-hcx-bg/50 px-4 py-3 text-sm text-hcx-text-secondary">
                    No categories available.
                    <br />
                    <Link
                      href="/admin/categories"
                      className="mt-1 inline-block text-hcx-cyan hover:underline"
                    >
                      Manage Categories →
                    </Link>
                  </div>
                )}
                {state.fieldErrors?.category_id && (
                  <p className={errorClass}>{state.fieldErrors.category_id}</p>
                )}
              </div>

              <div>
                <p className={labelClass}>Featured Article</p>
                <label className="mt-2 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="featured"
                    disabled={isPending}
                    className="h-4 w-4 rounded border-hcx-border bg-hcx-bg text-hcx-cyan focus:ring-hcx-cyan/30 focus:ring-offset-hcx-card"
                  />
                  <span className="text-sm text-hcx-text">Mark as featured</span>
                </label>
              </div>

              <FeaturedImageUploader
                disabled={isPending}
                articleTitle={title || "Article featured image"}
                fieldError={state.fieldErrors?.featured_image}
                enableAltText
                onImageUrlChange={setFeaturedImage}
                onAltTextChange={setFeaturedImageAlt}
              />

              <PublishingChecklist values={checklistInput} />
            </div>

            <div className="mt-6 border-t border-hcx-border pt-6">
              <FormButtons isPending={isPending} />
              <p className="mt-3 text-xs text-hcx-text-secondary">
                Preview becomes available after the article is saved once.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
