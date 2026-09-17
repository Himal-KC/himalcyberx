"use server";

import {
  getBookmarkUiState,
  isContentSaved,
  listSavedContent,
  removeBookmarkedContent,
  saveBookmarkedContent,
} from "@/lib/bookmarks/operations";
import type {
  BookmarkOpResult,
  BookmarkUiState,
  SavedContentItem,
} from "@/lib/bookmarks/types";

export async function saveBookmarkAction(
  input: unknown,
): Promise<BookmarkOpResult<{ saved: true }>> {
  return saveBookmarkedContent(input);
}

export async function removeBookmarkAction(
  input: unknown,
): Promise<BookmarkOpResult<{ saved: false }>> {
  return removeBookmarkedContent(input);
}

export async function isContentSavedAction(
  input: unknown,
): Promise<BookmarkOpResult<{ saved: boolean }>> {
  return isContentSaved(input);
}

export async function listSavedContentAction(): Promise<
  BookmarkOpResult<SavedContentItem[]>
> {
  return listSavedContent();
}

export async function getBookmarkUiStateAction(
  input: unknown,
): Promise<BookmarkUiState> {
  return getBookmarkUiState(input);
}
