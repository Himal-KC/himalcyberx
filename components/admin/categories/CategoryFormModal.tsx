"use client";

import { useActionState, useEffect, useState } from "react";
import type { CategoryActionState } from "@/lib/actions/categories";
import { slugifyCategoryName } from "@/lib/categories/validation";
import type { Category } from "@/lib/supabase/types";
import { focusRing } from "@/lib/page-data";

const inputClass =
  "mt-2 w-full rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "block text-sm font-medium text-hcx-text";

const errorClass = "mt-1.5 text-sm text-hcx-red";

interface CategoryFormModalProps {
  open: boolean;
  category?: Category | null;
  action: (
    prevState: CategoryActionState,
    formData: FormData,
  ) => Promise<CategoryActionState>;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryFormModal({
  open,
  category,
  action,
  onClose,
  onSuccess,
}: CategoryFormModalProps) {
  if (!open) {
    return null;
  }

  return (
    <CategoryFormModalBody
      key={category?.id ?? "create"}
      category={category}
      action={action}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function CategoryFormModalBody({
  category,
  action,
  onClose,
  onSuccess,
}: Omit<CategoryFormModalProps, "open">) {
  const isEditing = Boolean(category);
  const [state, formAction, isPending] = useActionState(action, {});
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(isEditing);

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  function handleNameChange(nextName: string) {
    setName(nextName);
    if (!slugEdited) {
      setSlug(slugifyCategoryName(nextName));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={() => !isPending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="w-full max-w-lg rounded-xl border border-hcx-border bg-hcx-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="category-form-title"
          className="text-lg font-semibold text-hcx-text"
        >
          {isEditing ? "Edit Category" : "New Category"}
        </h2>
        <p className="mt-1 text-sm text-hcx-text-secondary">
          {isEditing
            ? "Update the category details below."
            : "Create a category to organize HimalCyberX content."}
        </p>

        <form
          key={category?.id ?? "create"}
          action={formAction}
          noValidate
          className="mt-6 space-y-5"
        >
          {state.message && !state.fieldErrors && (
            <div
              role="alert"
              className="rounded-lg border border-hcx-red/25 bg-hcx-red/10 p-3 text-sm text-hcx-red"
            >
              {state.message}
            </div>
          )}

          <div>
            <label htmlFor="category-name" className={labelClass}>
              Category Name
            </label>
            <input
              id="category-name"
              name="name"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              disabled={isPending}
              placeholder="Threat Intelligence"
              aria-invalid={Boolean(state.fieldErrors?.name)}
              className={inputClass}
            />
            {state.fieldErrors?.name && (
              <p className={errorClass}>{state.fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="category-slug" className={labelClass}>
              Slug
            </label>
            <input
              id="category-slug"
              name="slug"
              type="text"
              required
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value.toLowerCase());
              }}
              disabled={isPending}
              placeholder="threat-intelligence"
              aria-invalid={Boolean(state.fieldErrors?.slug)}
              className={`${inputClass} font-mono`}
            />
            {state.fieldErrors?.slug && (
              <p className={errorClass}>{state.fieldErrors.slug}</p>
            )}
          </div>

          <div>
            <label htmlFor="category-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="category-description"
              name="description"
              rows={3}
              defaultValue={category?.description ?? ""}
              disabled={isPending}
              placeholder="Brief description of this category..."
              aria-invalid={Boolean(state.fieldErrors?.description)}
              className={inputClass}
            />
            {state.fieldErrors?.description && (
              <p className={errorClass}>{state.fieldErrors.description}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className={`rounded-lg border border-hcx-border px-4 py-2 text-sm font-medium text-hcx-text transition-colors hover:bg-hcx-bg disabled:opacity-60 ${focusRing}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`rounded-lg bg-hcx-cyan px-4 py-2 text-sm font-semibold text-hcx-bg transition-opacity hover:opacity-90 disabled:opacity-60 ${focusRing}`}
            >
              {isPending
                ? "Saving…"
                : isEditing
                  ? "Save Changes"
                  : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
