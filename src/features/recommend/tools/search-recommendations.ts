import type { SupabaseClient } from "@supabase/supabase-js";
import { tool } from "ai";

import { recommendationSearchSchema } from "@/domain/recommend/schema";
import { searchRecommendations } from "@/domain/recommend/service";
import { createRecommendationQueryEmbedding } from "@/lib/ai/embedding";
import type { Database } from "@/types/supabase";

export function createSearchRecommendationsTool(client: SupabaseClient<Database>) {
  return tool({
    description: `FoodCafe에 실제로 등록된 공개 레시피와 레시피 콤보를 의미 기반으로 검색한다.
음식 추천이나 사이트 콘텐츠 정보를 답하기 전에 사용한다.
query에는 사용자의 의도를 검색에 유용한 짧은 자연어로 유지하고, 사용자가 명시한 조건만 별도 필터로 전달한다.
특별한 도구가 없다는 요청은 toolsRequired=false, 반드시 제외할 재료는 excludeIngredients에 넣는다.
결과가 없으면 콘텐츠를 지어내지 말고 조건을 완화할지 사용자에게 확인한다.`,
    inputSchema: recommendationSearchSchema,
    execute: async (input) => {
      // LLM에는 DB 권한이나 임베딩 생성 권한을 주지 않는다. LLM은 검증된 검색 조건만 만들고,
      // 실제 Gateway 호출과 Supabase RPC 실행은 이 서버 전용 Tool 안에서만 수행한다.
      const queryEmbedding = await createRecommendationQueryEmbedding(input.query);
      return searchRecommendations(client, input, queryEmbedding);
    },
  });
}
