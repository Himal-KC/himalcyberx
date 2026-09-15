import "server-only";

import { HCX_REVIEW_MODEL } from "@/lib/agent/openai/config";
import { getOpenAiClient } from "@/lib/agent/openai/client";
import {
  extractSafeOpenAiDiagnostics,
  logOpenAiGenerationFailure,
} from "@/lib/agent/openai/log-generation-error";
import {
  buildReviewRepairUserPrompt,
  REVIEW_REPAIR_SYSTEM_INSTRUCTIONS,
} from "@/lib/agent/review/repair-core";
import {
  buildSolReviewResponseRequest,
} from "@/lib/agent/review/openai-request-core";
import {
  REVIEW_SYSTEM_INSTRUCTIONS,
  buildReviewUserPrompt,
} from "@/lib/agent/review/review-policy";
import {
  createOpenAiReviewTextFormat,
  parseSolReviewOutput,
} from "@/lib/agent/review/schema-selection";
import type { ReviewContextPayload, SolReviewOutput } from "@/lib/agent/review/types";
import { serializeReviewContextForPrompt } from "@/lib/agent/review/build-context-core";
import { logReviewError } from "@/lib/agent/review/review-log";

export interface ReviewWithOpenAiResult {
  review: SolReviewOutput | null;
  model: string;
  error: string | null;
}

export async function reviewDraftWithOpenAi(
  context: ReviewContextPayload,
): Promise<ReviewWithOpenAiResult> {
  try {
    const client = getOpenAiClient();
    const textFormat = createOpenAiReviewTextFormat();
    const request = buildSolReviewResponseRequest({
      model: HCX_REVIEW_MODEL,
      instructions: REVIEW_SYSTEM_INSTRUCTIONS,
      userPromptText: buildReviewUserPrompt(
        serializeReviewContextForPrompt(context),
      ),
      textFormat,
    });
    const response = await client.responses.parse(request);
    const review = parseSolReviewOutput(response.output_parsed ?? null);

    if (!review) {
      logReviewError({
        checkpoint: "validation_start",
        agentRunId: context.agentRunId,
        contentType: context.contentType,
        model: response.model ?? HCX_REVIEW_MODEL,
        errorMessage: "Review output failed validation.",
      });

      return {
        review: null,
        model: response.model ?? HCX_REVIEW_MODEL,
        error: "Review output failed validation.",
      };
    }

    if (review.contentType !== context.contentType) {
      return {
        review: null,
        model: response.model ?? HCX_REVIEW_MODEL,
        error: "Review output did not match the requested content type.",
      };
    }

    return {
      review,
      model: response.model ?? HCX_REVIEW_MODEL,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "OPENAI_NOT_CONFIGURED") {
      return {
        review: null,
        model: HCX_REVIEW_MODEL,
        error: "OpenAI is not configured.",
      };
    }

    const diagnostics = extractSafeOpenAiDiagnostics(error, {
      stage: "responses_parse",
      model: HCX_REVIEW_MODEL,
      contentType: context.contentType,
    });
    logOpenAiGenerationFailure(diagnostics);
    logReviewError({
      checkpoint: "openai_start",
      agentRunId: context.agentRunId,
      contentType: context.contentType,
      model: HCX_REVIEW_MODEL,
      errorName: diagnostics.errorName,
      statusCode: diagnostics.statusCode,
      openAiCode: diagnostics.openAiCode,
      openAiType: diagnostics.errorType,
      requestId: diagnostics.requestId,
      errorMessage: diagnostics.message,
    });

    return {
      review: null,
      model: HCX_REVIEW_MODEL,
      error: "Review is temporarily unavailable.",
    };
  }
}

export async function repairSolReviewWithOpenAi(input: {
  context: ReviewContextPayload;
  originalReview: SolReviewOutput;
  validationErrors: string[];
  allowedEvidenceIds: string[];
}): Promise<ReviewWithOpenAiResult> {
  try {
    const client = getOpenAiClient();
    const textFormat = createOpenAiReviewTextFormat();
    const request = buildSolReviewResponseRequest({
      model: HCX_REVIEW_MODEL,
      instructions: REVIEW_REPAIR_SYSTEM_INSTRUCTIONS,
      userPromptText: buildReviewRepairUserPrompt({
        originalReview: input.originalReview,
        validationErrors: input.validationErrors,
        allowedEvidenceIds: input.allowedEvidenceIds,
      }),
      textFormat,
    });
    const response = await client.responses.parse(request);
    const review = parseSolReviewOutput(response.output_parsed ?? null);

    if (!review) {
      logReviewError({
        checkpoint: "repair_validation_start",
        agentRunId: input.context.agentRunId,
        contentType: input.context.contentType,
        model: response.model ?? HCX_REVIEW_MODEL,
        errorMessage: "Repaired review output failed validation.",
      });

      return {
        review: null,
        model: response.model ?? HCX_REVIEW_MODEL,
        error: "Review output failed validation.",
      };
    }

    if (review.contentType !== input.context.contentType) {
      return {
        review: null,
        model: response.model ?? HCX_REVIEW_MODEL,
        error: "Review output did not match the requested content type.",
      };
    }

    return {
      review,
      model: response.model ?? HCX_REVIEW_MODEL,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "OPENAI_NOT_CONFIGURED") {
      return {
        review: null,
        model: HCX_REVIEW_MODEL,
        error: "OpenAI is not configured.",
      };
    }

    const diagnostics = extractSafeOpenAiDiagnostics(error, {
      stage: "responses_parse",
      model: HCX_REVIEW_MODEL,
      contentType: input.context.contentType,
    });
    logOpenAiGenerationFailure(diagnostics);
    logReviewError({
      checkpoint: "repair_start",
      agentRunId: input.context.agentRunId,
      contentType: input.context.contentType,
      model: HCX_REVIEW_MODEL,
      errorName: diagnostics.errorName,
      statusCode: diagnostics.statusCode,
      openAiCode: diagnostics.openAiCode,
      openAiType: diagnostics.errorType,
      requestId: diagnostics.requestId,
      errorMessage: diagnostics.message,
    });

    return {
      review: null,
      model: HCX_REVIEW_MODEL,
      error: "Review is temporarily unavailable.",
    };
  }
}
