"use client";

import PageErrorScreen from "@/components/status/PageErrorScreen";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: RootErrorProps) {
  return (
    <PageErrorScreen
      error={error}
      reset={reset}
      title="페이지를 불러오지 못했습니다"
      logContext="app"
    />
  );
}
