"use client";

import { useEffect } from "react";

type SourceType = "recipe" | "combo";
type ViewedContent = {
  sourceType: SourceType;
  sourceId: string;
  viewedAt: number;
};

const STORAGE_KEY = "food-cafe:recommend:views:v1";

export default function ViewedContentTracker({
  sourceType,
  sourceId,
}: {
  sourceType: SourceType;
  sourceId: string;
}) {
  useEffect(() => {
    let history: ViewedContent[] = [];

    try {
      const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(parsed)) history = parsed as ViewedContent[];
    } catch {}

    const updated = [
      { sourceType, sourceId, viewedAt: Date.now() },
      ...history.filter((item) => item?.sourceType !== sourceType || item?.sourceId !== sourceId),
    ].slice(0, 20);

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // 저장소를 사용할 수 없어도 상세 화면은 계속 보여준다.
    }
  }, [sourceType, sourceId]);

  return null;
}
