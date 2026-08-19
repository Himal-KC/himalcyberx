"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  deleteArticleImage,
  extractArticleImageStoragePath,
  formatArticleImageFileSize,
  uploadArticleImage,
  uploadLabImage,
  uploadTutorialImage,
  validateArticleImageFile,
} from "@/lib/storage/article-images";
import { focusRing } from "@/lib/page-data";

const labelClass = "block text-sm font-medium text-hcx-text";
const inputClass =
  "mt-2 w-full rounded-lg border border-hcx-border bg-hcx-bg px-4 py-3 text-sm text-hcx-text placeholder:text-hcx-text-secondary/60 transition-colors focus:border-hcx-cyan/50 focus:outline-none focus:ring-2 focus:ring-hcx-cyan/20 disabled:cursor-not-allowed disabled:opacity-60";
const errorClass = "mt-1.5 text-sm text-hcx-red";

type UploadStatus = "idle" | "uploading" | "ready" | "error";

interface FeaturedImageUploaderProps {
  disabled?: boolean;
  defaultUrl?: string | null;
  defaultAltText?: string | null;
  fieldError?: string;
  articleTitle?: string;
  storageFolder?: "articles" | "labs" | "tutorials";
  enableAltText?: boolean;
  onImageUrlChange?: (url: string) => void;
  onAltTextChange?: (alt: string) => void;
}

