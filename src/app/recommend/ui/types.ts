import type { ChatStatus } from "ai";
import type { FormEvent } from "react";

import type { RecommendationCandidate } from "@/domain/recommend/types";
import type { RecommendAgentUIMessage } from "@/features/recommend/agent";

export type RecommendSidebarTab = "personalized" | "popular";

export type RecommendSessionOptions = {
  messages: RecommendAgentUIMessage[];
  setMessages: (messages: RecommendAgentUIMessage[]) => void;
};

export type RecommendMessageProps = {
  message: RecommendAgentUIMessage;
  isStreaming?: boolean;
};

export type RecommendMessageListProps = {
  messages: RecommendAgentUIMessage[];
  status: ChatStatus;
};

export type RecommendResultCardProps = {
  item: RecommendationCandidate;
};

export type RecommendResultCarouselProps = {
  items: RecommendationCandidate[];
};

export type RecommendSidebarProps = {
  activeTab: RecommendSidebarTab;
  items: RecommendationCandidate[];
  onTabChange: (tab: RecommendSidebarTab) => void;
};

export type RecommendComposerProps = {
  value: string;
  disabled?: boolean;
  isLoading?: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};
