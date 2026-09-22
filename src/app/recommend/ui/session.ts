import { safeValidateUIMessages } from "ai";
import { z } from "zod";

import { RECOMMEND_SOURCE_TYPES } from "@/domain/recommend/types";
import type { RecommendAgentUIMessage } from "@/features/recommend/agent";

export const RECOMMEND_SESSION_KEY = "food-cafe:recommend:chat:v1";

// SDK는 Tool output의 내부 구조까지 알지 못한다. 카드 렌더링에 필요한 값은 별도로
// 검사하되, 다음 대화에 필요한 나머지 검색 결과는 버리지 않고 그대로 보존한다.
const recommendationCardsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sourceType: z.enum(RECOMMEND_SOURCE_TYPES),
      title: z.string(),
      summary: z.string().nullable(),
    })
  ),
});

export async function restoreRecommendMessages(
  serialized: string | null
): Promise<RecommendAgentUIMessage[]> {
  if (!serialized) return [];

  try {
    const result = await safeValidateUIMessages<RecommendAgentUIMessage>({
      messages: JSON.parse(serialized),
    });
    if (!result.success) return [];

    for (const message of result.data) {
      for (const part of message.parts) {
        if (
          part.type === "tool-searchRecommendations" &&
          part.state === "output-available" &&
          !recommendationCardsSchema.safeParse(part.output).success
        ) {
          return [];
        }
      }
    }

    return result.data.map((message) => ({
      ...message,
      parts: message.parts.map((part) => {
        if (part.type === "text" || part.type === "reasoning") {
          return { ...part, state: "done" };
        }

        // 저장된 대화 복원은 네트워크 스트림 재개가 아니다. 이동 중 끊긴 검색을
        // 계속 로딩 중으로 표시하거나 자동 재호출하지 않고 종료된 상태로 복원한다.
        if (
          part.type === "tool-searchRecommendations" &&
          part.state !== "output-available" &&
          part.state !== "output-error"
        ) {
          return {
            type: part.type,
            toolCallId: part.toolCallId,
            state: "output-error",
            input: undefined,
            errorText: "페이지를 이동하여 추천 검색이 중단됐습니다. 다시 요청해 주세요.",
          };
        }

        return part;
      }),
    }));
  } catch {
    // 예전 형식이나 깨진 JSON 때문에 채팅 화면 전체가 실패하지 않게 한다.
    return [];
  }
}

export function saveRecommendMessages(messages: RecommendAgentUIMessage[]): boolean {
  try {
    if (messages.length === 0) {
      window.sessionStorage.removeItem(RECOMMEND_SESSION_KEY);
    } else {
      window.sessionStorage.setItem(RECOMMEND_SESSION_KEY, JSON.stringify(messages));
    }
    return true;
  } catch {
    // 저장 차단·용량 초과는 대화 전송까지 막지 않는다.
    return false;
  }
}

export async function loadRecommendMessages(): Promise<RecommendAgentUIMessage[]> {
  try {
    return await restoreRecommendMessages(window.sessionStorage.getItem(RECOMMEND_SESSION_KEY));
  } catch {
    return [];
  }
}
