"use client";

import { useEffect, useId, useRef } from "react";
import {
  ArrowRight,
  ArrowUp,
  Check,
  CircleAlert,
  CircleCheck,
  FileText,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WRITING_ASSISTANT_COPY } from "./copy";
import { MAX_WRITING_QUESTIONS } from "@/features/writing-assistant/schema";
import { WritingAssistantIntro } from "./WritingAssistantIntro";
import { WritingConversationLog } from "./WritingConversationLog";
import { WritingDraftPreview } from "./WritingDraftPreview";
import type { WritingAssistantPanelProps } from "./types";

export function WritingAssistantPanel({
  kind,
  session,
  pending,
  error,
  applied,
  input,
  onInputChange,
  onStart,
  onAnswer,
  onFinish,
  onReset,
  onRetry,
  onApply,
}: WritingAssistantPanelProps) {
  const preview = WRITING_ASSISTANT_COPY[kind];
  const inputId = useId();
  const noticeId = useId();
  const scrollArea = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLHeadingElement>(null);
  const question = session?.response?.question;
  const started = Boolean(session);
  const completed = Boolean(session?.response?.draft && !question);
  const answerCount = session?.request.turns.length ?? 0;

  useEffect(() => {
    if (scrollArea.current) scrollArea.current.scrollTop = 0;
    // 새 질문과 완료 상태를 키보드·스크린리더 사용자도 바로 확인할 수 있게 한다.
    if (started && status.current?.getClientRects().length) {
      status.current.focus({ preventScroll: true });
    }
  }, [started, answerCount, completed]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card text-card-foreground">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-4 pr-16 xl:pr-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
          <Sparkles className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold leading-5 tracking-tight">작성 도우미</h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {completed
              ? "초안이 준비됐어요"
              : started
                ? "초안을 다듬는 중이에요"
                : "생각을 정리하고, 초안을 완성해요"}
          </p>
        </div>
        {started || pending ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="도우미 다시 시작"
            title="도우미 다시 시작"
            onClick={onReset}
            className="h-8 shrink-0 gap-1.5 px-2 text-xs text-muted-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            다시 시작
          </Button>
        ) : null}
      </header>

      <div
        ref={scrollArea}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-6"
      >
        {!session ? (
          <WritingAssistantIntro kind={kind} pending={pending} onUseExample={onInputChange} />
        ) : (
          <>
            {question ? (
              <section aria-label="현재 질문">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold tabular-nums text-green-700 dark:text-green-400">
                      질문 {answerCount + 1}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        / {MAX_WRITING_QUESTIONS}
                      </span>
                    </span>
                    <span className="flex gap-1" aria-hidden="true">
                      {Array.from({ length: MAX_WRITING_QUESTIONS }, (_, index) => (
                        <span
                          key={index}
                          className={cn(
                            "h-1.5 w-3.5 rounded-full",
                            index < answerCount
                              ? "bg-green-600"
                              : index === answerCount
                                ? "bg-green-300 dark:bg-green-800"
                                : "bg-muted"
                          )}
                        />
                      ))}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onFinish}
                    disabled={pending}
                    title="입력 중인 답변까지 반영해 초안을 만들어요"
                    className="-mr-2 h-7 gap-1 px-2 text-xs text-muted-foreground"
                  >
                    여기까지 초안 보기
                  </Button>
                </div>

                <p className="mt-5 text-xs font-medium text-muted-foreground">{question.topic}</p>
                <h3
                  ref={status}
                  tabIndex={-1}
                  className="mt-1 text-lg font-semibold leading-7 tracking-tight focus-visible:outline-none"
                >
                  {question.text}
                </h3>

                {question.options.length > 0 ? (
                  <div className="mt-4 grid gap-2">
                    {question.options.map((option, index) => {
                      const selected = input === option;
                      return (
                        <Button
                          key={index}
                          disabled={pending}
                          type="button"
                          variant="outline"
                          aria-pressed={selected}
                          onClick={() => onInputChange(option)}
                          className="h-auto min-h-11 justify-start gap-3 whitespace-normal rounded-xl px-3.5 py-2.5 text-left font-normal hover:border-green-300 hover:bg-green-50/50 aria-pressed:border-green-600 aria-pressed:bg-green-50 aria-pressed:text-green-900 dark:hover:border-green-800 dark:hover:bg-green-950/30 dark:aria-pressed:bg-green-950/40 dark:aria-pressed:text-green-200"
                        >
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded-full border",
                              selected
                                ? "border-green-600 bg-green-600 text-white"
                                : "border-muted-foreground/40"
                            )}
                            aria-hidden="true"
                          >
                            {selected ? <Check className="size-2.5" strokeWidth={3} /> : null}
                          </span>
                          <span className="min-w-0 leading-5">{option}</span>
                        </Button>
                      );
                    })}
                  </div>
                ) : null}
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  선택지를 고르거나, 아래 입력창에 편하게 답해 주세요.
                </p>
              </section>
            ) : (
              <section aria-label="초안 미리보기" className="space-y-6">
                <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4 ring-1 ring-green-100 dark:bg-green-950/30 dark:ring-green-900">
                  <CircleCheck
                    className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <h3
                      ref={status}
                      tabIndex={-1}
                      className="font-semibold tracking-tight focus-visible:outline-none"
                    >
                      초안을 확인해 보세요
                    </h3>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      AI가 보완한 내용까지 검토하고 폼에 반영해 주세요.
                    </p>
                  </div>
                </div>
                {session.response ? <WritingDraftPreview response={session.response} /> : null}
              </section>
            )}

            <WritingConversationLog session={session} />
          </>
        )}
      </div>

      <footer className="shrink-0 space-y-3 border-t border-border bg-card px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {pending ? (
          <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin text-green-600" aria-hidden="true" />
            AI가 내용을 정리하고 있어요…
          </p>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 py-2 pr-2 pl-3 text-xs text-destructive"
          >
            <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 leading-5">{error}</p>
            {!completed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={onRetry}
                className="h-7 shrink-0 px-2.5 text-xs"
              >
                다시 시도
              </Button>
            ) : null}
          </div>
        ) : null}
        {applied ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs leading-5 text-green-800 dark:bg-green-950/40 dark:text-green-300"
          >
            <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
            폼에 반영했어요. 내용을 검토한 후 직접 저장해 주세요.
          </p>
        ) : null}
        {completed ? (
          <>
            <Button
              type="button"
              disabled={pending || applied}
              onClick={onApply}
              className="h-11 w-full gap-2 rounded-xl"
            >
              <FileText className="size-4" aria-hidden="true" />
              폼에 반영하기
            </Button>
            <p className="text-center text-[11px] leading-4 text-muted-foreground">
              AI 제안은 저장 전에 꼭 확인해 주세요. 대표 이미지는 직접 등록해 주세요.
            </p>
          </>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (pending) return;
              if (!started) onStart();
              else onAnswer(input);
            }}
            className="space-y-2.5"
          >
            <label htmlFor={inputId} className="sr-only">
              {started ? "도우미에게 답변" : `${preview.label} 아이디어 메모`}
            </label>
            <div className="rounded-2xl border border-input bg-background shadow-xs transition-colors focus-within:border-green-500 focus-within:ring-3 focus-within:ring-green-500/15">
              <Textarea
                id={inputId}
                aria-describedby={noticeId}
                value={input}
                disabled={pending}
                onChange={(event) => onInputChange(event.target.value)}
                placeholder={
                  started
                    ? "답변을 적어주세요. 모르겠다면 AI에게 맡겨도 돼요."
                    : preview.placeholder
                }
                maxLength={2000}
                className="max-h-40 min-h-20 resize-none border-0 bg-transparent px-4 pt-3 text-sm leading-6 shadow-none focus-visible:ring-0"
              />
              <div className="flex items-center justify-between gap-2 px-2 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg border-green-200 bg-green-50/60 px-2.5 text-xs font-semibold text-green-700 hover:bg-green-100 hover:text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/60"
                  onClick={() => {
                    if (started) onAnswer("AI에게 맡겼어요.");
                    else onStart();
                  }}
                  disabled={pending}
                >
                  {started ? (
                    <WandSparkles className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Sparkles className="size-3.5" aria-hidden="true" />
                  )}
                  {started ? "AI에게 맡기기" : "아이디어 없이 시작"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={pending || !input.trim()}
                  className="h-8 gap-1.5 rounded-lg px-3"
                >
                  {started ? "답변 보내기" : "질문으로 정리하기"}
                  {started ? (
                    <ArrowUp className="size-3.5" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
            <p
              id={noticeId}
              className="flex items-start gap-1.5 text-[11px] leading-4 text-muted-foreground"
            >
              <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
              메모·답변과 시작 시점의 폼 텍스트를 AI에 전달해요. 이미지는 보내지 않아요.
            </p>
          </form>
        )}
      </footer>
    </div>
  );
}
