import type { z } from "zod";
import type { LanguageModel } from "ai";
import type {
  recipeDraftSchema,
  comboDraftSchema,
  writingRequestSchema,
  writingResponseSchema,
} from "./schema";

export type WritingRequest = z.infer<typeof writingRequestSchema>;
export type WritingResponse = z.infer<typeof writingResponseSchema>;
export type RecipeWritingDraft = z.infer<typeof recipeDraftSchema>;
export type ComboWritingDraft = z.infer<typeof comboDraftSchema>;
export type WritingAssistantKind = WritingRequest["kind"];
export type WritingModelOptions = { model: LanguageModel; signal?: AbortSignal };
export type WritingFormBinding = {
  snapshot: () => Pick<WritingRequest, "formContext" | "recipeReferences">;
  // false면 폼이 저장 중이거나 다른 종류여서 적용하지 않은 것이다.
  apply: (response: WritingResponse) => boolean;
};
export type WritingSession = {
  request: WritingRequest;
  response: WritingResponse | null;
};
