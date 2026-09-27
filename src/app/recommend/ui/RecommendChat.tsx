"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { RotateCcw } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import Section from "@/components/status/Section";
import type { RecommendationCardItem } from "@/domain/recommend/types";
import type { RecommendAgentUIMessage } from "@/features/recommend/agent";
import { RecommendComposer } from "./RecommendComposer";
import { RecommendMessageList } from "./RecommendMessageList";
import { RecommendSidebar } from "./RecommendSidebar";
import type { PopularSidebarState, RecommendSidebarTab } from "./types";
import { useRecommendSession } from "./useRecommendSession";

const EMPTY_SIDEBAR_ITEMS: RecommendationCardItem[] = [];

// 백엔드의 createAgentUIStreamResponse가 보내는 UI 메시지 스트림을 읽는다.
const RECOMMEND_TRANSPORT = new DefaultChatTransport<RecommendAgentUIMessage>({
  api: "/api/recommend",
});

export function RecommendChat() {
  const [draft, setDraft] = useState("");
  const [activeTab, setActiveTab] = useState<RecommendSidebarTab>("personalized");
  const [popular, setPopular] = useState<PopularSidebarState>({ status: "idle", items: [] });
  const { clearError, error, messages, sendMessage, setMessages, status, stop } =
    useChat<RecommendAgentUIMessage>({
      transport: RECOMMEND_TRANSPORT,
    });
  const { isRestored, storageUnavailable, clearSession } = useRecommendSession({
    messages,
    setMessages,
  });
  const isResponding = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (activeTab !== "popular") return;

    const controller = new AbortController();
    setPopular({ status: "loading", items: [] });

    void (async () => {
      try {
        const response = await fetch("/api/recommend/popular", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`인기 추천 조회 실패: ${response.status}`);
        const body = (await response.json()) as { items?: RecommendationCardItem[] };
        if (!Array.isArray(body.items)) throw new Error("인기 추천 응답 형식 오류");
        if (!controller.signal.aborted) setPopular({ status: "success", items: body.items });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("인기 추천 조회 실패", error);
        setPopular({ status: "error", items: [] });
      }
    })();

    return () => controller.abort();
  }, [activeTab]);

  async function handleNewConversation() {
    if (isResponding) {
      await stop();
    }

    clearError();
    clearSession();
    setMessages([]);
    setDraft("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = draft.trim();
    if (!text || isResponding || !isRestored) return;

    clearError();
    setDraft("");
    void sendMessage({ text });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-950">AI 추천</h1>
          <p className="text-sm text-zinc-500">취향에 맞는 한 끼를 함께 찾아요.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!isRestored}
          onClick={handleNewConversation}
        >
          <RotateCcw className="mr-2 h-4 w-4" />새 대화
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-h-[640px] flex-col" aria-label="AI 추천 대화">
          {isRestored ? (
            <Section
              name="recommend.messages"
              title="대화를 표시하지 못했습니다."
              description="계속 표시되지 않으면 위의 '새 대화'로 다시 시작해 주세요. 입력 중인 내용은 유지됩니다."
              resetKeys={[messages[0]?.id]}
              // 메시지는 브라우저 상태라 서버 새로고침으로 바뀌지 않는다. 영역만 다시 그린다.
              onRetry={() => {}}
            >
              <RecommendMessageList messages={messages} status={status} />
            </Section>
          ) : (
            <p className="flex-1 py-6 text-sm text-zinc-500" role="status">
              이전 대화를 불러오는 중이에요…
            </p>
          )}
          {storageUnavailable ? (
            <p className="mb-3 text-sm text-amber-700" role="status">
              브라우저에 대화를 저장할 수 없어 페이지를 벗어나면 대화가 사라질 수 있어요.
            </p>
          ) : null}
          {error ? (
            <p className="mb-3 text-sm text-red-600" role="alert">
              추천을 불러오지 못했어요. 잠시 후 다시 보내주세요.
            </p>
          ) : null}
          <RecommendComposer
            value={draft}
            disabled={!isRestored}
            isLoading={isResponding}
            onChange={setDraft}
            onSubmit={handleSubmit}
          />
        </section>

        <Section
          name="recommend.sidebar"
          title="추천 목록을 표시하지 못했습니다."
          resetKeys={[activeTab]}
        >
          <RecommendSidebar
            activeTab={activeTab}
            items={activeTab === "popular" ? popular.items : EMPTY_SIDEBAR_ITEMS}
            onTabChange={setActiveTab}
            isLoading={
              activeTab === "popular" && (popular.status === "idle" || popular.status === "loading")
            }
            error={activeTab === "popular" && popular.status === "error"}
          />
        </Section>
      </div>
    </main>
  );
}
