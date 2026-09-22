import { AuthErrorHelper, badRequest, internalError } from "@/lib/api/route-error";
import { getRecommendLanguageModel } from "@/lib/ai/model";
import { getServerSupabase } from "@/lib/supabase/server";
import { createRecommendAgent } from "@/features/recommend/agent";
import { createAgentUIStreamResponse } from "ai";
import { z } from "zod";

export const runtime = "nodejs";

const recommendChatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(30),
});

export async function POST(request: Request) {
  try {
    const { error: authError } = await AuthErrorHelper();
    if (authError) return authError;

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

    const client = await getServerSupabase();
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
    console.error("레시피 추천 요청 실패", error);
    return internalError();
  }
}
