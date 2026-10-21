import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import * as combolikeRepo from "./repository";

// 로그인 확인은 호출하는 쪽에서 한 번만 하고 사용자 ID를 넘긴다. 목록 한 번에 인증 서버를 여러 번 부르지 않는다.
export async function buildLikedSetCombo(
  client: SupabaseClient<Database>,
  userId: string,
  comboIds: string[]
): Promise<Set<string>> {
  return combolikeRepo.fetchLikedCombos(client, userId, comboIds);
}

export async function isLikedCombo(
  client: SupabaseClient<Database>,
  comboId: string,
  userId: string
): Promise<boolean> {
  return combolikeRepo.isLikedCombo(client, comboId, userId);
}
