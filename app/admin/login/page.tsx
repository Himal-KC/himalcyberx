import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminLoginPanel } from "@/components/admin/AdminLoginPanel";

export const metadata: Metadata = {
  title: "Admin Sign In | HimalCyberX",
  robots: { index: false, follow: false },
};

interface AdminLoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { error } = await searchParams;
  const initialError =
    error === "unauthorized"
      ? "You are not authorized to access HCX Admin."
      : undefined;

  return (
    <div className="min-h-screen bg-[#070B14]">
      <div className="grid min-h-screen md:grid-cols-[2fr_3fr] lg:grid-cols-2">
        <AdminLoginPanel />

        <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[500px]">
            <div className="mb-8 text-center md:text-left">
              <p className="font-tech text-xs font-semibold uppercase tracking-[0.25em] text-[#00D9FF]">
                Secure Portal
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#F4F7FB] sm:text-3xl">
                HCX ADMIN
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
                Secure administration portal for HimalCyberX.
              </p>
            </div>

            <AdminLoginForm initialError={initialError} />
          </div>
        </div>
      </div>
    </div>
  );
}
