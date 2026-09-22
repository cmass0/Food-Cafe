"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { loadRecommendMessages, saveRecommendMessages } from "./session";
import type { RecommendSessionOptions } from "./types";

export function useRecommendSession({ messages, setMessages }: RecommendSessionOptions) {
  const [isRestored, setIsRestored] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const latestMessages = useRef(messages);
  const pendingSave = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let active = true;

    void loadRecommendMessages().then((savedMessages) => {
      if (!active) return;
      latestMessages.current = savedMessages;
      setMessages(savedMessages);
      setIsRestored(true);
    });

    return () => {
      active = false;
    };
  }, [setMessages]);

  useEffect(() => {
    // 복원 전의 빈 messages로 기존 저장값을 덮어쓰지 않는다.
    if (!isRestored) return;
    latestMessages.current = messages;

    // 토큰마다 동기식 Storage 쓰기를 하지 않고 짧은 간격으로 묶는다.
    pendingSave.current = setTimeout(() => {
      setStorageUnavailable(!saveRecommendMessages(messages));
    }, 250);

    return () => clearTimeout(pendingSave.current);
  }, [isRestored, messages]);

  useEffect(() => {
    if (!isRestored) return;

    const flush = () => {
      clearTimeout(pendingSave.current);
      saveRecommendMessages(latestMessages.current);
    };
    window.addEventListener("pagehide", flush);

    return () => {
      window.removeEventListener("pagehide", flush);
      // 카드 클릭에 따른 라우트 이동과 F5 모두, 예약된 저장을 즉시 마무리한다.
      flush();
    };
  }, [isRestored]);

  const clearSession = useCallback(() => {
    clearTimeout(pendingSave.current);
    latestMessages.current = [];
    setStorageUnavailable(!saveRecommendMessages([]));
  }, []);

  return { isRestored, storageUnavailable, clearSession };
}
