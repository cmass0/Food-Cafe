"use client";

import { useCallback, useRef, useState } from "react";

/**
 * 진행 중인 작업이 끝나기 전의 재실행을 무시한다.
 * 좋아요·북마크처럼 현재 상태의 반대를 보내는 버튼은, 응답 전에 다시 누르면
 * 두 요청이 같은 값을 보내 두 번째 클릭의 의도가 사라진다. 응답을 받은 뒤에만 다시 누를 수 있게 한다.
 * ref로 막으므로 상태가 다시 그려지기 전의 같은 순간 두 번째 클릭도 무시된다.
 */
export function useSingleFlight() {
  const runningRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(async (task: () => Promise<void>) => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    try {
      await task();
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }, []);

  return { isRunning, run };
}
