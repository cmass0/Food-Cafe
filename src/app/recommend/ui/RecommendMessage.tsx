import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { ChefHat } from "lucide-react";

import { cn } from "@/lib/utils";
import { RecommendResultCarousel } from "./RecommendResultCarousel";
import type { RecommendMessageProps } from "./types";

export function RecommendMessage({ message, isStreaming = false }: RecommendMessageProps) {
  if (message.role === "system") return null;

  const isAssistant = message.role === "assistant";
  const textParts = message.parts.filter((part) => part.type === "text");
  const recommendationParts = message.parts.filter(
    (part) => part.type === "tool-searchRecommendations"
  );

  return (
    <article className={cn("flex w-full gap-3", isAssistant ? "justify-start" : "justify-end")}>
      {isAssistant ? (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-200 bg-white text-[#34783f]">
          <ChefHat className="h-5 w-5" />
        </div>
      ) : null}
      <Message
        from={message.role}
        className={cn(
          isAssistant ? "max-w-[calc(100%-3.25rem)]" : "ml-auto w-fit max-w-[85%] items-end"
        )}
      >
        <MessageContent
          className={cn(
            "gap-3 rounded-2xl px-4 py-3 leading-6",
            isAssistant
              ? "w-full bg-zinc-100 text-zinc-900"
              : "w-fit max-w-full break-words group-[.is-user]:rounded-2xl group-[.is-user]:bg-emerald-50 text-zinc-900"
          )}
        >
          {textParts.map((part, index) =>
            isAssistant ? (
              <MessageResponse
                key={`${message.id}-text-${index}`}
                className="[&_ol]:pl-6 [&_ul]:pl-6"
                isAnimating={isStreaming}
              >
                {part.text}
              </MessageResponse>
            ) : (
              <p key={`${message.id}-text-${index}`} className="whitespace-pre-wrap">
                {part.text}
              </p>
            )
          )}

          {/* Tool 결과도 같은 UI 메시지 스트림에 포함된다. 검색이 끝난 순간
              반환된 레시피·조합 객체를 카드 캐러셀로 바꿔 렌더링한다. */}
          {recommendationParts.map((part) => {
            if (part.state === "output-available") {
              return <RecommendResultCarousel key={part.toolCallId} items={part.output.items} />;
            }

            if (part.state === "output-error") {
              return (
                <p key={part.toolCallId} className="text-sm text-red-600">
                  추천 목록을 불러오지 못했어요.
                </p>
              );
            }

            return (
              <p
                key={part.toolCallId}
                className="animate-pulse text-sm text-zinc-500"
                role="status"
              >
                FoodCafe에서 어울리는 메뉴를 찾고 있어요…
              </p>
            );
          })}
        </MessageContent>
      </Message>
    </article>
  );
}
