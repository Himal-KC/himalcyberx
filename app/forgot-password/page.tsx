import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthPageLayout, buildAuthPageMetadata } from "@/components/auth/AuthPageLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { LEARNER_FORGOT_PASSWORD_PATH } from "@/lib/auth/constants";

export const metadata: Metadata = buildAuthPageMetadata(
  "Forgot Password",
  "Request a password reset for your HimalCyberX learner account.",
  LEARNER_FORGOT_PASSWORD_PATH,
);

export default function ForgotPasswordPage() {
  return (
    <AuthPageLayout
      label="Learner Account"
      title="Forgot Password"
      description="Enter your account email and we will send reset instructions if it exists."
    >
      <AuthCard
        title="Reset your password"
        description="We send a reset link only when the address matches a learner account. We never reveal whether an email is registered."
      >
        <ForgotPasswordForm />
      </AuthCard>
    </AuthPageLayout>
  );
}
