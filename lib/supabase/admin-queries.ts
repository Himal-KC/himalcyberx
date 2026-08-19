import { articlePath } from "@/lib/articles";
import {
  isArticlePubliclyAvailable,
  isArticleScheduled,
} from "@/lib/articles/publishing";
import { logQueryError } from "@/lib/supabase/errors";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { labPath } from "@/lib/supabase/public-labs";
import { tutorialPath } from "@/lib/supabase/public-tutorials";
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
  draftArticles: number;
  scheduledArticles: number;
  labs: number;
  tutorials: number;
  subscribers: number;
  newMessages: number;
}

export interface ArticleStatusOverview {
  published: number;
  draft: number;
  scheduled: number;
}

export interface DashboardScheduledArticleItem {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  publishedAtFormatted: string;
  category: string | null;
  editHref: string;
  previewHref: string;
}

export type DashboardRecentContentItem =
  | {
      id: string;
      type: "article";
      title: string;
      status: ArticleStatus;
      slug: string;
      publishedAt: string | null;
      date: string;
      dateFormatted: string;
      editHref: string;
      viewHref: string | null;
      previewHref: string | null;
    }
  | {
      id: string;
      type: "lab";
      title: string;
      status: LabStatus;
      slug: string;
      date: string;
      dateFormatted: string;
      editHref: string;
      viewHref: string | null;
    }
  | {
      id: string;
      type: "tutorial";
      title: string;
      status: TutorialStatus;
      slug: string;
      date: string;
      dateFormatted: string;
      editHref: string;
      viewHref: string | null;
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
  articleStatusOverview: ArticleStatusOverview;
  scheduledArticles: DashboardScheduledArticleItem[];
  recentContent: DashboardRecentContentItem[];
  recentMessages: DashboardRecentMessage[];
  recentSubscribers: DashboardRecentSubscriber[];
}

type ArticleDashboardRow = {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  published_at: string | null;
  updated_at: string;
  created_at: string;
  categories: { name: string } | { name: string }[] | null;
};

type NormalizedArticleDashboardRow = Omit<ArticleDashboardRow, "categories"> & {
  categories: { name: string } | null;
};

function normalizeArticleDashboardRow(
  row: ArticleDashboardRow,
): NormalizedArticleDashboardRow {
  const category = Array.isArray(row.categories)
    ? (row.categories[0] ?? null)
    : row.categories;

  return {
    ...row,
    categories: category,
  };
}

const EMPTY_STATS: AdminDashboardStats = {
  totalArticles: 0,
  publishedArticles: 0,
  draftArticles: 0,
  scheduledArticles: 0,
  labs: 0,
  tutorials: 0,
  subscribers: 0,
  newMessages: 0,
};

const EMPTY_OVERVIEW: ArticleStatusOverview = {
  published: 0,
  draft: 0,
  scheduled: 0,
};

const EMPTY_DASHBOARD: AdminDashboardData = {
  stats: EMPTY_STATS,
  articleStatusOverview: EMPTY_OVERVIEW,
  scheduledArticles: [],
  recentContent: [],
  recentMessages: [],
  recentSubscribers: [],
};

const RECENT_LIST_LIMIT = 5;
const RECENT_CONTENT_LIMIT = 10;

function formatDashboardDate(value: string | null): string {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatScheduledDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function deriveArticleStats(rows: NormalizedArticleDashboardRow[]) {
  const published = rows.filter((row) => isArticlePubliclyAvailable(row)).length;
  const draft = rows.filter((row) => row.status === "draft").length;
  const scheduled = rows.filter((row) => isArticleScheduled(row)).length;

  return {
    totalArticles: rows.length,
    publishedArticles: published,
    draftArticles: draft,
    scheduledArticles: scheduled,
    articleStatusOverview: {
      published,
      draft,
      scheduled,
    },
  };
}

function mapScheduledArticles(
  rows: NormalizedArticleDashboardRow[],
): DashboardScheduledArticleItem[] {
  return rows
    .filter((row) => isArticleScheduled(row) && row.published_at)
    .sort(
      (a, b) =>
        Date.parse(a.published_at as string) - Date.parse(b.published_at as string),
    )
    .map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      publishedAt: row.published_at as string,
      publishedAtFormatted: formatScheduledDateTime(row.published_at as string),
      category: row.categories?.name ?? null,
      editHref: `/admin/articles/${row.id}/edit`,
      previewHref: `/admin/articles/${row.id}/preview`,
    }));
}

