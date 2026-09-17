import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthPageLayout, buildAuthPageMetadata } from "@/components/auth/AuthPageLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { LEARNER_DEFAULT_POST_AUTH_PATH, LEARNER_LOGIN_PATH } from "@/lib/auth/constants";
import { getSafeRedirectPath } from "@/lib/auth/redirects";

export const metadata: Metadata = buildAuthPageMetadata(
  "Sign In",
  "Sign in to your HimalCyberX learner account.",
  LEARNER_LOGIN_PATH,
);

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string; reset?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeRedirectPath(params.next, LEARNER_DEFAULT_POST_AUTH_PATH);

  let initialMessage: string | undefined;
  let initialSuccess = false;

  if (params.reset === "success") {
    initialMessage = "Your password has been updated. Sign in with your new password.";
    initialSuccess = true;
  } else if (params.error === "auth") {
    initialMessage = "That sign-in link is invalid or has expired. Please try again.";
  } else if (params.error === "unauthorized") {
    initialMessage = "You are not authorized to open that page.";
  }

  return (
    <AuthPageLayout
      label="Learner Account"
      title="Sign In"
      description="Access your HimalCyberX learner account. This is separate from HCX Admin."
    >
      <AuthCard
        title="Welcome back"
        description="Use the email and password for your learner account."
      >
        <LoginForm
          nextPath={nextPath}
          initialMessage={initialMessage}
          initialSuccess={initialSuccess}
        />
      </AuthCard>
    </AuthPageLayout>
  );
}
