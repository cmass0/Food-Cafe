"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Section from "@/components/status/Section";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WritingAssistantPanel } from "./WritingAssistantPanel";
import { WRITING_ASSISTANT_COPY } from "./copy";
import type { WritingAssistantWorkspaceProps } from "./types";
import type { WritingFormBinding } from "@/features/writing-assistant/types";
import { MAX_DAILY_SESSIONS, WRITING_LIMIT_MESSAGES } from "@/features/writing-assistant/limits";
import { WritingFormContext } from "@/hooks/writing-assistant/useWritingFormBinding";
import { useWritingAssistant } from "@/hooks/writing-assistant/useWritingAssistant";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function WritingAssistantWorkspace({ kind, children }: WritingAssistantWorkspaceProps) {
  // 패널을 닫거나 화면 크기를 바꿔도 대화가 유지되도록 상태를 두 화면의 공통 부모에 둔다.
  const binding = useRef<WritingFormBinding | null>(null);
  const assistant = useWritingAssistant(kind, binding);
  const [confirmApply, setConfirmApply] = useState(false);
  // 하루 사용 1번을 쓰기 전에 한 번 묻는다. 남은 횟수가 없으면 묻지 않고 바로 안내 창을 띄운다.
  const [confirmStart, setConfirmStart] = useState(false);
  // 확인창을 여는 순간의 폼 기준으로, 반영하면 빠지는 항목을 계산해 둔다.
  const [removedOnApply, setRemovedOnApply] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const preview = WRITING_ASSISTANT_COPY[kind];

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const panel = (
    <WritingAssistantPanel
      kind={kind}
      session={assistant.session}
      input={assistant.input}
      pending={assistant.pending}
      error={assistant.error}
      applied={assistant.applied}
      onInputChange={assistant.setInput}
      onStart={assistant.start}
      onAnswer={assistant.answer}
      onFinish={assistant.finish}
      onReset={assistant.reset}
      onRetry={assistant.retry}
      activated={assistant.activated}
      activating={assistant.activating}
      usage={assistant.usage}
      onActivate={() => {
        if (assistant.usage?.remaining === 0) void assistant.activate();
        else setConfirmStart(true);
      }}
      onApply={() => {
        setRemovedOnApply(assistant.removedOnApply());
        setConfirmApply(true);
      }}
    />
  );

  return (
    <WritingFormContext.Provider value={binding}>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="xl:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-between gap-3 whitespace-normal rounded-2xl border-green-200 bg-green-50/60 p-4 text-left hover:bg-green-50 dark:border-green-900 dark:bg-green-950/20 dark:hover:bg-green-950/40"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
                      <Sparkles className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-semibold">작성 도우미 열기</span>
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        질문에 답하며 초안을 만들어 보세요
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Button>
              </SheetTrigger>
              <SheetContent
                className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
                closeLabel="작성 도우미 닫기"
              >
                <SheetTitle className="sr-only">{preview.label} 작성 도우미</SheetTitle>
                <SheetDescription className="sr-only">
                  최대 다섯 번의 질문으로 초안을 정리합니다.
                </SheetDescription>
                <Section
                  name={`writing-assistant.${kind}.mobile`}
                  title="작성 도우미를 표시하지 못했어요"
                  compact
                >
                  {panel}
                </Section>
              </SheetContent>
            </Sheet>
          </div>
          {children}
        </div>
        <aside
          aria-label={`${preview.label} 작성 도우미`}
          className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:sticky xl:top-24 xl:block xl:h-[calc(100dvh-8rem)] xl:max-h-[50rem] xl:min-h-[28rem]"
        >
          <Section
            name={`writing-assistant.${kind}`}
            title="작성 도우미를 표시하지 못했어요"
            compact
          >
            {panel}
          </Section>
        </aside>
      </div>
      <AlertDialog open={confirmApply} onOpenChange={setConfirmApply}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>초안을 폼에 반영할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              현재 제목·재료 또는 조합 구성·조리 단계 등 텍스트 입력을 초안으로 바꿉니다. 대화 중
              직접 수정한 내용도 바뀌니 먼저 확인해 주세요. 대표 이미지와 유지되는 조합 항목의
              이미지는 보존합니다.
              {kind === "combo" ? " 조합에 넣어 둔 레시피는 그대로 남아요." : ""} 자동으로 저장하지
              않습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {removedOnApply.length > 0 ? (
            <section
              aria-label="반영하면 빠지는 항목"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
            >
              <h3 className="font-semibold">초안에 없어서 폼에서 빠지는 상품</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {removedOnApply.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={assistant.apply}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmStart} onOpenChange={setConfirmStart}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작성 도우미를 시작할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              작성 도우미는 하루 {assistant.usage?.limit ?? MAX_DAILY_SESSIONS}번까지 쓸 수 있어요.
              시작하면 오늘 남은 횟수가 1번 줄고, 새로고침하거나 이 화면을 떠나면 대화가 끝나요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => void assistant.activate()}>
              시작하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={assistant.limitOpen} onOpenChange={assistant.setLimitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{WRITING_LIMIT_MESSAGES.dailyTitle}</AlertDialogTitle>
            <AlertDialogDescription>{WRITING_LIMIT_MESSAGES.daily}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WritingFormContext.Provider>
  );
}
