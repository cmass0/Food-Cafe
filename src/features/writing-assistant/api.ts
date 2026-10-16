import { WRITING_LIMIT_MESSAGES } from "./limits";
import { writingRequestSchema } from "./schema";
import { finalizeWritingResponse } from "./workflow";
import type { WritingRequest } from "./types";

export type WritingUsage = { remaining: number; limit: number };

// 오늘 시작 횟수를 다 써서 서버가 거절한 경우. 화면은 "오늘은 더 이상 사용할 수 없습니다" 창을 띄운다.
export class WritingDailyLimitError extends Error {
  constructor() {
    super(WRITING_LIMIT_MESSAGES.daily);
    this.name = "WritingDailyLimitError";
  }
}

const LOGIN_REQUIRED = "로그인 후 작성 도우미를 이용해 주세요.";

export async function fetchWritingUsage(): Promise<WritingUsage> {
  const response = await fetch("/api/writing-assistant/session", { cache: "no-store" });
  if (!response.ok) throw new Error("작성 도우미 남은 횟수를 불러오지 못했어요.");
  return response.json();
}

// "작성 도우미 시작하기": 오늘 사용 1번을 쓰고 대화 ID를 받는다.
export async function startWritingSession(): Promise<WritingUsage & { sessionId: string }> {
  const response = await fetch("/api/writing-assistant/session", { method: "POST" });
  if (response.status === 429) throw new WritingDailyLimitError();
  if (response.status === 401) throw new Error(LOGIN_REQUIRED);
  if (!response.ok) throw new Error("작성 도우미를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
  return response.json();
}

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
    if (response.status === 401) throw new Error(LOGIN_REQUIRED);
    if (response.status === 429) throw new Error(WRITING_LIMIT_MESSAGES.session);
    throw new Error("초안을 만들지 못했어요. 입력은 보존되어 있으니 다시 시도해 주세요.");
  }
  return finalizeWritingResponse(request, await response.json());
}
