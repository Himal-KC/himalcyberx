import type { Metadata } from "next";
import { AuthPageLayout, buildAuthPageMetadata } from "@/components/auth/AuthPageLayout";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { LEARNER_PROFILE_PATH } from "@/lib/auth/constants";
import { requireLearnerSession } from "@/lib/auth/session";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateOwnProfile } from "@/lib/supabase/profiles";
import { sanitizeStoredAvatarUrl } from "@/lib/storage/avatars";

export const metadata: Metadata = buildAuthPageMetadata(
  "Your Profile",
  "View and update your HimalCyberX learner profile.",
  LEARNER_PROFILE_PATH,
);

export default async function ProfilePage() {
  const user = await requireLearnerSession();
  const supabase = await createClient();
  const profile = await getOrCreateOwnProfile(supabase, user.id);

  if (!profile) {
    return (
      <AuthPageLayout
        label="Account"
        title="Your Profile"
        description="We could not load your profile right now."
      >
        <p className="text-sm text-hcx-red">
          Your profile is unavailable. Please try again in a moment.
        </p>
      </AuthPageLayout>
    );
  }

  const safeProfile = {
    ...profile,
    avatar_url:
      profile.avatar_url && hasSupabaseEnv()
        ? sanitizeStoredAvatarUrl(
            profile.avatar_url,
            getSupabaseEnv().url,
            user.id,
          )
        : null,
  };

  return (
    <AuthPageLayout
      label="Account"
      title="Your Profile"
      description="Update your display name, username, bio, and avatar. Your sign-in email stays private."
    >
      <ProfileForm profile={safeProfile} accountEmail={user.email ?? ""} />
    </AuthPageLayout>
  );
}
