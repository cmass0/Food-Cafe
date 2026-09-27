import { listPopularRecipeCards } from "@/domain/recommend/service";
import { internalError, json } from "@/lib/errors/api-response";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    // 집계 RPC만 서버 전용 권한으로 호출한다. 카드 정보는 요청자의 RLS로 다시 읽는다.
    const items = await listPopularRecipeCards(getAdminSupabase(), await getServerSupabase());
    return json({ items });
  } catch (error) {
    console.error("인기 추천 조회 실패", error);
    return internalError("인기 추천을 불러오지 못했습니다.");
  }
}
