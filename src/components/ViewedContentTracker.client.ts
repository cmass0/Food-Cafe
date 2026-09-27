"use client";

import { useEffect } from "react";

import {
  addViewedContent,
  parseViewHistory,
  VIEW_HISTORY_STORAGE_KEY,
} from "@/domain/recommend/view-history";
import type { RecommendSourceType } from "@/domain/recommend/types";

export default function ViewedContentTracker({
  sourceType,
  sourceId,
}: {
  sourceType: RecommendSourceType;
  sourceId: string;
}) {
  useEffect(() => {
    try {
      const history = parseViewHistory(sessionStorage.getItem(VIEW_HISTORY_STORAGE_KEY));
      const updated = addViewedContent(history, { sourceType, sourceId, viewedAt: Date.now() });
      sessionStorage.setItem(VIEW_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // 저장소를 사용할 수 없어도 상세 화면은 계속 보여준다.
    }
  }, [sourceType, sourceId]);

  return null;
}
