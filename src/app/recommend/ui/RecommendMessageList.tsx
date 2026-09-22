import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { RecommendAgentUIMessage } from "@/features/recommend/agent";
import { RecommendMessage } from "./RecommendMessage";
import type { RecommendMessageListProps } from "./types";

const WELCOME_MESSAGE = {
  id: "recommend-welcome",
  role: "assistant",
  parts: [{ type: "text", text: "오늘은 어떤 식사를 찾고 계세요?" }],
} satisfies RecommendAgentUIMessage;

export function RecommendMessageList({ messages, status }: RecommendMessageListProps) {
  // 안내 문구는 화면에만 표시해 API 입력 토큰에는 포함하지 않는다.
  const visibleMessages = messages.length > 0 ? messages : [WELCOME_MESSAGE];

  return (
    <Conversation className="min-h-0" aria-live="polite">
      <ConversationContent className="gap-5 px-0 pb-6 pt-1">
        {visibleMessages.map((message, index) => (
          <RecommendMessage
            key={message.id}
            message={message}
            isStreaming={status === "streaming" && index === visibleMessages.length - 1}
          />
        ))}
      </ConversationContent>
      <ConversationScrollButton aria-label="최근 메시지로 이동" />
    </Conversation>
  );
}
