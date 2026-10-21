// 한국 날짜 하루에 AI 추천에 보낼 수 있는 질문 수. 비로그인은 IP로 세므로 같은 와이파이 사용자끼리 나눠 쓴다.
export const MAX_DAILY_CALLS_SIGNED_IN = 20;
export const MAX_DAILY_CALLS_ANONYMOUS = 10;

// 질문 하나의 글자 수. 입력창에서 막는다.
export const MAX_RECOMMEND_MESSAGE_LENGTH = 500;
// 브라우저가 매번 보내는 대화 기록 전체의 글자 수. 기록을 부풀려 AI 비용을 키우는 요청을 막는다.
export const MAX_RECOMMEND_REQUEST_LENGTH = 100_000;

export const RECOMMEND_LIMIT_ERRORS = {
  daily: "RECOMMEND_DAILY_LIMIT",
  conversation: "RECOMMEND_CONVERSATION_TOO_LONG",
} as const;

export const RECOMMEND_LIMIT_MESSAGES = {
  dailySignedIn: `AI 추천은 하루 ${MAX_DAILY_CALLS_SIGNED_IN}번까지 쓸 수 있어요. 내일 다시 이용해 주세요.`,
  dailyAnonymous: `로그인하지 않으면 AI 추천은 하루 ${MAX_DAILY_CALLS_ANONYMOUS}번까지 쓸 수 있어요. 로그인하면 ${MAX_DAILY_CALLS_SIGNED_IN}번까지 쓸 수 있어요.`,
  conversation: "대화가 너무 길어졌어요. 위의 '새 대화'로 다시 시작해 주세요.",
} as const;

// useChat 오류의 message에는 서버 응답 본문이 그대로 들어온다. 상한 응답이면 안내 문구를 꺼낸다.
export function readRecommendLimitMessage(error: Error | undefined): string | null {
  if (!error) return null;
  try {
    const body = JSON.parse(error.message) as { error?: unknown; message?: unknown };
    const codes: readonly unknown[] = Object.values(RECOMMEND_LIMIT_ERRORS);
    return codes.includes(body.error) && typeof body.message === "string" ? body.message : null;
  } catch {
    return null;
  }
}
