import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as comboService from "@/domain/combo/service";
import type { ComboInsertDb, ComboUpdateDb } from "@/domain/combo/types";
import { getRecipesByIds } from "@/domain/recipe/service";

// 조합 저장은 조합 규칙(domain/combo)과 레시피 조회(domain/recipe)를 엮는다.
// 레시피 항목은 요청자 권한으로 다시 읽은 레시피 값으로 저장하고, 읽지 못한 레시피가 있으면 저장하지 않는다.
// 조합을 만들거나 고치는 라우트·서버 액션은 domain/combo 대신 이 함수를 부른다.
function recipesReadableBy(client: SupabaseClient<Database>) {
  return (ids: string[]) => getRecipesByIds(client, ids);
}

export function createCombo(client: SupabaseClient<Database>, input: ComboInsertDb) {
  return comboService.createCombo(client, input, recipesReadableBy(client));
}

export function updateCombo(
  client: SupabaseClient<Database>,
  id: string,
  writerUid: string,
  patch: ComboUpdateDb
) {
  return comboService.updateCombo(client, id, writerUid, patch, recipesReadableBy(client));
}
