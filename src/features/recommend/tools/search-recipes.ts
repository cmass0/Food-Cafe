import type { SupabaseClient } from "@supabase/supabase-js";
import { tool } from "ai";

import { recommendRecipeSearchSchema } from "@/domain/recommend/schema";
import { searchRecommendRecipes } from "@/domain/recommend/service";
import type { Database } from "@/types/supabase";

export function createSearchRecommendRecipesTool(client: SupabaseClient<Database>) {
  return tool({
    description: `FoodCafe에 실제로 등록된 공개 레시피를 검색한다.
음식이나 레시피를 추천하거나 FoodCafe 레시피 정보를 말하기 전에 반드시 사용한다.
사용자가 가진 재료와 최대 조리 시간이 있으면 해당 조건을 전달한다.
검색 결과가 없으면 레시피를 지어내지 말고 조건을 완화할지 사용자에게 확인한다.`,
    inputSchema: recommendRecipeSearchSchema,
    execute: async (input) => searchRecommendRecipes(client, input),
  });
}
