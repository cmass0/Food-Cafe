import {
  AuthErrorHelper,
  json,
  respondWithError,
  respondWithServerQueryError,
} from "@/lib/errors/api-response";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { MAX_DAILY_SESSIONS, WRITING_LIMIT_MESSAGES } from "@/features/writing-assistant/limits";
import { countRemainingSessions, startWritingSession } from "@/features/writing-assistant/usage";

async function requireUserId(): Promise<
  { ok: false; response: Response } | { ok: true; userId: string }
> {
  const auth = await AuthErrorHelper();
  if (auth.error) return { ok: false, response: auth.error };
  return { ok: true, userId: auth.user.id };
}

// 오늘 남은 작성 도우미 시작 횟수. 시작 버튼 옆에 보여준다.
export async function GET() {
  let userId: string;
  try {
    const auth = await requireUserId();
    if (!auth.ok) return auth.response;
    userId = auth.userId;
  } catch (error) {
    return respondWithError(error, "작성 도우미 로그인 확인 실패");
  }
  try {
    const remaining = await countRemainingSessions(getAdminSupabase(), userId);
    return json({ remaining, limit: MAX_DAILY_SESSIONS });
  } catch (error) {
    return respondWithServerQueryError(error, "작성 도우미 남은 횟수 조회 실패");
  }
}

// "작성 도우미 시작하기": 오늘 시작 횟수가 남았으면 새 대화를 만든다. 이 요청이 하루 사용 1번이다.
export async function POST() {
  let userId: string;
  try {
    const auth = await requireUserId();
    if (!auth.ok) return auth.response;
    userId = auth.userId;
  } catch (error) {
    return respondWithError(error, "작성 도우미 로그인 확인 실패");
  }
  try {
    const admin = getAdminSupabase();
    const sessionId = await startWritingSession(admin, userId);
    if (!sessionId) {
      return json(
        { error: "WRITING_DAILY_LIMIT", message: WRITING_LIMIT_MESSAGES.daily, remaining: 0 },
        429
      );
    }
    const remaining = await countRemainingSessions(admin, userId);
    return json({ sessionId, remaining, limit: MAX_DAILY_SESSIONS });
  } catch (error) {
    return respondWithServerQueryError(error, "작성 도우미 시작 실패");
  }
}
