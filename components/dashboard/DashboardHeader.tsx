import Link from "next/link";
import Image from "next/image";
import { UserIcon } from "@/components/icons";
import { LEARNER_PROFILE_PATH } from "@/lib/auth/constants";
import type { LearnerDashboardHeader } from "@/lib/dashboard/types";
import { focusRing } from "@/lib/page-data";

type DashboardHeaderProps = {
  header: LearnerDashboardHeader;
};

export function DashboardHeader({ header }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-6 border-b border-hcx-border pb-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-hcx-border bg-hcx-card">
          {header.avatarUrl ? (
            <Image
              src={header.avatarUrl}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserIcon className="h-8 w-8 text-hcx-cyan" />
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-hcx-cyan">
            Learner Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold text-hcx-text sm:text-3xl">
            Welcome back, {header.welcomeName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-hcx-text-secondary sm:text-base">
            Continue learning, revisit saved content, and track your
            cybersecurity progress.
          </p>
          {header.username ? (
            <p className="mt-2 text-xs text-hcx-text-secondary">
              @{header.username}
            </p>
          ) : null}
        </div>
      </div>
      <Link
        href={LEARNER_PROFILE_PATH}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-hcx-cyan/40 bg-hcx-cyan/10 px-4 py-2.5 text-sm font-semibold text-hcx-cyan transition-colors hover:bg-hcx-cyan/20 ${focusRing}`}
      >
        Edit Profile
      </Link>
    </div>
  );
}
