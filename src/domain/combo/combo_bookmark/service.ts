import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";

// 로그인 확인은 호출하는 쪽에서 한 번만 하고 사용자 ID를 넘긴다. 목록 한 번에 인증 서버를 여러 번 부르지 않는다.
export async function buildBookmarkedSetCombo(
  client: SupabaseClient<Database>,
  userId: string,
  comboIds: string[]
): Promise<Set<string>> {
  return repo.fetchBookmarkedComboIds(client, userId, comboIds);
}

export async function isBookmarkedCombo(
  client: SupabaseClient<Database>,
  userId: string,
  comboId: string
): Promise<boolean> {
  const bookmarkedSet = await repo.fetchBookmarkedComboIds(client, userId, [comboId]);
  return bookmarkedSet.has(comboId);
}