export function FeaturedImageUploader({
  disabled = false,
  defaultUrl = null,
  defaultAltText = "",
  fieldError,
  articleTitle = "Article featured image",
  storageFolder = "articles",
  enableAltText = false,
  onImageUrlChange,
  onAltTextChange,
}: FeaturedImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [featured_image, setFeaturedImage] = useState(defaultUrl ?? "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(defaultAltText ?? "");
  const [storagePath, setStoragePath] = useState<string | null>(() =>
    defaultUrl ? extractArticleImageStoragePath(defaultUrl) : null,
  );
  const [filename, setFilename] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(
    defaultUrl ? "ready" : "idle",
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isUploading = uploadStatus === "uploading";
  const hasImage = Boolean(featured_image);
  const displayError = localError ?? fieldError ?? null;
  const previewAlt = featuredImageAlt.trim() || articleTitle;

  useEffect(() => {
    onImageUrlChange?.(featured_image.startsWith("blob:") ? "" : featured_image);
  }, [featured_image, onImageUrlChange]);

  useEffect(() => {
    onAltTextChange?.(featuredImageAlt);
  }, [featuredImageAlt, onAltTextChange]);

  useEffect(() => {
    return () => {
      if (featured_image.startsWith("blob:")) {
        URL.revokeObjectURL(featured_image);
      }
    };
  }, [featured_image]);

  async function handleFile(file: File) {
    setLocalError(null);

    const validation = validateArticleImageFile(file);
    if (!validation.valid) {
      setUploadStatus("error");
      setLocalError(validation.error ?? "Invalid image file.");
      return;
    }

    const previousPath = storagePath;
    setUploadStatus("uploading");
    setFilename(file.name);
    setFileSize(file.size);

    const previewUrl = URL.createObjectURL(file);
    setFeaturedImage(previewUrl);

    const supabase = createClient();
    const upload =
      storageFolder === "labs"
        ? uploadLabImage
        : storageFolder === "tutorials"
          ? uploadTutorialImage
          : uploadArticleImage;
    const { data, error } = await upload(supabase, file);

    if (error || !data) {
      setUploadStatus("error");
      setLocalError(error ?? "Unable to upload image. Please try again.");
      setFeaturedImage(defaultUrl ?? "");
      setFilename(null);
      setFileSize(null);
      URL.revokeObjectURL(previewUrl);
      return;
    }

    if (previousPath && previousPath !== data.storagePath) {
      await deleteArticleImage(supabase, previousPath);
    }

    URL.revokeObjectURL(previewUrl);
    setFeaturedImage(data.publicUrl);
    setStoragePath(data.storagePath);
    setFilename(data.filename);
    setFileSize(data.fileSize);
    setUploadStatus("ready");
    onImageUrlChange?.(data.publicUrl);
  }

  async function handleRemoveImage() {
    if (storagePath) {
      const supabase = createClient();
      await deleteArticleImage(supabase, storagePath);
    }

    setFeaturedImage("");
    setStoragePath(null);
    setFilename(null);
    setFileSize(null);
    setUploadStatus("idle");
    setLocalError(null);
    onImageUrlChange?.("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) {
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  }

  return (
    <div>
      <p id={`${inputId}-label`} className={labelClass}>
        Featured Image
      </p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="sr-only"
        aria-labelledby={`${inputId}-label`}
        aria-describedby={displayError ? `${inputId}-error` : undefined}
      />

      <input
        type="hidden"
        name="featured_image"
        value={featured_image.startsWith("blob:") ? "" : featured_image}
      />

      {enableAltText ? (
        <input type="hidden" name="featured_image_alt" value={featuredImageAlt} />
      ) : null}

      {!hasImage && (
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled && !isUploading) {
              setIsDragging(true);
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled && !isUploading) {
              setIsDragging(true);
            }
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`mt-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors ${
            isDragging
              ? "border-hcx-cyan/50 bg-hcx-cyan/5"
              : "border-hcx-border bg-hcx-bg/50"
          } ${disabled || isUploading ? "opacity-60" : ""}`}
        >
          <p className="text-sm text-hcx-text-secondary">
            Drag and drop an image here, or
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isUploading}
            className={`mt-3 inline-flex rounded-lg border border-hcx-border bg-hcx-card px-4 py-2 text-sm font-medium text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
          >
            {isUploading ? "Uploading image..." : "Upload Image"}
          </button>
          <p className="mt-3 text-xs text-hcx-text-secondary">
            JPEG, PNG or WebP · Max 5 MB
          </p>
        </div>
      )}

      {hasImage && (
        <div className="mt-2 overflow-hidden rounded-lg border border-hcx-border bg-hcx-bg/50">
          <div className="relative aspect-[16/9] w-full bg-hcx-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured_image}
              alt={previewAlt}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-3 border-t border-hcx-border p-4">
            {filename ? (
              <div className="text-sm text-hcx-text-secondary">
                <p className="truncate font-medium text-hcx-text">{filename}</p>
                {fileSize !== null && (
                  <p className="mt-1">{formatArticleImageFileSize(fileSize)}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-hcx-text-secondary">Existing image</p>
            )}

            {uploadStatus === "uploading" && (
              <p className="text-sm text-hcx-cyan">Uploading image...</p>
            )}

            {uploadStatus === "ready" && (
              <p className="text-sm text-hcx-green">Image ready</p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || isUploading}
                className={`rounded-lg border border-hcx-border px-3 py-1.5 text-sm font-medium text-hcx-text transition-colors hover:border-hcx-cyan/30 hover:text-hcx-cyan disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
              >
                Change Image
              </button>
              <button
                type="button"
                onClick={() => void handleRemoveImage()}
                disabled={disabled || isUploading}
                className={`rounded-lg border border-hcx-border px-3 py-1.5 text-sm font-medium text-hcx-red transition-colors hover:border-hcx-red/30 hover:bg-hcx-red/5 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
              >
                Remove Image
              </button>
            </div>
          </div>
        </div>
      )}

      {enableAltText ? (
        <div className="mt-4">
          <label htmlFor={`${inputId}-alt`} className={labelClass}>
            Image Alt Text
          </label>
          <input
            id={`${inputId}-alt`}
            type="text"
            value={featuredImageAlt}
            onChange={(event) => setFeaturedImageAlt(event.target.value)}
            disabled={disabled}
            placeholder="Describe the image for accessibility"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-hcx-text-secondary">
            Falls back to the article title when left blank.
          </p>
        </div>
      ) : null}

      {displayError && (
        <p id={`${inputId}-error`} className={errorClass} role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
