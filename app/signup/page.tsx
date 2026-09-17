import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthPageLayout, buildAuthPageMetadata } from "@/components/auth/AuthPageLayout";
import { SignupForm } from "@/components/auth/SignupForm";
import {
  LEARNER_DEFAULT_POST_AUTH_PATH,
  LEARNER_SIGNUP_PATH,
} from "@/lib/auth/constants";
import { getSafeRedirectPath } from "@/lib/auth/redirects";

export const metadata: Metadata = buildAuthPageMetadata(
  "Create Account",
  "Create a HimalCyberX learner account.",
  LEARNER_SIGNUP_PATH,
);

interface SignupPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const nextPath = getSafeRedirectPath(params.next, LEARNER_DEFAULT_POST_AUTH_PATH);

  return (
    <AuthPageLayout
      label="Learner Account"
      title="Create Account"
      description="Sign up for a learner account. Admin access is never granted through signup."
    >
      <AuthCard
        title="Join HimalCyberX"
        description="Create a learner account to manage your profile. You will never receive HCX Admin privileges from this form."
      >
        <SignupForm nextPath={nextPath} />
      </AuthCard>
    </AuthPageLayout>
  );
}
