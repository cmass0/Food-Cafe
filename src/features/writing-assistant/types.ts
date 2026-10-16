import type { z } from "zod";
import type { LanguageModel } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
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
export type WritingModelOptions = {
  model: LanguageModel;
  signal?: AbortSignal;
  // 고른 레시피를 요청자 권한(RLS)으로 다시 읽는 클라이언트
  client: SupabaseClient<Database>;
};
export type WritingFormBinding = {
  snapshot: () => Pick<WritingRequest, "formContext" | "recipeIds">;
  // false면 폼이 저장 중이거나 다른 종류여서 적용하지 않은 것이다.
  apply: (response: WritingResponse) => boolean;
  // 반영하면 폼에 다시 들어가는 항목 이름. 반영 확인창에 보여준다.
  changesOnApply?: (response: WritingResponse) => WritingApplyChanges;
};
export type WritingApplyChanges = { restored: string[] };
export type WritingSession = {
  request: WritingRequest;
  response: WritingResponse | null;
};
