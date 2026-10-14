import { MAX_WRITING_QUESTIONS, writingResponseSchema } from "./schema";
import type { WritingRequest, WritingResponse } from "./types";

export function finalizeWritingResponse(request: WritingRequest, value: unknown): WritingResponse {
  const response = writingResponseSchema.parse(value);
  if (response.kind !== request.kind) throw new Error("초안 종류가 일치하지 않습니다.");
  // 질문 상한은 프롬프트에만 맡기지 않는다. 다섯 번째 답변 또는 조기 완료 후에는 질문을 닫는다.
  const finished =
    request.finish || request.turns.length >= MAX_WRITING_QUESTIONS || !response.question;
  if (finished && !response.draft) throw new Error("완성 초안이 없습니다.");
  if (response.kind === "combo" && response.draft) {
    const selected = new Set(request.recipeIds);
    if (
      response.draft.items.some((item) => item.type === "recipe" && !selected.has(item.recipeid))
    ) {
      throw new Error("선택하지 않은 레시피를 참조할 수 없습니다.");
    }
  }
  return { ...response, question: finished ? null : response.question };
}
