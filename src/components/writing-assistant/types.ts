import type { ReactNode } from "react";
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
