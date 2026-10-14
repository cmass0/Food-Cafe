import { ChevronDown, FileText, MessagesSquare } from "lucide-react";
import type { WritingConversationLogProps } from "./types";

export function WritingConversationLog({ session }: WritingConversationLogProps) {
  const outline = session.response?.outline;
  const turns = session.request.turns;
  return (
    <div className="space-y-3">
      {outline ? (
        <section
          aria-label="현재 초안 구성"
          className="rounded-xl border border-dashed border-green-200 bg-green-50/40 p-4 dark:border-green-900 dark:bg-green-950/20"
        >
          <p className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
            <FileText className="size-3.5" aria-hidden="true" />
            지금까지 정리된 구성
          </p>
          <p className="mt-1.5 font-semibold leading-snug">{outline.title}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {outline.points.map((item, index) => (
              <li
                key={index}
                className="rounded-full bg-background px-2.5 py-1 text-xs ring-1 ring-green-200/70 dark:ring-green-900"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <details className="group rounded-xl border border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 text-xs font-medium text-muted-foreground hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-1.5">
            <MessagesSquare className="size-3.5" aria-hidden="true" />
            대화 기록 · 답변 {turns.length}개
          </span>
          <ChevronDown
            className="size-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <ol className="space-y-4 border-t border-border px-4 py-4 text-sm leading-6">
          <li>
            <p className="text-xs text-muted-foreground">처음 적은 메모</p>
            <p className="mt-1.5 whitespace-pre-wrap break-words rounded-xl bg-muted/60 px-3 py-2">
              {session.request.memo || "아이디어 없이 시작했어요."}
            </p>
          </li>
          {turns.map((turn, index) => (
            <li key={index}>
              <p className="text-xs leading-5 text-muted-foreground">
                <span className="mr-1 font-semibold text-green-700 dark:text-green-400">
                  Q{index + 1}.
                </span>
                {turn.question}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap break-words rounded-xl bg-green-600/10 px-3 py-2">
                {turn.answer}
              </p>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
