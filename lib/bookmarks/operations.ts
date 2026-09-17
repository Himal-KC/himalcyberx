import "server-only";

import { isPublishedAtPubliclyAvailable } from "@/lib/articles/publishing";
import { getLearnerServerClient } from "@/lib/auth/session";
import {
  getBookmarkUiState as getBookmarkUiStateWithStore,
  isContentSaved as isContentSavedWithStore,
  listSavedContent as listSavedContentWithStore,
  removeBookmarkedContent as removeBookmarkedContentWithStore,
  saveBookmarkedContent as saveBookmarkedContentWithStore,
} from "@/lib/bookmarks/core";
import type { BookmarkStore } from "@/lib/bookmarks/types";
import type {
  BookmarkOpResult,
  BookmarkUiState,
  ContentTable,
  SavedContentColumn,
  SavedContentInsertPayload,
  SavedContentItem,
  SavedContentRow,
} from "@/lib/bookmarks/types";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type LearnerClient = Extract<
  Awaited<ReturnType<typeof getLearnerServerClient>>,
  { ok: true }
>["supabase"];

function embedRecord(
  value: unknown,
): { title: string | null; slug: string | null } | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") {
    return null;
  }

  const record = row as Record<string, unknown>;
  return {
    title: typeof record.title === "string" ? record.title : null,
    slug: typeof record.slug === "string" ? record.slug : null,
  };
}

function mapSavedContentRow(row: Record<string, unknown>): SavedContentRow {
  return {
    id: String(row.id ?? ""),
    created_at: String(row.created_at ?? ""),
    article_id: typeof row.article_id === "string" ? row.article_id : null,
    tutorial_id: typeof row.tutorial_id === "string" ? row.tutorial_id : null,
    lab_id: typeof row.lab_id === "string" ? row.lab_id : null,
    articles: embedRecord(row.articles),
    tutorials: embedRecord(row.tutorials),
    labs: embedRecord(row.labs),
  };
}

function createSessionStore(supabase: LearnerClient, userId: string): BookmarkStore {
  return {
    getSessionUser: async () => ({ id: userId }),
    findPublishedContent: async (table: ContentTable, id: string) => {
      const { data, error } = await supabase
        .from(table)
        .select("id, published_at")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();

      if (error || !data) {
        return { found: false };
      }

      const publishedAt =
        data && typeof data === "object" && "published_at" in data
          ? (data.published_at as string | null)
          : null;

      return { found: isPublishedAtPubliclyAvailable(publishedAt) };
    },
    insertSavedContent: async (payload: SavedContentInsertPayload) => {
      const { error } = await supabase.from("saved_content").insert(payload);
      return {
        error: error
          ? { code: error.code, message: error.message }
          : null,
      };
    },
    findOwnSavedContent: async (
      column: SavedContentColumn,
      contentId: string,
      ownerId: string,
    ) => {
      const { data, error } = await supabase
        .from("saved_content")
        .select("id")
        .eq(column, contentId)
        .eq("user_id", ownerId)
        .maybeSingle();

      return {
        data: data?.id ? { id: String(data.id) } : null,
        error: error ? { code: error.code, message: error.message } : null,
      };
    },
    deleteOwnSavedContent: async (
      column: SavedContentColumn,
      contentId: string,
      ownerId: string,
    ) => {
      const { error } = await supabase
        .from("saved_content")
        .delete()
        .eq(column, contentId)
        .eq("user_id", ownerId);

      return {
        error: error ? { code: error.code, message: error.message } : null,
      };
    },
    listOwnSavedContent: async (ownerId: string) => {
      const { data, error } = await supabase
        .from("saved_content")
        .select(
          "id, created_at, article_id, tutorial_id, lab_id, articles(title, slug), tutorials(title, slug), labs(title, slug)",
        )
        .eq("user_id", ownerId)
        .order("created_at", { ascending: false });

      return {
        data: Array.isArray(data)
          ? data.map((row) => mapSavedContentRow(row as Record<string, unknown>))
          : [],
        error: error ? { code: error.code, message: error.message } : null,
      };
    },
  };
}

async function createAuthenticatedBookmarkStore(): Promise<
  | { ok: true; store: BookmarkStore }
  | { ok: false; error: "unauthenticated" | "unavailable" }
> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "unavailable" };
  }

  const auth = await getLearnerServerClient();
  if (!auth.ok) {
    return { ok: false, error: "unauthenticated" };
  }

  return {
    ok: true,
    store: createSessionStore(auth.supabase, auth.user.id),
  };
}

export async function saveBookmarkedContent(
  input: unknown,
): Promise<BookmarkOpResult<{ saved: true }>> {
  const store = await createAuthenticatedBookmarkStore();
  if (!store.ok) {
    return { ok: false, error: store.error };
  }
  return saveBookmarkedContentWithStore(store.store, input);
}

export async function removeBookmarkedContent(
  input: unknown,
): Promise<BookmarkOpResult<{ saved: false }>> {
  const store = await createAuthenticatedBookmarkStore();
  if (!store.ok) {
    return { ok: false, error: store.error };
  }
  return removeBookmarkedContentWithStore(store.store, input);
}

export async function isContentSaved(
  input: unknown,
): Promise<BookmarkOpResult<{ saved: boolean }>> {
  const store = await createAuthenticatedBookmarkStore();
  if (!store.ok) {
    return { ok: false, error: store.error };
  }
  return isContentSavedWithStore(store.store, input);
}

export async function listSavedContent(): Promise<
  BookmarkOpResult<SavedContentItem[]>
> {
  const store = await createAuthenticatedBookmarkStore();
  if (!store.ok) {
    return { ok: false, error: store.error };
  }
  return listSavedContentWithStore(store.store);
}

export async function getBookmarkUiState(
  input: unknown,
): Promise<BookmarkUiState> {
  if (!hasSupabaseEnv()) {
    return { authenticated: false, saved: false };
  }

  const auth = await getLearnerServerClient();
  if (!auth.ok) {
    return { authenticated: false, saved: false };
  }

  return getBookmarkUiStateWithStore(
    createSessionStore(auth.supabase, auth.user.id),
    input,
  );
}
