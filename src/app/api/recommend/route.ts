import { badRequest, json, respondWithServerQueryError } from "@/lib/errors/api-response";
import { getRecommendLanguageModel } from "@/lib/ai/model";
import { resolveClientIpKey } from "@/lib/client-ip";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { createRecommendAgent } from "@/features/recommend/agent";
import {
  MAX_RECOMMEND_REQUEST_LENGTH,
  RECOMMEND_LIMIT_ERRORS,
  RECOMMEND_LIMIT_MESSAGES,
} from "@/features/recommend/limits";
import { consumeRecommendChatCall, resolveRecommendChatSubject } from "@/features/recommend/usage";
import { createAgentUIStreamResponse } from "ai";
import { z } from "zod";

const recommendChatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(30),
});

export async function POST(request: Request) {
  try {
    // 브라우저는 매 질문마다 대화 기록 전체를 보낸다. 기록을 부풀린 요청은 AI에 넘기기 전에 막는다.
    const rawBody = await request.text();
    if (rawBody.length > MAX_RECOMMEND_REQUEST_LENGTH) {
      return json(
        {
          error: RECOMMEND_LIMIT_ERRORS.conversation,
          message: RECOMMEND_LIMIT_MESSAGES.conversation,
        },
        413
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return badRequest("잘못된 JSON 형식입니다.");
    }

    const parsed = recommendChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("대화 메시지 형식이 올바르지 않습니다.");
    }

    // 사용자 ID는 본문이 아니라 서버 세션에서만 꺼낸다. 비로그인이면 user가 없고 IP로 센다.
    const {
      data: { user },
    } = await (await getServerSupabase()).auth.getUser();

    // 채팅은 비로그인 사용자도 사용할 수 있지만, 검색 RPC 자체를 anon에 공개하지는 않는다.
    // service role 키는 server-only 모듈 안에 머물고 브라우저에는 전달되지 않는다.
    const client = getAdminSupabase();
    const subject = resolveRecommendChatSubject(
      user?.id ?? null,
      resolveClientIpKey(request.headers)
    );
    const remaining = await consumeRecommendChatCall(client, subject);
    if (remaining === null) {
      return json(
        {
          error: RECOMMEND_LIMIT_ERRORS.daily,
          message: subject.signedIn
            ? RECOMMEND_LIMIT_MESSAGES.dailySignedIn
            : RECOMMEND_LIMIT_MESSAGES.dailyAnonymous,
        },
        429
      );
    }

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
