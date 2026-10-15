import type { ReactNode } from "react";
import type { WritingUsage } from "@/features/writing-assistant/api";
import type {
  WritingAssistantKind,
  WritingSession,
  WritingResponse,
} from "@/features/writing-assistant/types";
export type { WritingAssistantKind } from "@/features/writing-assistant/types";

export type WritingAssistantWorkspaceProps = {
  kind: WritingAssistantKind;
  children: ReactNode;
};

export type WritingDraftPreviewProps = { response: WritingResponse };

export type WritingAssistantIntroProps = {
  kind: WritingAssistantKind;
  pending: boolean;
  onUseExample: (example: string) => void;
};

export type WritingConversationLogProps = { session: WritingSession };

export type WritingAssistantPanelProps = {
  kind: WritingAssistantKind;
  session: WritingSession | null;
  // "작성 도우미 시작하기"로 오늘의 대화를 열었는지. 열기 전에는 입력칸 대신 시작 버튼을 보여준다.
  activated: boolean;
  activating: boolean;
  usage: WritingUsage | null;
  onActivate: () => void;
  pending: boolean;
  error: string | null;
  applied: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onStart: () => void;
  onAnswer: (answer: string) => void;
  onFinish: () => void;
  onReset: () => void;
  onRetry: () => void;
  onApply: () => void;
};
