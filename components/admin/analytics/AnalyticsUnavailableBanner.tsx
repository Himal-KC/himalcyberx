import { ANALYTICS_UNAVAILABLE_TITLE } from "@/lib/analytics/admin-dashboard-constants";

interface AnalyticsUnavailableBannerProps {
  message: string;
}

export function AnalyticsUnavailableBanner({
  message,
}: AnalyticsUnavailableBannerProps) {
  return (
    <div
      className="rounded-xl border border-hcx-orange/30 bg-hcx-orange/10 px-4 py-4 sm:px-5"
      role="alert"
    >
      <p className="font-tech text-xs font-semibold uppercase tracking-[0.15em] text-hcx-orange">
        {ANALYTICS_UNAVAILABLE_TITLE}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-hcx-text-secondary">
        {message}
      </p>
    </div>
  );
}