function mapRecentArticleItems(
  rows: NormalizedArticleDashboardRow[],
): DashboardRecentContentItem[] {
  return rows.slice(0, RECENT_LIST_LIMIT).map((row) => {
    const isLive = isArticlePubliclyAvailable(row);

    return {
      id: row.id,
      type: "article" as const,
      title: row.title,
      status: row.status,
      slug: row.slug,
      publishedAt: row.published_at,
      date: row.updated_at || row.created_at,
      dateFormatted: formatDashboardDate(row.updated_at || row.created_at),
      editHref: `/admin/articles/${row.id}/edit`,
      viewHref: isLive ? articlePath(row.slug) : null,
      previewHref:
        !isLive && row.status !== "archived"
          ? `/admin/articles/${row.id}/preview`
          : null,
    };
  });
}

async function countRows(
  table: "labs" | "tutorials" | "subscribers" | "messages",
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

async function fetchArticleDashboardRows(): Promise<NormalizedArticleDashboardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, title, slug, status, published_at, updated_at, created_at, categories(name)",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    logQueryError("admin-dashboard:articles", error);
    return [];
  }

  return ((data ?? []) as ArticleDashboardRow[]).map(normalizeArticleDashboardRow);
}

async function fetchRecentLabsAndTutorials(): Promise<DashboardRecentContentItem[]> {
  const supabase = await createClient();

  const [labsResult, tutorialsResult] = await Promise.all([
    supabase
      .from("labs")
      .select("id, title, slug, status, updated_at, created_at")
      .order("updated_at", { ascending: false })
      .limit(RECENT_LIST_LIMIT),
    supabase
      .from("tutorials")
      .select("id, title, slug, status, updated_at, created_at")
      .order("updated_at", { ascending: false })
      .limit(RECENT_LIST_LIMIT),
  ]);

  if (labsResult.error) {
    logQueryError("admin-dashboard:recentLabs", labsResult.error);
  }

  if (tutorialsResult.error) {
    logQueryError("admin-dashboard:recentTutorials", tutorialsResult.error);
  }

  const labItems: DashboardRecentContentItem[] = (
    (labsResult.data ?? []) as Array<{
      id: string;
      title: string;
      slug: string;
      status: LabStatus;
      updated_at: string;
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    type: "lab" as const,
    title: row.title,
    status: row.status,
    slug: row.slug,
    date: row.updated_at || row.created_at,
    dateFormatted: formatDashboardDate(row.updated_at || row.created_at),
    editHref: `/admin/labs/${row.id}/edit`,
    viewHref: row.status === "published" ? labPath(row.slug) : null,
  }));

  const tutorialItems: DashboardRecentContentItem[] = (
    (tutorialsResult.data ?? []) as Array<{
      id: string;
      title: string;
      slug: string;
      status: TutorialStatus;
      updated_at: string;
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    type: "tutorial" as const,
    title: row.title,
    status: row.status,
    slug: row.slug,
    date: row.updated_at || row.created_at,
    dateFormatted: formatDashboardDate(row.updated_at || row.created_at),
    editHref: `/admin/tutorials/${row.id}/edit`,
    viewHref: row.status === "published" ? tutorialPath(row.slug) : null,
  }));

  return [...labItems, ...tutorialItems];
}

async function fetchRecentMessages(): Promise<DashboardRecentMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, name, subject, status, created_at")
    .order("created_at", { ascending: false })
    .limit(RECENT_LIST_LIMIT);

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
    .limit(RECENT_LIST_LIMIT);

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
      articleRows,
      labs,
      tutorials,
      subscribers,
      newMessages,
      otherRecentContent,
      recentMessages,
      recentSubscribers,
    ] = await Promise.all([
      fetchArticleDashboardRows(),
      countRows("labs"),
      countRows("tutorials"),
      countRows("subscribers", { column: "status", value: "active" }),
      countRows("messages", { column: "status", value: "new" }),
      fetchRecentLabsAndTutorials(),
      fetchRecentMessages(),
      fetchRecentSubscribers(),
    ]);

    const articleStats = deriveArticleStats(articleRows);
    const scheduledArticles = mapScheduledArticles(articleRows);
    const recentArticles = mapRecentArticleItems(articleRows);
    const recentContent = [...recentArticles, ...otherRecentContent]
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, RECENT_CONTENT_LIMIT);

    return {
      stats: {
        totalArticles: articleStats.totalArticles,
        publishedArticles: articleStats.publishedArticles,
        draftArticles: articleStats.draftArticles,
        scheduledArticles: articleStats.scheduledArticles,
        labs,
        tutorials,
        subscribers,
        newMessages,
      },
      articleStatusOverview: articleStats.articleStatusOverview,
      scheduledArticles,
      recentContent,
      recentMessages,
      recentSubscribers,
    };
  } catch {
    return EMPTY_DASHBOARD;
  }
}
