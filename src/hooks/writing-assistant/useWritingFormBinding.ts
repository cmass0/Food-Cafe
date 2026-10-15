"use client";

import { createContext, useContext, useLayoutEffect, type RefObject } from "react";
import type { WritingFormBinding } from "@/features/writing-assistant/types";

export const WritingFormContext = createContext<RefObject<WritingFormBinding | null> | null>(null);

export function useWritingFormBinding(binding: WritingFormBinding) {
  const targetRef = useContext(WritingFormContext);
  // 폼 값은 요청/적용 시점에 읽는다. 폼의 타이핑마다 도우미 전체를 다시 렌더링하지 않는다.
  useLayoutEffect(() => {
    if (!targetRef) return;
    targetRef.current = binding;
    return () => {
      if (targetRef.current === binding) targetRef.current = null;
    };
  }, [targetRef, binding]);
}
