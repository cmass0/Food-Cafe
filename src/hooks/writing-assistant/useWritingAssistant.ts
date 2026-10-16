"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { requestWritingTurn } from "@/features/writing-assistant/api";
import type {
  WritingApplyChanges,
  WritingAssistantKind,
  WritingFormBinding,
  WritingRequest,
  WritingSession,
} from "@/features/writing-assistant/types";

export function useWritingAssistant(
  kind: WritingAssistantKind,
  binding: RefObject<WritingFormBinding | null>
) {
  const [session, setSession] = useState<WritingSession | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const failedRequest = useRef<WritingRequest | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function send(request: WritingRequest) {
    if (controller.current) return;
    const active = new AbortController();
    controller.current = active;
    setPending(true);
    setError(null);
    setApplied(false);
    failedRequest.current = request;
    try {
      const response = await requestWritingTurn(request, active.signal);
      // 초기화/언마운트 뒤 도착한 응답은 새 대화에 끼워 넣지 않는다.
      if (active.signal.aborted || controller.current !== active) return;
      setSession({ request, response });
      setInput("");
      failedRequest.current = null;
    } catch (cause) {
      if (!active.signal.aborted) {
        setError(
          cause instanceof Error ? cause.message : "초안을 만들지 못했어요. 다시 시도해 주세요."
        );
      }
    } finally {
      if (controller.current === active) {
        controller.current = null;
        setPending(false);
      }
    }
  }

  function start() {
    const snapshot = binding.current?.snapshot() ?? { formContext: "{}", recipeIds: [] };
    void send({ kind, memo: input.trim(), ...snapshot, turns: [], outline: null, finish: false });
  }

  function answer(value: string, finish = false) {
    if (!session?.response?.question || (!value.trim() && !finish)) return;
    const turns = value.trim()
      ? [
          ...session.request.turns,
          { question: session.response.question.text, answer: value.trim() },
        ]
      : session.request.turns;
    // 고른 레시피는 대화 중에도 폼에서 넣고 뺄 수 있으므로 질문마다 다시 읽는다.
    const recipeIds = binding.current?.snapshot().recipeIds ?? session.request.recipeIds;
    void send({ ...session.request, recipeIds, turns, outline: session.response.outline, finish });
  }

  function reset() {
    controller.current?.abort();
    controller.current = null;
    failedRequest.current = null;
    setSession(null);
    setInput("");
    setPending(false);
    setError(null);
    setApplied(false);
  }

  function apply() {
    if (!session?.response?.draft) return;
    if (binding.current?.apply(session.response)) {
      setApplied(true);
      setError(null);
    } else setError("지금은 폼에 반영할 수 없어요. 저장 중인지 확인해 주세요.");
  }

  return {
    session,
    input,
    setInput,
    pending,
    error,
    applied,
    start,
    answer,
    reset,
    apply,
    finish: () => answer(input, true),
    changesOnApply: (): WritingApplyChanges =>
      (session?.response && binding.current?.changesOnApply?.(session.response)) || {
        removed: [],
        restored: [],
      },
    retry: () => {
      const failed = failedRequest.current;
      if (!failed) return;
      // 실패한 뒤 폼에서 레시피를 넣고 뺐을 수 있으므로 다시 시도할 때도 지금 폼에서 다시 읽는다.
      const recipeIds = binding.current?.snapshot().recipeIds ?? failed.recipeIds;
      void send({ ...failed, recipeIds });
    },
  };
}
