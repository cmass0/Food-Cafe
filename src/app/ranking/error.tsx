"use client";

import PageErrorScreen from "@/components/status/PageErrorScreen";

type RankingErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RankingError({ error, reset }: RankingErrorProps) {
  return (
    <PageErrorScreen
      error={error}
      reset={reset}
      title="랭킹을 불러오지 못했습니다"
      logContext="ranking"
    />
  );
}
