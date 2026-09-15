import { zodTextFormat } from "openai/helpers/zod";
import {
  OPENAI_REVIEW_FORMAT_NAME,
  parseSolReviewOutput,
  solReviewOutputSchema,
} from "./schemas";

export function createOpenAiReviewTextFormat() {
  return zodTextFormat(solReviewOutputSchema, OPENAI_REVIEW_FORMAT_NAME);
}

export { parseSolReviewOutput };
