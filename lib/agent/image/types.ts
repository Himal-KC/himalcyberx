import type { AgentContentType } from "@/lib/supabase/types";

export {
  FEATURED_IMAGE_ASPECT_RATIO,
  FEATURED_IMAGE_HEIGHT,
  FEATURED_IMAGE_WIDTH,
  type ImageErrorCode,
  type ImagePromptContext,
  type ProcessedFeaturedImage,
} from "./image-core";

export type ImageTraceCheckpoint =
  | "image_start"
  | "image_context_ready"
  | "image_model_start"
  | "image_model_success"
  | "image_processing_start"
  | "image_processing_success"
  | "image_validation_success"
  | "image_upload_start"
  | "image_upload_success"
  | "image_attach_start"
  | "image_attach_success"
  | "image_complete";

export interface GeneratedFeaturedImageResult {
  agentRunId: string;
  contentType: AgentContentType;
  contentId: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
  storagePath: string;
  width: number;
  height: number;
  mimeType: string;
  byteSize: number;
  model: string;
  regenerated: boolean;
  editUrl: string;
  previewUrl: string | null;
}
