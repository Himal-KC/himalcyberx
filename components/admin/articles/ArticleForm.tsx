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
import {
  slugifyTitle,
  toDatetimeLocalValue,
} from "@/lib/articles/validation";
import type { Article, Category } from "@/lib/supabase/types";
import { focusRing } from "@/lib/page-data";

const inputClass =
  "mt-2 w-full rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "block text-sm font-medium text-hcx-text";

const errorClass = "mt-1.5 text-sm text-hcx-red";

interface ArticleFormProps {
  action: (
    prevState: ArticleActionState,
    formData: FormData,
  ) => Promise<ArticleActionState>;
  categories: Category[];
  article?: Article;
  articleId?: string;
  submitLabel: string;
}

export function ArticleForm({
  action,
  categories,
  article,
  articleId,
  submitLabel,
}: ArticleFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(article));
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [categoryId, setCategoryId] = useState(article?.category_id ?? "");
  const [status, setStatus] = useState(article?.status ?? "draft");
  const [featuredImage, setFeaturedImage] = useState(article?.featured_image ?? "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(
    article?.featured_image_alt ?? "",
  );
  const [seoTitle, setSeoTitle] = useState(article?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    article?.seo_description ?? "",
  );
  const [ogTitle, setOgTitle] = useState(article?.og_title ?? "");
  const [ogDescription, setOgDescription] = useState(
    article?.og_description ?? "",
  );
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
    if (allowSubmit) {
      setAllowSubmit(false);
      return;
    }

    if (status === "published" && hasPublishWarnings(checklistInput)) {
      event.preventDefault();
      const confirmed = window.confirm(
        formatPublishWarningMessage(getPublishWarnings(checklistInput)),
      );

      if (confirmed) {
        setAllowSubmit(true);
        event.currentTarget.requestSubmit();
      }
    }
  }

  return (
    <form
      action={formAction}
      noValidate
      className="space-y-8"
      onSubmit={handleSubmit}
    >
      <input
        type="hidden"
        name="categories_available"
        value={categoriesAvailable ? "true" : "false"}
      />

      {state.message && !state.fieldErrors && (
        <div
          role="alert"
          className="rounded-lg border border-hcx-red/25 bg-hcx-red/10 p-4 text-sm text-hcx-red"
        >
          {state.message}
        </div>
      )}

      <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
        <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Article Details
        </h2>

        <div className="mt-6 space-y-5">
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
              aria-invalid={Boolean(state.fieldErrors?.slug)}
              className={`${inputClass} font-mono`}
            />
            <p className="mt-1.5 text-xs text-hcx-text-secondary">
              Auto-generated from the title until you edit it manually. URL path:
              /articles/{slug || "your-article-slug"}
            </p>
            {state.fieldErrors?.slug && (
              <p className={errorClass}>{state.fieldErrors.slug}</p>
            )}
          </div>

          <div>
            <label htmlFor="excerpt" className={labelClass}>
              Excerpt
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              required
              minLength={20}
              rows={3}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              disabled={isPending}
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

      <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
        <h2 className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
          Publishing
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="author" className={labelClass}>
              Author
            </label>
            <input
              id="author"
              name="author"
              type="text"
              defaultValue={article?.author ?? DEFAULT_ARTICLE_AUTHOR}
              disabled={isPending}
              aria-invalid={Boolean(state.fieldErrors?.author)}
              className={inputClass}
            />
            {state.fieldErrors?.author && (
              <p className={errorClass}>{state.fieldErrors.author}</p>
            )}
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
                No categories available.{" "}
                <Link
                  href="/admin/categories"
                  className="text-hcx-cyan hover:underline"
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
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as typeof status)
              }
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
              defaultValue={toDatetimeLocalValue(article?.published_at)}
              disabled={isPending}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-hcx-text-secondary">
              Leave empty when publishing to use the current timestamp. Choose a
              future date to schedule publication while keeping status as
              Published.
            </p>
          </div>

          <div className="sm:col-span-2">
            <FeaturedImageUploader
              disabled={isPending}
              defaultUrl={article?.featured_image}
              defaultAltText={article?.featured_image_alt}
              articleTitle={title || article?.title || "Article featured image"}
              fieldError={state.fieldErrors?.featured_image}
              enableAltText
              onImageUrlChange={setFeaturedImage}
              onAltTextChange={setFeaturedImageAlt}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={article?.featured ?? false}
                disabled={isPending}
                className="h-4 w-4 rounded border-hcx-border bg-hcx-bg text-hcx-cyan focus:ring-hcx-cyan/30 focus:ring-offset-hcx-card"
              />
              <span className="text-sm text-hcx-text">Featured article</span>
            </label>
          </div>

          <div className="sm:col-span-2">
            <PublishingChecklist values={checklistInput} />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className={`rounded-lg bg-hcx-cyan px-5 py-2.5 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
        {articleId ? (
          <Link
            href={`/admin/articles/${articleId}/preview`}
            className={`rounded-lg border border-hcx-border px-5 py-2.5 text-sm font-medium text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan ${focusRing}`}
          >
            Preview
          </Link>
        ) : null}
        <Link
          href="/admin/articles"
          className={`rounded-lg border border-hcx-border px-5 py-2.5 text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg-secondary ${focusRing}`}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
