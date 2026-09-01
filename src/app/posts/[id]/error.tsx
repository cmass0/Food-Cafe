"use client";

import PageErrorScreen from "@/components/status/PageErrorScreen";

type PostDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PostDetailError({ error, reset }: PostDetailErrorProps) {
  return (
    <PageErrorScreen
      error={error}
      reset={reset}
      title="게시글을 불러오지 못했습니다"
      logContext="post-detail"
    />
  );
}
