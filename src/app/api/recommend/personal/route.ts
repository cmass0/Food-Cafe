import { personalRecommendationRequestSchema } from "@/domain/recommend/schema";
import { listPersonalizedRecommendationCards } from "@/domain/recommend/service";
import { getRecommendEmbeddingModelId } from "@/lib/ai/model";
import { badRequest, json, respondWithError } from "@/lib/errors/api-response";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

// 조회 기록은 개인 정보라 주소에 남지 않도록 POST 본문으로 받는다.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("잘못된 JSON 형식입니다.");
  }

  const parsed = personalRecommendationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("조회 기록 형식이 올바르지 않습니다.");
  }

  try {
    const readerClient = await getServerSupabase();
    // 좋아요·북마크 가중치에 쓰는 사용자 ID는 본문이 아니라 서버 세션에서만 꺼낸다.
    // 비로그인이면 user가 없고, 본 횟수만으로 추천한다.
    const {
      data: { user },
    } = await readerClient.auth.getUser();

    // 추천 RPC만 서버 전용 권한으로 호출한다. 카드 정보는 요청자의 RLS로 다시 읽는다.
    const items = await listPersonalizedRecommendationCards(getAdminSupabase(), readerClient, {
      items: parsed.data.items,
      userId: user?.id,
      embeddingModelId: getRecommendEmbeddingModelId(),
    });
    return json({ items });
  } catch (error) {
    return respondWithError(error, "맞춤 추천 조회 실패", "맞춤 추천을 불러오지 못했습니다.");
  }
}
