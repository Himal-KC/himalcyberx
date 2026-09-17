"use server";

import {
  getContinueLearningItems as getContinueLearningItemsOp,
  getLearningProgress as getLearningProgressOp,
  getLearningProgressUiState as getLearningProgressUiStateOp,
  markLearningCompleted as markLearningCompletedOp,
  startLearning as startLearningOp,
  updateLearningProgress as updateLearningProgressOp,
} from "@/lib/learning/operations";
import type {
  ContinueLearningItem,
  LearningProgressOpResult,
  LearningProgressUiState,
  LearningProgressView,
} from "@/lib/learning/types";

export async function startLearning(
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  return startLearningOp(input);
}

export async function updateLearningProgress(
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  return updateLearningProgressOp(input);
}

export async function markLearningCompleted(
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  return markLearningCompletedOp(input);
}

export async function getLearningProgress(
  input: unknown,
): Promise<LearningProgressOpResult<LearningProgressView>> {
  return getLearningProgressOp(input);
}

export async function getContinueLearningItems(
  limit?: unknown,
): Promise<LearningProgressOpResult<ContinueLearningItem[]>> {
  return getContinueLearningItemsOp(limit);
}

export async function getLearningProgressUiState(
  input: unknown,
): Promise<LearningProgressUiState> {
  return getLearningProgressUiStateOp(input);
}
