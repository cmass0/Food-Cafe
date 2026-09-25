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

/**
 * useSingleFlight를 키별로 관리한다.
 * 같은 대상의 버튼이 화면 여러 곳에 동시에 보일 때, 부모에서 한 번 만들어 내려 주면
 * 어느 위치에서 눌러도 같은 키의 요청이 끝나기 전 재실행을 무시한다.
 */
export function useKeyedSingleFlight() {
  const runningRef = useRef(new Set<string>());
  const [running, setRunning] = useState<ReadonlySet<string>>(() => new Set());

  const isRunning = useCallback((key: string) => running.has(key), [running]);

  const run = useCallback(async (key: string, task: () => Promise<void>) => {
    if (runningRef.current.has(key)) return;
    runningRef.current.add(key);
    setRunning(new Set(runningRef.current));
    try {
      await task();
    } finally {
      runningRef.current.delete(key);
      setRunning(new Set(runningRef.current));
    }
  }, []);

  return { isRunning, run };
}

export type KeyedSingleFlight = ReturnType<typeof useKeyedSingleFlight>;
