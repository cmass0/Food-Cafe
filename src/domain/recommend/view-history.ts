import { RECOMMEND_SOURCE_TYPES, type RecommendSourceType } from "@/domain/recommend/types";

// 조회 기록의 종류는 추천 대상 종류와 같다. 종류가 늘어나면 추천 스키마와 함께 따라간다.
export type ViewedContent = {
  sourceType: RecommendSourceType;
  sourceId: string;
  viewedAt: number;
};

export const VIEW_HISTORY_STORAGE_KEY = "food-cafe:recommend:views:v1";
export const VIEW_HISTORY_LIMIT = 20;

function isViewedContent(value: unknown): value is ViewedContent {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    (RECOMMEND_SOURCE_TYPES as readonly unknown[]).includes(item.sourceType) &&
    typeof item.sourceId === "string" &&
    item.sourceId !== "" &&
    typeof item.viewedAt === "number" &&
    Number.isFinite(item.viewedAt)
  );
}

// 저장값이 없거나 손상됐으면 빈 기록으로 보고, 형식이 맞지 않는 항목은 버린다.
export function parseViewHistory(raw: string | null): ViewedContent[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  return Array.isArray(parsed) ? parsed.filter(isViewedContent) : [];
}

// 방금 본 항목을 맨 앞에 두고, 같은 항목의 이전 기록은 지우고, 최근 20개만 남긴다.
export function addViewedContent(
  history: readonly ViewedContent[],
  viewed: ViewedContent
): ViewedContent[] {
  const others = history.filter(
    (item) => item.sourceType !== viewed.sourceType || item.sourceId !== viewed.sourceId
  );
  return [viewed, ...others].slice(0, VIEW_HISTORY_LIMIT);
}
