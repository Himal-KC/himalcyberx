"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { TutorialActionState } from "@/lib/actions/tutorials";
import {
  TUTORIAL_CATEGORIES,
  TUTORIAL_DIFFICULTIES,
} from "@/lib/tutorials/constants";
import { slugifyTitle } from "@/lib/tutorials/validation";
import type { Tutorial } from "@/lib/supabase/types";
import { FeaturedImageUploader } from "@/components/admin/articles/FeaturedImageUploader";
import { focusRing } from "@/lib/page-data";

const inputClass =
  "mt-2 w-full rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "block text-sm font-medium text-hcx-text";
const sectionLabelClass =
  "font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan";
const errorClass = "mt-1.5 text-sm text-hcx-red";

interface TutorialFormProps {
  action: (
    prevState: TutorialActionState,
    formData: FormData,
  ) => Promise<TutorialActionState>;
  tutorial?: Tutorial | null;
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
        {isPending ? "Publishing…" : "Publish Tutorial"}
      </button>
      <Link
        href="/admin/tutorials"
        className={`w-full rounded-lg border border-hcx-border px-4 py-2.5 text-center text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg-secondary ${focusRing}`}
      >
        Cancel
      </Link>
    </div>
  );
}

export function TutorialForm({ action, tutorial = null }: TutorialFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [title, setTitle] = useState(tutorial?.title ?? "");
  const [slug, setSlug] = useState(tutorial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(tutorial?.slug));

  function handleTitleChange(nextTitle: string) {
    setTitle(nextTitle);
    if (!slugEdited) {
      setSlug(slugifyTitle(nextTitle));
    }
  }

  return (
    <form action={formAction} noValidate>
      {state.message && !state.fieldErrors && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-hcx-red/25 bg-hcx-red/10 p-4 text-sm text-hcx-red"
        >
          {state.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:items-start">
        <section className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
          <h2 className={sectionLabelClass}>Tutorial Content</h2>

          <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="title" className={labelClass}>
                Tutorial Title
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
                placeholder="Enter tutorial title"
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
                placeholder="tutorial-url-slug"
                aria-invalid={Boolean(state.fieldErrors?.slug)}
                className={`${inputClass} font-mono`}
              />
              <p className="mt-1.5 text-xs text-hcx-text-secondary">
                URL path: /tutorials/{slug || "tutorial-url-slug"}
              </p>
              {state.fieldErrors?.slug && (
                <p className={errorClass}>{state.fieldErrors.slug}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>
                Short Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                minLength={20}
                rows={3}
                defaultValue={tutorial?.description ?? ""}
                disabled={isPending}
                placeholder="Brief summary of what learners will practice..."
                aria-invalid={Boolean(state.fieldErrors?.description)}
                className={inputClass}
              />
              {state.fieldErrors?.description && (
                <p className={errorClass}>{state.fieldErrors.description}</p>
              )}
            </div>

            <div>
              <label htmlFor="introduction" className={labelClass}>
                Introduction
              </label>
              <textarea
                id="introduction"
                name="introduction"
                rows={6}
                defaultValue={tutorial?.introduction ?? ""}
                disabled={isPending}
                placeholder="Introduce the tutorial topic and learning goals..."
                aria-invalid={Boolean(state.fieldErrors?.introduction)}
                className={inputClass}
              />
              {state.fieldErrors?.introduction && (
                <p className={errorClass}>{state.fieldErrors.introduction}</p>
              )}
            </div>

            <div>
              <label htmlFor="requirements" className={labelClass}>
                Requirements
              </label>
              <textarea
                id="requirements"
                name="requirements"
                rows={4}
                defaultValue={tutorial?.requirements ?? ""}
                disabled={isPending}
                placeholder="Prerequisites, tools, and setup needed..."
                aria-invalid={Boolean(state.fieldErrors?.requirements)}
                className={inputClass}
              />
              {state.fieldErrors?.requirements && (
                <p className={errorClass}>{state.fieldErrors.requirements}</p>
              )}
            </div>

            <div>
              <label htmlFor="instructions" className={labelClass}>
                Step-by-Step Instructions
              </label>
              <textarea
                id="instructions"
                name="instructions"
                rows={16}
                defaultValue={tutorial?.instructions ?? ""}
                disabled={isPending}
                placeholder="Detailed tutorial steps learners should follow..."
                aria-invalid={Boolean(state.fieldErrors?.instructions)}
                className={`${inputClass} min-h-[20rem] font-mono leading-relaxed`}
              />
              {state.fieldErrors?.instructions && (
                <p className={errorClass}>{state.fieldErrors.instructions}</p>
              )}
            </div>

            <div>
              <label htmlFor="key_takeaways" className={labelClass}>
                Key Takeaways
              </label>
              <textarea
                id="key_takeaways"
                name="key_takeaways"
                rows={5}
                defaultValue={tutorial?.key_takeaways ?? ""}
                disabled={isPending}
                placeholder="Summarize the most important points learners should remember..."
                aria-invalid={Boolean(state.fieldErrors?.key_takeaways)}
                className={inputClass}
              />
              {state.fieldErrors?.key_takeaways && (
                <p className={errorClass}>{state.fieldErrors.key_takeaways}</p>
              )}
            </div>

            <div>
              <label htmlFor="security_notes" className={labelClass}>
                Security Notes
              </label>
              <textarea
                id="security_notes"
                name="security_notes"
                rows={4}
                defaultValue={tutorial?.security_notes ?? ""}
                disabled={isPending}
                placeholder="Authorized use, legal and safety reminders..."
                aria-invalid={Boolean(state.fieldErrors?.security_notes)}
                className={inputClass}
              />
              {state.fieldErrors?.security_notes && (
                <p className={errorClass}>{state.fieldErrors.security_notes}</p>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <div className="rounded-xl border border-hcx-border bg-hcx-card p-6">
            <h2 className={sectionLabelClass}>Publishing</h2>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="category" className={labelClass}>
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  defaultValue={tutorial?.category ?? ""}
                  disabled={isPending}
                  aria-invalid={Boolean(state.fieldErrors?.category)}
                  className={inputClass}
                >
                  <option value="">Select a category</option>
                  {TUTORIAL_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.category && (
                  <p className={errorClass}>{state.fieldErrors.category}</p>
                )}
              </div>

              <div>
                <label htmlFor="difficulty" className={labelClass}>
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  defaultValue={tutorial?.difficulty ?? "Beginner"}
                  disabled={isPending}
                  aria-invalid={Boolean(state.fieldErrors?.difficulty)}
                  className={inputClass}
                >
                  {TUTORIAL_DIFFICULTIES.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.difficulty && (
                  <p className={errorClass}>{state.fieldErrors.difficulty}</p>
                )}
              </div>

              <div>
                <label htmlFor="estimated_time" className={labelClass}>
                  Estimated Time
                </label>
                <input
                  id="estimated_time"
                  name="estimated_time"
                  type="text"
                  defaultValue={tutorial?.estimated_time ?? ""}
                  disabled={isPending}
                  placeholder="e.g. 25 min"
                  aria-invalid={Boolean(state.fieldErrors?.estimated_time)}
                  className={inputClass}
                />
                {state.fieldErrors?.estimated_time && (
                  <p className={errorClass}>
                    {state.fieldErrors.estimated_time}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={tutorial?.status ?? "draft"}
                  disabled={isPending}
                  aria-invalid={Boolean(state.fieldErrors?.status)}
                  className={inputClass}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                {state.fieldErrors?.status && (
                  <p className={errorClass}>{state.fieldErrors.status}</p>
                )}
              </div>

              <div>
                <p className={labelClass}>Featured Tutorial</p>
                <label className="mt-2 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={tutorial?.featured ?? false}
                    disabled={isPending}
                    className="h-4 w-4 rounded border-hcx-border bg-hcx-bg text-hcx-cyan focus:ring-hcx-cyan/30 focus:ring-offset-hcx-card"
                  />
                  <span className="text-sm text-hcx-text">
                    Mark as featured
                  </span>
                </label>
              </div>

              <FeaturedImageUploader
                disabled={isPending}
                defaultUrl={tutorial?.featured_image}
                articleTitle={title || tutorial?.title || "Tutorial featured image"}
                fieldError={state.fieldErrors?.featured_image}
                storageFolder="tutorials"
              />
            </div>

            <div className="mt-6 border-t border-hcx-border pt-6">
              <FormButtons isPending={isPending} />
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
