import { parseGa4MetricInt } from "./ga4-format-core.ts";
import { GA4_SHARE_METHOD_BREAKDOWN_SETUP_NOTICE } from "./ga4-share-dimension-core.ts";
import type {
  AdminAnalyticsShareEngagement,
  AdminAnalyticsShareMethodBreakdownStatus,
  Ga4ReportPayload,
} from "./ga4-types.ts";

const SHARE_METHOD_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  x: "X",
  copy_link: "Copy Link",
};

export function formatShareMethodLabel(methodKey: string): string {
  const normalized = methodKey.trim().toLowerCase();
  return SHARE_METHOD_LABELS[normalized] ?? methodKey;
}

export function normalizeShareEventsTotalReport(
  report: Ga4ReportPayload | null | undefined,
): number {
  return parseGa4MetricInt(report?.rows?.[0]?.metricValues?.[0]?.value);
}

export function normalizeShareEventsByMethodReport(
  report: Ga4ReportPayload | null | undefined,
): Array<{ method: string; label: string; count: number }> {
  const rows = report?.rows ?? [];
  const methods: Array<{ method: string; label: string; count: number }> = [];

  for (const row of rows) {
    const method = row.dimensionValues?.[0]?.value?.trim() ?? "";
    if (!method) {
      continue;
    }

    methods.push({
      method,
      label: formatShareMethodLabel(method),
      count: parseGa4MetricInt(row.metricValues?.[0]?.value),
    });
  }

  return methods.sort((a, b) => b.count - a.count);
}

export function buildShareEngagementSummary(input: {
  totalReport: Ga4ReportPayload | null | undefined;
  methodReport: Ga4ReportPayload | null | undefined;
  methodBreakdownStatus: AdminAnalyticsShareMethodBreakdownStatus;
}): AdminAnalyticsShareEngagement {
  const totalActions = normalizeShareEventsTotalReport(input.totalReport);
  const methods =
    input.methodBreakdownStatus === "available"
      ? normalizeShareEventsByMethodReport(input.methodReport)
      : [];

  return {
    periodDays: 30,
    totalActions,
    methods,
    methodBreakdownStatus: input.methodBreakdownStatus,
    methodBreakdownNotice:
      input.methodBreakdownStatus === "not_configured"
        ? GA4_SHARE_METHOD_BREAKDOWN_SETUP_NOTICE
        : input.methodBreakdownStatus === "unavailable"
          ? "Share method breakdown is temporarily unavailable."
          : undefined,
  };
}
