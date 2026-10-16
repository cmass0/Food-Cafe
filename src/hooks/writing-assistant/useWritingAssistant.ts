"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  fetchWritingUsage,
  requestWritingTurn,
  startWritingSession,
  WritingDailyLimitError,
  type WritingUsage,
} from "@/features/writing-assistant/api";
import { MAX_DAILY_SESSIONS } from "@/features/writing-assistant/limits";
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
  // "작성 도우미 시작하기"로 받은 오늘의 대화 ID. 새로고침하면 사라지고, 그날 사용 1번은 이미 쓴 것이다.
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [usage, setUsage] = useState<WritingUsage | null>(null);
  const [activating, setActivating] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const failedRequest = useRef<WritingRequest | null>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    let ignore = false;
    // 남은 횟수는 안내용이다. 불러오지 못해도 시작할 때 서버가 다시 확인한다.
    fetchWritingUsage()
      .then((value) => {
        if (!ignore) setUsage(value);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  async function activate() {
    if (sessionId || activating) return;
    if (usage?.remaining === 0) {
      setLimitOpen(true);
      return;
    }
    setActivating(true);
    setError(null);
    try {
      const started = await startWritingSession();
      setSessionId(started.sessionId);
      setUsage({ remaining: started.remaining, limit: started.limit });
    } catch (cause) {
      if (cause instanceof WritingDailyLimitError) {
        setUsage({ remaining: 0, limit: usage?.limit ?? MAX_DAILY_SESSIONS });
        setLimitOpen(true);
      } else {
        setError(cause instanceof Error ? cause.message : "작성 도우미를 시작하지 못했어요.");
      }
    } finally {
      setActivating(false);
    }
  }

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
    if (!sessionId) return;
    const snapshot = binding.current?.snapshot() ?? { formContext: "{}", recipeIds: [] };
    void send({
      sessionId,
      kind,
      memo: input.trim(),
      ...snapshot,
      turns: [],
      outline: null,
      finish: false,
    });
  }

  function answer(value: string, finish = false) {
    if (!session?.response?.question || (!value.trim() && !finish)) return;
    const turns = value.trim()
      ? [
          ...session.request.turns,
          { question: session.response.question.text, answer: value.trim() },
        ]
      : session.request.turns;
    // 대화 중에도 폼을 고칠 수 있으므로 질문마다 폼 내용과 고른 레시피를 다시 읽는다.
    const snapshot = binding.current?.snapshot();
    void send({
      ...session.request,
      ...snapshot,
      turns,
      outline: session.response.outline,
      finish,
    });
  }

  // 같은 대화 ID 안에서 처음부터 다시 한다. 오늘 사용 횟수는 더 쓰지 않고, 대화별 AI 호출 상한은 그대로다.
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
    activated: Boolean(sessionId),
    usage,
    activating,
    activate,
    limitOpen,
    setLimitOpen,
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
        restored: [],
      },
    retry: () => {
      const failed = failedRequest.current;
      if (!failed) return;
      // 실패한 뒤 폼을 고쳤을 수 있으므로 다시 시도할 때도 지금 폼에서 다시 읽는다.
      void send({ ...failed, ...binding.current?.snapshot() });
    },
  };
}
