import sharp from "sharp";
import {
  ALLOWED_ARTICLE_IMAGE_TYPES,
  MAX_ARTICLE_IMAGE_SIZE_BYTES,
} from "@/lib/storage/article-images";
import {
  calculateCenterCropRegion,
  validateFeaturedImageMetadata,
  validateSourceImageLandscape,
} from "./image-core";
import {
  FEATURED_IMAGE_HEIGHT,
  FEATURED_IMAGE_WIDTH,
  type ImageErrorCode,
  type ProcessedFeaturedImage,
} from "./image-core";

export async function processFeaturedImageBuffer(
  inputBuffer: Buffer,
): Promise<
  | { ok: true; image: ProcessedFeaturedImage }
  | { ok: false; errorCode: ImageErrorCode; message: string }
> {
  try {
    const metadata = await sharp(inputBuffer).metadata();
    if (!metadata.width || !metadata.height) {
      return {
        ok: false,
        errorCode: "IMAGE_PROCESSING_ERROR",
        message: "Unable to read generated image dimensions.",
      };
    }

    const landscape = validateSourceImageLandscape({
      width: metadata.width,
      height: metadata.height,
    });
    if (!landscape.valid) {
      return {
        ok: false,
        errorCode: landscape.errorCode,
        message: landscape.message,
      };
    }

    if (inputBuffer.length === 0) {
      return {
        ok: false,
        errorCode: "IMAGE_PROCESSING_ERROR",
        message: "Generated image buffer is empty.",
      };
    }

    const crop = calculateCenterCropRegion(metadata.width, metadata.height);
    const processed = await sharp(inputBuffer)
      .extract(crop)
      .resize(FEATURED_IMAGE_WIDTH, FEATURED_IMAGE_HEIGHT, {
        fit: "fill",
        withoutEnlargement: false,
      })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });

    const validation = validateFeaturedImageMetadata({
      width: processed.info.width,
      height: processed.info.height,
      mimeType: "image/webp",
      byteSize: processed.data.length,
      maxBytes: MAX_ARTICLE_IMAGE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_ARTICLE_IMAGE_TYPES,
    });

    if (!validation.valid) {
      return {
        ok: false,
        errorCode: validation.errorCode,
        message: validation.message,
      };
    }

    return {
      ok: true,
      image: {
        buffer: processed.data,
        width: processed.info.width,
        height: processed.info.height,
        mimeType: "image/webp",
        byteSize: processed.data.length,
      },
    };
  } catch {
    return {
      ok: false,
      errorCode: "IMAGE_PROCESSING_ERROR",
      message: "Unable to process generated image.",
    };
  }
}
