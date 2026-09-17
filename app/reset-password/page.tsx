import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthPageLayout, buildAuthPageMetadata } from "@/components/auth/AuthPageLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { LEARNER_RESET_PASSWORD_PATH } from "@/lib/auth/constants";
import { getLearnerSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = buildAuthPageMetadata(
  "Reset Password",
  "Choose a new password for your HimalCyberX learner account.",
  LEARNER_RESET_PASSWORD_PATH,
);

export default async function ResetPasswordPage() {
  const user = await getLearnerSessionUser();

  return (
    <AuthPageLayout
      label="Learner Account"
      title="Reset Password"
      description="Choose a new password after following the link from your email."
    >
      <AuthCard
        title="Set a new password"
        description="Use a strong password that you do not reuse on other sites."
      >
        <ResetPasswordForm hasSession={Boolean(user)} />
      </AuthCard>
    </AuthPageLayout>
  );
}
