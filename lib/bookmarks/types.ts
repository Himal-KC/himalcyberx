export type BookmarkContentType = "article" | "tutorial" | "lab";

export type BookmarkTarget = {
  contentType: BookmarkContentType;
  contentId: string;
};

export type SavedContentColumn = "article_id" | "tutorial_id" | "lab_id";

export type ContentTable = "articles" | "tutorials" | "labs";

export type SavedContentInsertPayload = {
  article_id: string | null;
  tutorial_id: string | null;
  lab_id: string | null;
};

export type SavedContentRow = {
  id: string;
  created_at: string;
  article_id: string | null;
  tutorial_id: string | null;
  lab_id: string | null;
  articles?: { title: string | null; slug: string | null } | null;
  tutorials?: { title: string | null; slug: string | null } | null;
  labs?: { title: string | null; slug: string | null } | null;
};

export type SavedContentItem = {
  id: string;
  createdAt: string;
  contentType: BookmarkContentType;
  contentId: string;
  title: string | null;
  slug: string | null;
  href: string | null;
};

export type BookmarkAuthError = "unauthenticated";

export type BookmarkOpError =
  | BookmarkAuthError
  | "invalid_target"
  | "invalid_content"
  | "forbidden"
  | "unavailable";

export type BookmarkOpResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: BookmarkOpError };

export type BookmarkUiState = {
  authenticated: boolean;
  saved: boolean;
};

export type BookmarkDbError = {
  code?: string;
  message: string;
};

export type BookmarkSessionUser = {
  id: string;
};

export type BookmarkStore = {
  getSessionUser: () => Promise<BookmarkSessionUser | null>;
  findPublishedContent: (
    table: ContentTable,
    id: string,
  ) => Promise<{ found: boolean }>;
  insertSavedContent: (
    payload: SavedContentInsertPayload,
  ) => Promise<{ error: BookmarkDbError | null }>;
  findOwnSavedContent: (
    column: SavedContentColumn,
    contentId: string,
    userId: string,
  ) => Promise<{ data: { id: string } | null; error: BookmarkDbError | null }>;
  deleteOwnSavedContent: (
    column: SavedContentColumn,
    contentId: string,
    userId: string,
  ) => Promise<{ error: BookmarkDbError | null }>;
  listOwnSavedContent: (
    userId: string,
  ) => Promise<{ data: SavedContentRow[] | null; error: BookmarkDbError | null }>;
};
