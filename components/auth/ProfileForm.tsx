"use client";

import { useActionState } from "react";
import {
  formErrorClass,
  formInputClass,
  formLabelClass,
  FormStatusMessage,
} from "@/components/forms/form-ui";
import { LearnerSignOutButton } from "@/components/auth/LearnerSignOutButton";
import { authSubmitClass } from "@/components/auth/AuthPasswordField";
import { focusRing } from "@/lib/page-data";
import {
  removeLearnerAvatar,
  updateLearnerProfile,
  uploadLearnerAvatar,
} from "@/lib/actions/profile";
import {
  PROFILE_BIO_MAX_LENGTH,
  PROFILE_DISPLAY_NAME_MAX_LENGTH,
  PROFILE_USERNAME_MAX_LENGTH,
} from "@/lib/auth/constants";
import { INITIAL_FORM_STATE } from "@/lib/form-types";
import type { Profile } from "@/lib/supabase/types";

interface ProfileFormProps {
  profile: Profile;
  accountEmail: string;
}

function AvatarForm({
  profile,
}: {
  profile: Profile;
}) {
  const [state, formAction, isPending] = useActionState(
    uploadLearnerAvatar,
    INITIAL_FORM_STATE,
  );
  const [removeState, removeAction, isRemoving] = useActionState(
    removeLearnerAvatar,
    INITIAL_FORM_STATE,
  );

  const status = state.message ? state : removeState;

  return (
    <div className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-hcx-text">Avatar</h2>
      <p className="mt-1 text-sm text-hcx-text-secondary">
        JPEG, PNG, or WebP up to 1 MB. Stored only in your avatar folder.
      </p>

      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt=""
          className="mt-4 h-20 w-20 rounded-full border border-hcx-border object-cover"
        />
      ) : (
        <div className="mt-4 flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-hcx-border text-xs text-hcx-text-secondary">
          No photo
        </div>
      )}

      {status.message ? (
        <div className="mt-4">
          <FormStatusMessage state={status} />
        </div>
      ) : null}

      <form action={formAction} className="mt-4 space-y-3" aria-label="Upload avatar">
        <input
          id="profile-avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isPending}
          className="block w-full text-sm text-hcx-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-hcx-cyan file:px-3 file:py-2 file:text-sm file:font-semibold file:text-hcx-bg"
        />
        {state.fieldErrors?.avatar ? (
          <p className={formErrorClass} role="alert">
            {state.fieldErrors.avatar}
          </p>
        ) : null}
        <button type="submit" disabled={isPending} className={authSubmitClass}>
          {isPending ? "Uploading…" : "Upload avatar"}
        </button>
      </form>

      {profile.avatar_url ? (
        <form action={removeAction} className="mt-3">
          <button
            type="submit"
            disabled={isRemoving}
            className={`text-sm font-medium text-hcx-text-secondary transition-colors hover:text-hcx-red disabled:opacity-60 ${focusRing}`}
          >
            {isRemoving ? "Removing…" : "Remove avatar"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function ProfileForm({ profile, accountEmail }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateLearnerProfile,
    INITIAL_FORM_STATE,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
      <form
        action={formAction}
        noValidate
        aria-label="Edit profile"
        className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8"
      >
        {state.message ? <FormStatusMessage state={state} /> : null}

        <div className={`space-y-5 ${state.message ? "mt-5" : ""}`}>
          <div>
            <label htmlFor="profile-display-name" className={formLabelClass}>
              Display name
            </label>
            <input
              id="profile-display-name"
              name="displayName"
              type="text"
              maxLength={PROFILE_DISPLAY_NAME_MAX_LENGTH}
              defaultValue={profile.display_name ?? ""}
              autoComplete="nickname"
              disabled={isPending}
              aria-invalid={Boolean(state.fieldErrors?.displayName)}
              className={`mt-2 ${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
            {state.fieldErrors?.displayName ? (
              <p className={formErrorClass} role="alert">
                {state.fieldErrors.displayName}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="profile-username" className={formLabelClass}>
              Username
            </label>
            <input
              id="profile-username"
              name="username"
              type="text"
              minLength={3}
              maxLength={PROFILE_USERNAME_MAX_LENGTH}
              defaultValue={profile.username ?? ""}
              autoComplete="username"
              disabled={isPending}
              aria-invalid={Boolean(state.fieldErrors?.username)}
              className={`mt-2 ${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
            <p className="mt-1.5 text-xs text-hcx-text-secondary">
              3–32 characters. Letters, numbers, and underscores only.
            </p>
            {state.fieldErrors?.username ? (
              <p className={formErrorClass} role="alert">
                {state.fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="profile-bio" className={formLabelClass}>
              Short bio
            </label>
            <textarea
              id="profile-bio"
              name="bio"
              rows={4}
              maxLength={PROFILE_BIO_MAX_LENGTH}
              defaultValue={profile.bio ?? ""}
              disabled={isPending}
              aria-invalid={Boolean(state.fieldErrors?.bio)}
              className={`mt-2 resize-y ${formInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
            {state.fieldErrors?.bio ? (
              <p className={formErrorClass} role="alert">
                {state.fieldErrors.bio}
              </p>
            ) : null}
          </div>
        </div>

        <button type="submit" disabled={isPending} className={authSubmitClass}>
          {isPending ? "Saving…" : "Save profile"}
        </button>
      </form>

      <div className="space-y-6">
        <AvatarForm profile={profile} />

        <div className="rounded-xl border border-hcx-border bg-hcx-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-hcx-text">Account</h2>
          <p className="mt-1 text-sm text-hcx-text-secondary">
            Sign-in email is private and is not part of your public profile.
          </p>
          <p className="mt-4 break-all text-sm text-hcx-text">{accountEmail}</p>
          <div className="mt-6">
            <LearnerSignOutButton className="rounded-lg border border-hcx-border px-4 py-2 text-sm font-semibold text-hcx-text transition-colors hover:border-hcx-cyan/40 hover:text-hcx-cyan" />
          </div>
        </div>
      </div>
    </div>
  );
}
