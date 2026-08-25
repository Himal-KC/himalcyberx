"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { LabActionState } from "@/lib/actions/labs";
import { LAB_CATEGORIES, LAB_DIFFICULTIES } from "@/lib/labs/constants";
import { slugifyTitle } from "@/lib/labs/validation";
import type { Lab } from "@/lib/supabase/types";
import { FeaturedImageUploader } from "@/components/admin/articles/FeaturedImageUploader";
import { RichContentField } from "@/components/admin/editor/RichContentField";
import { focusRing } from "@/lib/page-data";

const inputClass =
  "mt-2 w-full rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "block text-sm font-medium text-hcx-text";
const sectionLabelClass =
  "font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan";
const errorClass = "mt-1.5 text-sm text-hcx-red";

interface LabFormProps {
  action: (
    prevState: LabActionState,
    formData: FormData,
  ) => Promise<LabActionState>;
  lab?: Lab | null;
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
        {isPending ? "Publishing…" : "Publish Lab"}
      </button>
      <Link
        href="/admin/labs"
        className={`w-full rounded-lg border border-hcx-border px-4 py-2.5 text-center text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg-secondary ${focusRing}`}
      >
        Cancel
      </Link>
    </div>
  );
}

export function LabForm({ action, lab = null }: LabFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [title, setTitle] = useState(lab?.title ?? "");
  const [slug, setSlug] = useState(lab?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(lab?.slug));
  const [introduction, setIntroduction] = useState(lab?.introduction ?? "");
  const [learningObjectives, setLearningObjectives] = useState(
    lab?.learning_objectives ?? "",
  );
  const [requirementsTools, setRequirementsTools] = useState(
    lab?.requirements_tools ?? "",
  );
  const [instructions, setInstructions] = useState(lab?.instructions ?? "");
  const [expectedResult, setExpectedResult] = useState(lab?.expected_result ?? "");
  const [securityNotes, setSecurityNotes] = useState(lab?.security_notes ?? "");

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
          <h2 className={sectionLabelClass}>Lab Content</h2>

          <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="title" className={labelClass}>
                Lab Title
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
                placeholder="Enter lab title"
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
                placeholder="lab-url-slug"
                aria-invalid={Boolean(state.fieldErrors?.slug)}
                className={`${inputClass} font-mono`}
              />
              <p className="mt-1.5 text-xs text-hcx-text-secondary">
                URL path: /cyber-lab/{slug || "lab-url-slug"}
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
                defaultValue={lab?.description ?? ""}
                disabled={isPending}
                placeholder="Brief summary of what learners will practice..."
                aria-invalid={Boolean(state.fieldErrors?.description)}
                className={inputClass}
              />
              {state.fieldErrors?.description && (
                <p className={errorClass}>{state.fieldErrors.description}</p>
              )}
            </div>

            <RichContentField
              id="introduction"
              name="introduction"
              label="Lab Introduction"
              value={introduction}
              onChange={setIntroduction}
              disabled={isPending}
              invalid={Boolean(state.fieldErrors?.introduction)}
              error={state.fieldErrors?.introduction}
              minHeightClass="min-h-[12rem]"
            />

            <RichContentField
              id="learning_objectives"
              name="learning_objectives"
              label="Learning Objectives"
              value={learningObjectives}
              onChange={setLearningObjectives}
              disabled={isPending}
              invalid={Boolean(state.fieldErrors?.learning_objectives)}
              error={state.fieldErrors?.learning_objectives}
              minHeightClass="min-h-[10rem]"
              enableTables={false}
            />

            <RichContentField
              id="requirements_tools"
              name="requirements_tools"
              label="Requirements / Tools"
              value={requirementsTools}
              onChange={setRequirementsTools}
              disabled={isPending}
              invalid={Boolean(state.fieldErrors?.requirements_tools)}
              error={state.fieldErrors?.requirements_tools}
              minHeightClass="min-h-[10rem]"
              enableTables={false}
            />

            <RichContentField
              id="instructions"
              name="instructions"
              label="Step-by-Step Instructions"
              value={instructions}
              onChange={setInstructions}
              disabled={isPending}
              invalid={Boolean(state.fieldErrors?.instructions)}
              error={state.fieldErrors?.instructions}
              minHeightClass="min-h-[20rem]"
              helperText="Use headings, code blocks, and tables for structured lab steps."
            />

            <RichContentField
              id="expected_result"
              name="expected_result"
              label="Expected Result"
              value={expectedResult}
              onChange={setExpectedResult}
              disabled={isPending}
              invalid={Boolean(state.fieldErrors?.expected_result)}
              error={state.fieldErrors?.expected_result}
              minHeightClass="min-h-[10rem]"
              enableTables={false}
            />

            <RichContentField
              id="security_notes"
              name="security_notes"
              label="Security Notes"
              value={securityNotes}
              onChange={setSecurityNotes}
              disabled={isPending}
              invalid={Boolean(state.fieldErrors?.security_notes)}
              error={state.fieldErrors?.security_notes}
              minHeightClass="min-h-[10rem]"
              enableTables={false}
            />
          </div>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <div className="rounded-xl border border-hcx-border bg-hcx-card p-6">
            <h2 className={sectionLabelClass}>Publishing</h2>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="difficulty" className={labelClass}>
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  defaultValue={lab?.difficulty ?? "Beginner"}
                  disabled={isPending}
                  aria-invalid={Boolean(state.fieldErrors?.difficulty)}
                  className={inputClass}
                >
                  {LAB_DIFFICULTIES.map((level) => (
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
                <label htmlFor="category" className={labelClass}>
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  defaultValue={lab?.category ?? ""}
                  disabled={isPending}
                  aria-invalid={Boolean(state.fieldErrors?.category)}
                  className={inputClass}
                >
                  <option value="">Select a category</option>
                  {LAB_CATEGORIES.map((category) => (
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
                <label htmlFor="estimated_time" className={labelClass}>
                  Estimated Time
                </label>
                <input
                  id="estimated_time"
                  name="estimated_time"
                  type="text"
                  defaultValue={lab?.estimated_time ?? ""}
                  disabled={isPending}
                  placeholder="e.g. 45 min"
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
                  defaultValue={lab?.status ?? "draft"}
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
                <p className={labelClass}>Featured Lab</p>
                <label className="mt-2 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={lab?.featured ?? false}
                    disabled={isPending}
                    className="h-4 w-4 rounded border-hcx-border bg-hcx-bg text-hcx-cyan focus:ring-hcx-cyan/30 focus:ring-offset-hcx-card"
                  />
                  <span className="text-sm text-hcx-text">Mark as featured</span>
                </label>
              </div>

              <FeaturedImageUploader
                disabled={isPending}
                defaultUrl={lab?.featured_image}
                articleTitle={title || lab?.title || "Lab featured image"}
                fieldError={state.fieldErrors?.featured_image}
                storageFolder="labs"
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
