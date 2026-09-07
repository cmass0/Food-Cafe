"use client";

import { useRef, type FormEvent } from "react";

// 버튼 비활성화가 렌더링되기 전 들어오는 연속 제출도 한 번만 처리한다.
export function useLockedSubmit(handler: (event: FormEvent<HTMLFormElement>) => Promise<void>) {
  const locked = useRef(false);
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    try {
      await handler(event);
    } finally {
      locked.current = false;
    }
  };
}
