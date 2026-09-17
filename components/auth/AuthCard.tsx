import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-xl border border-hcx-border bg-hcx-card p-6 shadow-[0_8px_32px_rgba(0,0,0,0.25)] sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-hcx-text">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
          {description}
        </p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
