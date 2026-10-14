import { badRequest, respondWithServerQueryError } from "@/lib/errors/api-response";
import { getRecommendLanguageModel } from "@/lib/ai/model";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { createRecommendAgent } from "@/features/recommend/agent";
import { createAgentUIStreamResponse } from "ai";
import { z } from "zod";

const recommendChatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(30),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("잘못된 JSON 형식입니다.");
    }

    const parsed = recommendChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("대화 메시지 형식이 올바르지 않습니다.");
    }

    // 채팅은 비로그인 사용자도 사용할 수 있지만, 검색 RPC 자체를 anon에 공개하지는 않는다.
    // service role 키는 server-only 모듈 안에 머물고 브라우저에는 전달되지 않는다.
    const client = getAdminSupabase();
    const agent = createRecommendAgent({
      client,
      model: getRecommendLanguageModel(),
    });

    return createAgentUIStreamResponse({
      agent,
      uiMessages: parsed.data.messages,
      abortSignal: request.signal,
      timeout: { totalMs: 30_000 },
    });
  } catch (error) {
    return respondWithServerQueryError(error, "레시피 추천 요청 실패");
  }
}
