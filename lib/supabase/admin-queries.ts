import { logQueryError } from "@/lib/supabase/errors";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ArticleStatus,
  LabStatus,
  Message,
  Subscriber,
  TutorialStatus,
} from "@/lib/supabase/types";

export interface AdminDashboardStats {
  totalArticles: number;
  publishedArticles: number;
  labs: number;
  tutorials: number;
  subscribers: number;
  newMessages: number;
}

export type DashboardRecentContentItem =
  | {
      id: string;
      type: "article";
      title: string;
      status: ArticleStatus;
      date: string;
      dateFormatted: string;
      href: string;
    }
  | {
      id: string;
      type: "lab";
      title: string;
      status: LabStatus;
      date: string;
      dateFormatted: string;
      href: string;
    }
  | {
      id: string;
      type: "tutorial";
      title: string;
      status: TutorialStatus;
      date: string;
      dateFormatted: string;
      href: string;
    };

export type DashboardRecentMessage = Pick<
  Message,
  "id" | "name" | "subject" | "status" | "created_at"
>;

export type DashboardRecentSubscriber = Pick<
  Subscriber,
  "id" | "email" | "status" | "subscribed_at"
>;

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  recentContent: DashboardRecentContentItem[];
  recentMessages: DashboardRecentMessage[];
  recentSubscribers: DashboardRecentSubscriber[];
}

const EMPTY_STATS: AdminDashboardStats = {
  totalArticles: 0,
  publishedArticles: 0,
  labs: 0,
  tutorials: 0,
  subscribers: 0,
  newMessages: 0,
};

const EMPTY_DASHBOARD: AdminDashboardData = {
  stats: EMPTY_STATS,
  recentContent: [],
  recentMessages: [],
  recentSubscribers: [],
};

const RECENT_LIMIT = 5;

function formatDashboardDate(value: string | null): string {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function countRows(
  table:
    | "articles"
    | "labs"
    | "tutorials"
    | "subscribers"
    | "messages",
  filter?: { column: string; value: string },
): Promise<number> {
  const supabase = await createClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;

  if (error) {
    logQueryError(`admin-dashboard:${table}`, error);
    return 0;
  }

  return count ?? 0;
}

async function fetchRecentContent(): Promise<DashboardRecentContentItem[]> {
  const supabase = await createClient();

  const [articlesResult, labsResult, tutorialsResult] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, status, updated_at, created_at")
      .order("updated_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("labs")
      .select("id, title, status, updated_at, created_at")
      .order("updated_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("tutorials")
      .select("id, title, status, updated_at, created_at")
      .order("updated_at", { ascending: false })
      .limit(RECENT_LIMIT),
  ]);

  if (articlesResult.error) {
    logQueryError("admin-dashboard:recentArticles", articlesResult.error);
  }

  if (labsResult.error) {
    logQueryError("admin-dashboard:recentLabs", labsResult.error);
  }

  if (tutorialsResult.error) {
    logQueryError("admin-dashboard:recentTutorials", tutorialsResult.error);
  }

  const items: DashboardRecentContentItem[] = [
    ...((articlesResult.data ?? []) as Array<{
      id: string;
      title: string;
      status: ArticleStatus;
      updated_at: string;
      created_at: string;
    }>).map((row) => ({
      id: row.id,
      type: "article" as const,
      title: row.title,
      status: row.status,
      date: row.updated_at || row.created_at,
      dateFormatted: formatDashboardDate(row.updated_at || row.created_at),
      href: `/admin/articles/${row.id}/edit`,
    })),
    ...((labsResult.data ?? []) as Array<{
      id: string;
      title: string;
      status: LabStatus;
      updated_at: string;
      created_at: string;
    }>).map((row) => ({
      id: row.id,
      type: "lab" as const,
      title: row.title,
      status: row.status,
      date: row.updated_at || row.created_at,
      dateFormatted: formatDashboardDate(row.updated_at || row.created_at),
      href: `/admin/labs/${row.id}/edit`,
    })),
    ...((tutorialsResult.data ?? []) as Array<{
      id: string;
      title: string;
      status: TutorialStatus;
      updated_at: string;
      created_at: string;
    }>).map((row) => ({
      id: row.id,
      type: "tutorial" as const,
      title: row.title,
      status: row.status,
      date: row.updated_at || row.created_at,
      dateFormatted: formatDashboardDate(row.updated_at || row.created_at),
      href: `/admin/tutorials/${row.id}/edit`,
    })),
  ];

  return items
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, RECENT_LIMIT);
}

async function fetchRecentMessages(): Promise<DashboardRecentMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, name, subject, status, created_at")
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);

  if (error) {
    logQueryError("admin-dashboard:recentMessages", error);
    return [];
  }

  return (data ?? []) as DashboardRecentMessage[];
}

async function fetchRecentSubscribers(): Promise<DashboardRecentSubscriber[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("id, email, status, subscribed_at")
    .order("subscribed_at", { ascending: false })
    .limit(RECENT_LIMIT);

  if (error) {
    logQueryError("admin-dashboard:recentSubscribers", error);
    return [];
  }

  return (data ?? []) as DashboardRecentSubscriber[];
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const data = await getAdminDashboardData();
  return data.stats;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  if (!hasSupabaseEnv()) {
    return EMPTY_DASHBOARD;
  }

  try {
    const [
      totalArticles,
      publishedArticles,
      labs,
      tutorials,
      subscribers,
      newMessages,
      recentContent,
      recentMessages,
      recentSubscribers,
    ] = await Promise.all([
      countRows("articles"),
      countRows("articles", { column: "status", value: "published" }),
      countRows("labs"),
      countRows("tutorials"),
      countRows("subscribers", { column: "status", value: "active" }),
      countRows("messages", { column: "status", value: "new" }),
      fetchRecentContent(),
      fetchRecentMessages(),
      fetchRecentSubscribers(),
    ]);

    return {
      stats: {
        totalArticles,
        publishedArticles,
        labs,
        tutorials,
        subscribers,
        newMessages,
      },
      recentContent,
      recentMessages,
      recentSubscribers,
    };
  } catch {
    return EMPTY_DASHBOARD;
  }
}
