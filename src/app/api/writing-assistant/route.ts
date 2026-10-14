import { AuthErrorHelper, badRequest, internalError, json } from "@/lib/errors/api-response";
import { getRecommendLanguageModel } from "@/lib/ai/model";
import { writingRequestSchema } from "@/features/writing-assistant/schema";
import { generateWritingTurn } from "@/features/writing-assistant/service";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // 작성 화면과 동일하게 로그인 사용자만 이용한다. 모델은 DB 쓰기 도구나 관리자 권한을 받지 않는다.
    const auth = await AuthErrorHelper();
    if (auth.error) return auth.error;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("잘못된 JSON 형식입니다.");
    }
    const parsed = writingRequestSchema.safeParse(body);
    if (!parsed.success) return badRequest("작성 도우미 입력 형식을 확인해 주세요.");
    const result = await generateWritingTurn(parsed.data, {
      model: getRecommendLanguageModel(),
      signal: request.signal,
    });
    return json(result);
  } catch (error) {
    // SDK 오류 객체에는 원문 프롬프트가 포함될 수 있으므로 이름만 기록한다.
    console.error("작성 도우미 생성 실패", error instanceof Error ? error.name : "UnknownError");
    return internalError("초안을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}
