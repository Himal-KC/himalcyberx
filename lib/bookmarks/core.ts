import type {
  BookmarkContentType,
  BookmarkOpError,
  BookmarkOpResult,
  BookmarkStore,
  BookmarkTarget,
  BookmarkUiState,
  ContentTable,
  SavedContentColumn,
  SavedContentInsertPayload,
  SavedContentItem,
  SavedContentRow,
} from "./types";

export const BOOKMARK_CONTENT_TYPES: readonly BookmarkContentType[] = [
  "article",
  "tutorial",
  "lab",
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isBookmarkContentType(
  value: unknown,
): value is BookmarkContentType {
  return (
    typeof value === "string" &&
    (BOOKMARK_CONTENT_TYPES as readonly string[]).includes(value)
  );
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Accepts only contentType + contentId. Extra fields such as user_id are ignored.
 */
export function parseBookmarkTarget(input: unknown): BookmarkTarget | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  if (!isBookmarkContentType(record.contentType) || !isUuid(record.contentId)) {
    return null;
  }

  return {
    contentType: record.contentType,
    contentId: record.contentId,
  };
}

export function contentColumnForType(
  contentType: BookmarkContentType,
): SavedContentColumn {
  if (contentType === "article") {
    return "article_id";
  }
  if (contentType === "tutorial") {
    return "tutorial_id";
  }
  return "lab_id";
}

export function contentTableForType(
  contentType: BookmarkContentType,
): ContentTable {
  if (contentType === "article") {
    return "articles";
  }
  if (contentType === "tutorial") {
    return "tutorials";
  }
  return "labs";
}

export function buildSavedContentInsert(
  target: BookmarkTarget,
): SavedContentInsertPayload {
  return {
    article_id: target.contentType === "article" ? target.contentId : null,
    tutorial_id: target.contentType === "tutorial" ? target.contentId : null,
    lab_id: target.contentType === "lab" ? target.contentId : null,
  };
}

export function bookmarkContentHref(
  contentType: BookmarkContentType,
  slug: string,
): string {
  if (contentType === "article") {
    return `/articles/${slug}`;
  }
  if (contentType === "tutorial") {
    return `/tutorials/${slug}`;
  }
  return `/cyber-lab/${slug}`;
}

export function resolveBookmarkFromRow(
  row: SavedContentRow,
): SavedContentItem | null {
  const exclusiveCount =
    Number(row.article_id != null) +
    Number(row.tutorial_id != null) +
    Number(row.lab_id != null);

  if (exclusiveCount !== 1) {
    return null;
  }

  if (row.article_id) {
    const slug = row.articles?.slug?.trim() || null;
    return {
      id: row.id,
      createdAt: row.created_at,
      contentType: "article",
      contentId: row.article_id,
      title: row.articles?.title?.trim() || null,
      slug,
      href: slug ? bookmarkContentHref("article", slug) : null,
    };
  }

  if (row.tutorial_id) {
    const slug = row.tutorials?.slug?.trim() || null;
    return {
      id: row.id,
      createdAt: row.created_at,
      contentType: "tutorial",
      contentId: row.tutorial_id,
      title: row.tutorials?.title?.trim() || null,
      slug,
      href: slug ? bookmarkContentHref("tutorial", slug) : null,
    };
  }

  if (row.lab_id) {
    const slug = row.labs?.slug?.trim() || null;
    return {
      id: row.id,
      createdAt: row.created_at,
      contentType: "lab",
      contentId: row.lab_id,
      title: row.labs?.title?.trim() || null,
      slug,
      href: slug ? bookmarkContentHref("lab", slug) : null,
    };
  }

  return null;
}

export function isUniqueViolation(error: {
  code?: string;
  message?: string;
}): boolean {
  return error.code === "23505";
}

export function isForeignKeyViolation(error: {
  code?: string;
  message?: string;
}): boolean {
  return error.code === "23503";
}

export function isCheckOrPublishedViolation(error: {
  code?: string;
  message?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "23514" ||
    message.includes("saved_content_unpublished_or_missing") ||
    message.includes("saved_content_one_target")
  );
}

export function isRlsDenied(error: { code?: string; message?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied")
  );
}

export function mapWriteError(error: {
  code?: string;
  message?: string;
}): BookmarkOpError {
  if (isUniqueViolation(error)) {
    return "invalid_target";
  }
  if (isForeignKeyViolation(error) || isCheckOrPublishedViolation(error)) {
    return "invalid_content";
  }
  if (isRlsDenied(error)) {
    return "forbidden";
  }
  return "unavailable";
}

export function listInsertPayloadKeys(
  payload: SavedContentInsertPayload,
): string[] {
  return Object.keys(payload);
}

function invalidTarget(): BookmarkOpResult<never> {
  return { ok: false, error: "invalid_target" };
}

function unauthenticated(): BookmarkOpResult<never> {
  return { ok: false, error: "unauthenticated" };
}

export async function saveBookmarkedContent(
  store: BookmarkStore,
  input: unknown,
): Promise<BookmarkOpResult<{ saved: true }>> {
  const target = parseBookmarkTarget(input);
  if (!target) {
    return invalidTarget();
  }

  const user = await store.getSessionUser();
  if (!user) {
    return unauthenticated();
  }

  const published = await store.findPublishedContent(
    contentTableForType(target.contentType),
    target.contentId,
  );
  if (!published.found) {
    return { ok: false, error: "invalid_content" };
  }

  const payload = buildSavedContentInsert(target);
  const { error } = await store.insertSavedContent(payload);

  if (!error || isUniqueViolation(error)) {
    return { ok: true, data: { saved: true } };
  }

  if (isForeignKeyViolation(error) || isCheckOrPublishedViolation(error)) {
    return { ok: false, error: "invalid_content" };
  }

  if (isRlsDenied(error)) {
    return { ok: false, error: "forbidden" };
  }

  return { ok: false, error: "unavailable" };
}

export async function removeBookmarkedContent(
  store: BookmarkStore,
  input: unknown,
): Promise<BookmarkOpResult<{ saved: false }>> {
  const target = parseBookmarkTarget(input);
  if (!target) {
    return invalidTarget();
  }

  const user = await store.getSessionUser();
  if (!user) {
    return unauthenticated();
  }

  const { error } = await store.deleteOwnSavedContent(
    contentColumnForType(target.contentType),
    target.contentId,
    user.id,
  );

  if (!error) {
    return { ok: true, data: { saved: false } };
  }

  if (isRlsDenied(error)) {
    return { ok: false, error: "forbidden" };
  }

  return { ok: false, error: "unavailable" };
}

export async function isContentSaved(
  store: BookmarkStore,
  input: unknown,
): Promise<BookmarkOpResult<{ saved: boolean }>> {
  const target = parseBookmarkTarget(input);
  if (!target) {
    return invalidTarget();
  }

  const user = await store.getSessionUser();
  if (!user) {
    return unauthenticated();
  }

  const { data, error } = await store.findOwnSavedContent(
    contentColumnForType(target.contentType),
    target.contentId,
    user.id,
  );

  if (error) {
    if (isRlsDenied(error)) {
      return { ok: false, error: "forbidden" };
    }
    return { ok: false, error: "unavailable" };
  }

  return { ok: true, data: { saved: Boolean(data?.id) } };
}

export async function listSavedContent(
  store: BookmarkStore,
): Promise<BookmarkOpResult<SavedContentItem[]>> {
  const user = await store.getSessionUser();
  if (!user) {
    return unauthenticated();
  }

  const { data, error } = await store.listOwnSavedContent(user.id);

  if (error) {
    if (isRlsDenied(error)) {
      return { ok: false, error: "forbidden" };
    }
    return { ok: false, error: "unavailable" };
  }

  const items = (data ?? [])
    .map((row) => resolveBookmarkFromRow(row))
    .filter((item): item is SavedContentItem => item !== null);

  return { ok: true, data: items };
}

export async function getBookmarkUiState(
  store: BookmarkStore,
  input: unknown,
): Promise<BookmarkUiState> {
  const user = await store.getSessionUser();
  if (!user) {
    return { authenticated: false, saved: false };
  }

  const saved = await isContentSaved(store, input);
  if (!saved.ok) {
    return { authenticated: true, saved: false };
  }

  return { authenticated: true, saved: saved.data.saved };
}
