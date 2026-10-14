import {
  AuthErrorHelper,
  badRequest,
  internalError,
  json,
  respondWithError,
} from "@/lib/errors/api-response";
import { getRecommendLanguageModel } from "@/lib/ai/model";
import { getServerSupabase } from "@/lib/supabase/server";
import { writingRequestSchema } from "@/features/writing-assistant/schema";
import { generateWritingTurn } from "@/features/writing-assistant/service";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // 작성 화면과 동일하게 로그인 사용자만 이용한다. 모델은 DB 쓰기 도구나 관리자 권한을 받지 않는다.
    const auth = await AuthErrorHelper();
    if (auth.error) return auth.error;
  } catch (error) {
    return respondWithError(error, "작성 도우미 로그인 확인 실패");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("잘못된 JSON 형식입니다.");
  }
  const parsed = writingRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest("작성 도우미 입력 형식을 확인해 주세요.");
  try {
    const result = await generateWritingTurn(parsed.data, {
      model: getRecommendLanguageModel(),
      signal: request.signal,
      client: await getServerSupabase(),
    });
    return json(result);
  } catch (error) {
    // respondWithError는 오류 객체를 통째로 기록한다. SDK 오류에는 메모·폼 내용이 담긴 프롬프트와 모델 원문이
    // 들어 있을 수 있어 여기서는 이름만 남긴다. 모델 응답 검증 실패(ZodError)도 사용자 입력 문제가 아니므로 500이다.
    console.error("작성 도우미 생성 실패", error instanceof Error ? error.name : "UnknownError");
    return internalError("초안을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}
