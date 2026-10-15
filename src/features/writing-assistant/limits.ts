import { MAX_WRITING_QUESTIONS } from "./schema";

// 한 사용자가 한국 날짜 하루에 작성 도우미를 시작할 수 있는 횟수(레시피·조합 합산).
export const MAX_DAILY_SESSIONS = 2;
// 대화 하나에서 AI를 부를 수 있는 횟수. 시작 1번 + 질문 답변 + "여기까지 초안 보기"·재시도·다시 시작 여유 2번.
export const MAX_CALLS_PER_SESSION = 1 + MAX_WRITING_QUESTIONS + 2;

export const WRITING_LIMIT_MESSAGES = {
  dailyTitle: "오늘은 더 이상 사용할 수 없습니다.",
  daily: `작성 도우미는 하루 ${MAX_DAILY_SESSIONS}번까지 쓸 수 있어요. 내일 다시 사용해 주세요.`,
  session:
    "이번 대화에서 쓸 수 있는 요청을 모두 썼어요. 지금까지 정리한 내용으로 직접 작성해 주세요.",
} as const;
