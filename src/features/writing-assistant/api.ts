import { writingRequestSchema } from "./schema";
import { finalizeWritingResponse } from "./workflow";
import type { WritingRequest } from "./types";

export async function requestWritingTurn(input: WritingRequest, signal: AbortSignal) {
  const parsed = writingRequestSchema.safeParse(input);
  if (!parsed.success)
    throw new Error("작성 내용이 너무 길거나 형식이 맞지 않아요. 메모와 폼 입력을 확인해 주세요.");
  const request = parsed.data;
  const response = await fetch("/api/writing-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("로그인 후 작성 도우미를 이용해 주세요.");
    throw new Error("초안을 만들지 못했어요. 입력은 보존되어 있으니 다시 시도해 주세요.");
  }
  return finalizeWritingResponse(request, await response.json());
}
