import { RECOMMEND_SOURCE_TYPES, type ViewedContent } from "@/domain/recommend/types";

// 조회 기록의 종류는 추천 대상 종류와 같다. 종류가 늘어나면 추천 스키마와 함께 따라간다.

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

// 본 횟수를 저장하기 전에 쌓인 기록이나 손상된 값은 한 번 본 것으로 본다.
function normalizeViewCount(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : 1;
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

  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(isViewedContent)
    .map((item) => ({ ...item, viewCount: normalizeViewCount(item.viewCount) }));
}

// 방금 본 항목을 맨 앞에 두고, 같은 항목의 이전 기록은 지우며 본 횟수를 이어서 센다. 최근 20개만 남긴다.
export function addViewedContent(
  history: readonly ViewedContent[],
  viewed: Omit<ViewedContent, "viewCount">
): ViewedContent[] {
  const previous = history.find(
    (item) => item.sourceType === viewed.sourceType && item.sourceId === viewed.sourceId
  );
  const others = history.filter((item) => item !== previous);
  return [{ ...viewed, viewCount: (previous?.viewCount ?? 0) + 1 }, ...others].slice(
    0,
    VIEW_HISTORY_LIMIT
  );
}
